const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- CONFIG ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyA78W0Wzx319bzLQHO72I1cWU7whpCVQUI';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = 'gemini-2.5-flash-image';
const MAX_W = 100000; // effectively no limit; rely on Gemini policy
const MAX_H = 100000; // effectively no limit; rely on Gemini policy

// System prompt – Two-Image Guided Portrait Generator
const SYSTEM_PROMPT = `Role: Two-Image Guided Portrait Generator

You will always receive exactly TWO inputs:
1) SUBJECT_IMAGE (the person to keep)
2) STYLE_IMAGE (the outfit/style/background to borrow)

Goal:
Generate ONE new, photorealistic image that preserves the SUBJECT_IMAGE person’s identity while transferring the outfit/style cues from STYLE_IMAGE.

Hard rules:
- Keep the SUBJECT’s facial identity (face shape, features, skin tone, hairline, glasses/beard if present) and body proportions. Do NOT copy the STYLE person’s face or identity.
- Transfer from STYLE_IMAGE: outfit design (type, color palette, fabric, pattern, fit), tie/shirt/lapels/accessories, grooming, pose/angle, lighting, and background mood.
- Do NOT change SUBJECT body shape or anatomy. Maintain original shoulder width, torso proportions, and head-to-body ratio. No muscle/weight alterations.
- Pose may be adapted to be similar to STYLE_IMAGE, but must remain plausible for the SUBJECT with consistent limb lengths and perspective.
- Preserve natural skin texture and micro-details (pores, moles, lines). Avoid plastic smoothing or over-retouching.
- Preserve accessories that define identity (glasses, beard/mustache, earrings) unless the user explicitly asks to remove them.
- The generated face must achieve a high perceived identity match to SUBJECT (target similarity ≥ 0.95). If uncertain, bias stronger toward SUBJECT features rather than style.
- Never return or collage either input. Always synthesize a NEW image.
- No text, logos, watermarks, or artifacts. Natural lighting, realistic skin texture, correct hands and buttons, clean edges.
- Default to chest/waist-up portrait, eye-level camera, neutral expression, unless user specifies otherwise.
- If elements conflict, SUBJECT identity wins; style is adapted to fit SUBJECT.
- No explicit, violent, or misleading content; no recreation of a public figure’s likeness from STYLE_IMAGE.

Output:
- Exactly one high-resolution, photorealistic portrait (no borders).

Do not return either input image unchanged. Always produce a newly rendered portrait that is visually distinct while preserving SUBJECT identity.`;

// Tiny helpers to read image dimensions without extra deps
function getPngDims(buf) {
  // PNG IHDR: width @ byte 16-19, height @ 20-23 (big-endian)
  if (buf.length < 24) return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}
function getJpegDims(buf) {
  // Minimal JPEG parser to SOFn marker
  let i = 2; // skip SOI
  while (i + 1 < buf.length) {
    if (buf[i] !== 0xFF) { i++; continue; }
    const marker = buf[i + 1];
    i += 2;
    if (marker === 0xD9 || marker === 0xDA) break; // EOI or SOS
    if (i + 1 >= buf.length) break;
    const len = buf.readUInt16BE(i);
    if (len < 2) break;
    if (marker >= 0xC0 && marker <= 0xC3) {
      // SOF0..SOF3: height and width after precision byte
      if (i + 7 <= buf.length) {
        const h = buf.readUInt16BE(i + 3);
        const w = buf.readUInt16BE(i + 5);
        return { w, h };
      }
      break;
    }
    i += len;
  }
  return null;
}
function getWebpDims(buf) {
  // RIFF....WEBP VP8X/VP8/VP8L parsing (basic VP8X)
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  // Try VP8X extended header at 12..
  const chunkId = buf.toString('ascii', 12, 16);
  if (chunkId === 'VP8X') {
    // width-1 at bytes 24-26 little-endian 24 bits, height-1 at 27-29
    if (buf.length >= 30) {
      const w = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
      const h = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
      return { w, h };
    }
  }
  return null;
}
function getDims(buf, ext) {
  if (ext === '.png') return getPngDims(buf);
  if (ext === '.jpg' || ext === '.jpeg' ) return getJpegDims(buf);
  if (ext === '.webp') return getWebpDims(buf);
  // try generic attempts
  return getPngDims(buf) || getJpegDims(buf) || getWebpDims(buf);
}

