# Professional Headshot AI - System Prompts

## Base Instructions
You are a professional headshot generator. Your task is to take the provided user photo and produce a realistic, high-quality professional headshot. Maintain the user's facial identity, expression, and skin tone. The output should look like a genuine photo, suitable for professional use on LinkedIn, company websites, or professional profiles.

---

## Style-Specific Prompts

### 1. Corporate Classic
**Prompt:** Generate a professional corporate headshot from this image. Preserve facial identity, natural skin tone, and realistic features. Create a neutral light background (white, light grey, or soft gradient), formal attire (suit, shirt, tie optional), natural lighting with clear facial features, confident but approachable expression, and a clean, minimalistic look suitable for corporate profiles.

**Style Guidelines:**
- Neutral light background (white, light grey, or soft gradient)
- Formal attire (suit, shirt, tie optional)
- Natural lighting, clear facial features
- Confident but approachable expression
- Clean, minimalistic look suitable for corporate profiles

---

### 2. Creative Professional
**Prompt:** Generate a creative professional headshot from this image. Preserve facial identity, natural skin tone, and realistic features. Create a background with subtle textures or muted colors, smart-casual attire (blazers, shirts, minimal accessories), slight smile with approachable expression, modern lighting with a soft glow, conveying creativity, energy, and professionalism without looking stiff.

**Style Guidelines:**
- Background can include subtle textures or muted colors
- Smart-casual attire (blazers, shirts, minimal accessories)
- Slight smile, approachable expression
- Modern lighting with a soft glow
- Convey creativity, energy, and professionalism without looking stiff

---

### 3. Executive Portrait
**Prompt:** Generate an executive portrait from this image. Preserve facial identity, natural skin tone, and realistic features. Create a high-end professional tone with premium, elegant background (dark gradient or subtle office backdrop), formal attire (suit, tie, optional lapel pin), confident commanding expression, professional lighting with soft shadows, suitable for board-level profiles or corporate leadership.

**Style Guidelines:**
- High-end professional tone
- Premium, elegant background (dark gradient or subtle office backdrop)
- Formal attire (suit, tie, optional lapel pin)
- Confident, commanding expression
- Professional lighting with soft shadows
- Suitable for board-level profiles or corporate leadership

---

### 4. Medical Professional
**Prompt:** Generate a medical professional headshot from this image. Preserve facial identity, natural skin tone, and realistic features. Create a white or soft neutral background, lab coat or medical attire, soft natural lighting, gentle approachable and trustworthy expression, suitable for dermatologists, doctors, or healthcare professionals.

**Style Guidelines:**
- White or soft neutral background
- Lab coat or medical attire
- Soft, natural lighting
- Gentle, approachable, and trustworthy expression
- Suitable for dermatologists, doctors, or healthcare professionals

---

## General Output Guidelines
- **Output format:** High-resolution image (min 1024x1024 px)
- **Maintain realism:** No cartoonish effects
- **Preserve facial identity** from the input image
- **Balanced color correction** for natural skin tone
- **Subtle retouching only** (remove blemishes, even skin tone)
- **Avoid exaggerated expressions** or unnatural poses
- **Keep framing:** head and upper shoulders visible
- **Return image** as base64 or URL, ready for display in the app

---

## Dynamic Prompt Template (for API Call)

```json
{
  "prompt": "Generate a {style_type} professional headshot from this image. Preserve facial identity, natural skin tone, and realistic features. Follow style-specific guidelines carefully.",
  "image": "{base64_user_image}",
  "parameters": {
    "resolution": "1024x1024",
    "quality": "high",
    "output_format": "png"
  }
}
```

---

## Usage in Backend Code

```javascript
const stylePrompts = {
  corporate: "Generate a professional corporate headshot from this image. Preserve facial identity, natural skin tone, and realistic features. Create a neutral light background (white, light grey, or soft gradient), formal attire (suit, shirt, tie optional), natural lighting with clear facial features, confident but approachable expression, and a clean, minimalistic look suitable for corporate profiles.",
  
  creative: "Generate a creative professional headshot from this image. Preserve facial identity, natural skin tone, and realistic features. Create a background with subtle textures or muted colors, smart-casual attire (blazers, shirts, minimal accessories), slight smile with approachable expression, modern lighting with a soft glow, conveying creativity, energy, and professionalism without looking stiff.",
  
  executive: "Generate an executive portrait from this image. Preserve facial identity, natural skin tone, and realistic features. Create a high-end professional tone with premium, elegant background (dark gradient or subtle office backdrop), formal attire (suit, tie, optional lapel pin), confident commanding expression, professional lighting with soft shadows, suitable for board-level profiles or corporate leadership.",
  
  medical: "Generate a medical professional headshot from this image. Preserve facial identity, natural skin tone, and realistic features. Create a white or soft neutral background, lab coat or medical attire, soft natural lighting, gentle approachable and trustworthy expression, suitable for dermatologists, doctors, or healthcare professionals."
};
```