// Create uploads folder if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + Date.now() + ext);
  }
});
const upload = multer({ storage: storage });
const uploadRef = multer({ storage: storage });

// Test route
app.get('/', (req, res) => {
  res.send('Hello from Express backend!');
});

// Quick connectivity check to Gemini
app.get('/api/ping', async (_req, res) => {
  try {
    const r = await axios.post(
      `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent`,
      { contents: [{ parts: [{ text: 'ping' }] }] },
      { headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY }, timeout: 15000 }
    );
    res.json({ ok: true, status: r.status });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.response?.data || e.message });
  }
});

// Image upload endpoint
app.post('/api/upload', upload.single('photo'), (req, res) => {
  const style = req.body.style;
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const jobId = req.file.filename;
  res.json({ jobId, style });
});

// Reference image upload endpoint
app.post('/api/upload-ref', uploadRef.single('ref'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No reference file uploaded' });
  }
  const refId = req.file.filename;
  res.json({ refId });
});

// Headshot generation endpoint
app.post('/api/generate', async (req, res) => {
  const { jobId, style, prompt: userPrompt, refId } = req.body;
  if (!jobId) {
    return res.status(400).json({ error: 'Missing jobId' });
  }
  if (!style && !refId) {
    return res.status(400).json({ error: 'Missing style or refId. Provide either a style selection or reference image.' });
  }

  try {
    // Find the uploaded image
    const inputImagePath = path.join(__dirname, 'uploads', jobId);
    const imageBuffer = fs.readFileSync(inputImagePath);
    const imageBase64 = imageBuffer.toString('base64');
    const subjectHash = crypto.createHash('sha256').update(imageBuffer).digest('hex');

    // Detect mime from file extension
    const ext = path.extname(inputImagePath).toLowerCase();
    let inputMime = 'image/jpeg';
    if (ext === '.png') inputMime = 'image/png';
    else if (ext === '.webp') inputMime = 'image/webp';

    // Validate dimensions (max 5000 x 5000)
    const dims = getDims(imageBuffer, ext);
    if (dims && (dims.w > MAX_W || dims.h > MAX_H)) {
      return res.status(400).json({ error: `Image too large: ${dims.w}x${dims.h}. Max allowed is ${MAX_W}x${MAX_H} px.` });
    }

    // Professional prompts for each style
    const stylePrompts = {
      corporate: "Generate a professional corporate headshot from this image. Preserve facial identity, natural skin tone, and realistic features. Create a neutral light background (white, light grey, or soft gradient), formal attire (suit, shirt, tie optional), natural lighting with clear facial features, confident but approachable expression, and a clean, minimalistic look suitable for corporate profiles.",
      creative: "Generate a creative professional headshot from this image. Preserve facial identity, natural skin tone, and realistic features. Create a background with subtle textures or muted colors, smart-casual attire (blazers, shirts, minimal accessories), slight smile with approachable expression, modern lighting with a soft glow, conveying creativity, energy, and professionalism without looking stiff.",
      executive: "Generate an executive portrait from this image. Preserve facial identity, natural skin tone, and realistic features. Create a high-end professional tone with premium, elegant background (dark gradient or subtle office backdrop), formal attire (suit, tie, optional lapel pin), confident commanding expression, professional lighting with soft shadows, suitable for corporate leadership.",
      medical: "Generate a medical professional headshot from this image. Preserve facial identity, natural skin tone, and realistic features. Create a white or soft neutral background, lab coat or medical attire, soft natural lighting, gentle approachable and trustworthy expression, suitable for dermatologists and healthcare professionals."
    };

    // Build prompt based on style or custom
    let prompt = '';
    if (refId) {
      // Reference image mode: minimal prompt
      prompt = typeof userPrompt === 'string' && userPrompt.trim().length > 0
        ? userPrompt.trim()
        : '';
    } else if (style) {
      // Style selection mode
      const basePrompt = stylePrompts[style] || 'Generate a professional headshot from this image.';
      prompt = userPrompt && typeof userPrompt === 'string' && userPrompt.trim().length > 0
        ? `${basePrompt}\nAdditional instructions: ${userPrompt.trim()}`
        : basePrompt;
    }

    console.log('Calling Gemini API:', GEMINI_MODEL);

    // Build contents with explicit subject and optional reference messages
    const buildContents = (enforceChange = false) => {
      const contents = [];
      
      if (refId) {
        // Two-image mode: subject + reference
        const baseInstruction = enforceChange 
          ? 'Generate a NEW photorealistic portrait. Do NOT return either input unchanged.'
          : 'Generate a NEW photorealistic portrait.';
        contents.push({
          role: 'user',
          parts: [
            { text: `${baseInstruction}\n\n${prompt || ''}`.trim() },
            { text: 'IMAGE 1 (SUBJECT): This is the person whose face and identity MUST be preserved. Use this person\'s facial features, skin tone, hairline, glasses, and all distinctive characteristics.' },
            { inline_data: { mime_type: inputMime, data: imageBase64 } },
            { text: 'SUBJECT IDENTITY REINFORCEMENT: The face in the output MUST match the SUBJECT (IMAGE 1). Do not use any facial features from IMAGE 2.' },
            { inline_data: { mime_type: inputMime, data: imageBase64 } }
          ]
        });
        try {
          const refPath = path.join(__dirname, 'uploads', refId);
          const refBuf = fs.readFileSync(refPath);
          const refExt = path.extname(refPath).toLowerCase();
          let refMime = 'image/jpeg';
          if (refExt === '.png') refMime = 'image/png';
          else if (refExt === '.webp') refMime = 'image/webp';
          const refB64 = refBuf.toString('base64');
          const refHash = crypto.createHash('sha256').update(refBuf).digest('hex');
          contents._refHash = refHash;
          contents.push({
            role: 'user',
            parts: [
              { text: 'IMAGE 2 (STYLE REFERENCE ONLY): Borrow ONLY the outfit (suit/shirt/tie), pose, lighting, and background. Do NOT use the face or identity from this image. The face must come from IMAGE 1 (SUBJECT).' },
              { inline_data: { mime_type: refMime, data: refB64 } }
            ]
          });
          console.log('Sending to Gemini: SUBJECT x2 + REFERENCE', { jobId, refId, refBytes: refBuf.length });
        } catch (e) {
          console.warn('Reference image not available:', e.message);
        }
      } else {
        // Style-only mode: single image with text prompt
        contents.push({
          role: 'user',
          parts: [
            { text: prompt },
            { inline_data: { mime_type: inputMime, data: imageBase64 } }
          ]
        });
        console.log('Sending to Gemini: single image with style prompt', { jobId, style });
      }
      return contents;
    };

    async function callModel(enforceChange = false) {
      return await axios.post(
      `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent`,
      {
        system_instruction: { role: 'system', parts: [{ text: SYSTEM_PROMPT }] },
        contents: buildContents(enforceChange)
      },
      { headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY }, timeout: 30000 }
      );
    }

    let contentsFirst = buildContents(false);
    const refHash = contentsFirst._refHash || null;
    delete contentsFirst._refHash;
    let geminiResponse = await axios.post(
      `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent`,
      { system_instruction: { role: 'system', parts: [{ text: SYSTEM_PROMPT }] }, contents: contentsFirst },
      { headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY }, timeout: 30000 }
    );

    console.log('Gemini response status:', geminiResponse.status);

    // Find first returned image data part in any candidate/part with robust fallbacks
    const candidates = geminiResponse.data?.candidates || [];
    let base64Out = null;
    let outMime = 'image/png';

    const tryParseDataUrl = (text) => {
      if (typeof text !== 'string') return null;
      const re = /data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)/i;
      const m = text.match(re);
      if (!m) return null;
      return { mime: m[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : m[1].toLowerCase(), data: m[2] };
    };

    const deepSearchForImage = (node) => {
      if (!node) return null;
      // inline_data branch
      if (node.inline_data && node.inline_data.data) {
        const mime = node.inline_data.mime_type || 'image/png';
        return { data: node.inline_data.data, mime };
      }
      // data URL inside text
      if (typeof node.text === 'string') {
        const parsed = tryParseDataUrl(node.text);
        if (parsed) return { data: parsed.data, mime: parsed.mime };
      }
      // plain string fields could contain data URLs
      if (typeof node === 'string') {
        const parsed = tryParseDataUrl(node);
        if (parsed) return { data: parsed.data, mime: parsed.mime };
      }
      // generic base64-only field
      if (typeof node?.data === 'string' && /^[A-Za-z0-9+/=]+$/.test(node.data) && node.data.length > 100) {
        return { data: node.data, mime: 'image/png' };
      }
      if (Array.isArray(node)) {
        for (const item of node) {
          const r = deepSearchForImage(item);
          if (r) return r;
        }
      } else if (typeof node === 'object') {
        for (const k of Object.keys(node)) {
          const r = deepSearchForImage(node[k]);
          if (r) return r;
        }
      }
      return null;
    };

    // Try structured candidates first
    for (const c of candidates) {
      const parts = c?.content?.parts || [];
      for (const p of parts) {
        const found = deepSearchForImage(p);
        if (found) { base64Out = found.data; outMime = found.mime; break; }
      }
      if (base64Out) break;
    }

    // As a final fallback, deep search entire response
    if (!base64Out) {
      const found = deepSearchForImage(geminiResponse.data);
      if (found) { base64Out = found.data; outMime = found.mime; }
    }

    if (!base64Out) {
      const promptFeedback = geminiResponse.data?.promptFeedback;
      return res.status(502).json({
        error: 'No image returned by model',
        model: GEMINI_MODEL,
        promptFeedback,
        rawSummary: Array.isArray(candidates) ? `candidates=${candidates.length}` : 'no candidates'
      });
    }

    // Decide file extension from mime
    const mimeToExt = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
    const extOut = mimeToExt[outMime] || 'png';
    const resultFilename = `result-${Date.now()}.${extOut}`;
    const resultPath = path.join(__dirname, 'uploads', resultFilename);
    let buf = Buffer.from(base64Out, 'base64');
    const outputHash = crypto.createHash('sha256').update(buf).digest('hex');

    // If the model echoed the original image, retry once with stronger instructions
    if (outputHash === subjectHash || (refHash && outputHash === refHash)) {
      console.warn('Model returned one of the input images; retrying with enforceChange flag');
      const contentsRetry = buildContents(true);
      delete contentsRetry._refHash;
      geminiResponse = await axios.post(
        `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent`,
        { system_instruction: { role: 'system', parts: [{ text: SYSTEM_PROMPT }] }, contents: contentsRetry },
        { headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY }, timeout: 30000 }
      );
      const candidatesRetry = geminiResponse.data?.candidates || [];
      base64Out = null;
      outMime = 'image/png';
      for (const c of candidatesRetry) {
        const parts = c?.content?.parts || [];
        for (const p of parts) {
          const found = deepSearchForImage(p);
          if (found) { base64Out = found.data; outMime = found.mime; break; }
        }
        if (base64Out) break;
      }
      if (!base64Out) {
        return res.status(502).json({ error: 'No image after retry', raw: geminiResponse.data });
      }
      buf = Buffer.from(base64Out, 'base64');
      const retryHash = crypto.createHash('sha256').update(buf).digest('hex');
      if (retryHash === subjectHash || (refHash && retryHash === refHash)) {
        return res.status(502).json({ error: 'Generated image appears identical to one of the inputs after retry' });
      }
    }
    fs.writeFileSync(resultPath, buf);
    if (!fs.existsSync(resultPath) || fs.statSync(resultPath).size === 0) {
      console.error('Saved file is empty. mime:', outMime, 'bytes:', buf.length);
      return res.status(502).json({ error: 'Generated image empty', mime: outMime });
    }

    res.json({ result: resultFilename });
  } catch (error) {
    console.error('Gemini API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate headshot: ' + (error.response?.data?.error?.message || error.message) });
  }
});

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

