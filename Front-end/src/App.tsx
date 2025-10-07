import React, { useState } from 'react';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { ProcessingScreen } from './components/ProcessingScreen';
import { ResultComparison } from './components/ResultComparison';
import { Toaster } from './components/ui/sonner';

export type HeadshotStyle = 'corporate' | 'creative' | 'executive' | 'medical';
export type AppScreen = 'upload' | 'processing' | 'result';

export interface UploadedPhoto {
  file: File;
  preview: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('upload' as AppScreen);
  const [uploadedPhoto, setUploadedPhoto] = useState(null as UploadedPhoto | null);
  const [selectedStyle, setSelectedStyle] = useState(null as HeadshotStyle | null);
  const [resultImage, setResultImage] = useState(null as string | null);
  const [jobId, setJobId] = useState(null as string | null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [referencePhoto, setReferencePhoto] = useState(null as UploadedPhoto | null);
  const [refId, setRefId] = useState(null as string | null);

  const handlePhotoUpload = (photo: UploadedPhoto | null) => {
    if (!photo || !photo.file.name) {
      setUploadedPhoto(null);
      setSelectedStyle(null);
      return;
    }
    setUploadedPhoto(photo);
  };

  const handleStyleSelect = (style: HeadshotStyle) => {
    setSelectedStyle(style);
  };

  const handleGenerateHeadshot = async () => {
    if (!uploadedPhoto || (!selectedStyle && !referencePhoto)) return;

    setCurrentScreen('processing');

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      // Compress images before upload to stay under Vercel limits
      const compressionOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 2048,
        useWebWorker: true
      };

      // 1. Compress and upload the photo
      const compressedPhoto = await imageCompression(uploadedPhoto.file, compressionOptions);
      const formData = new FormData();
      formData.append('photo', compressedPhoto);
      formData.append('style', selectedStyle);
      
      const uploadRes = await axios.post(`${API_BASE}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setJobId(uploadRes.data.jobId);

      // Upload reference image if provided
      let referenceId: string | null = null;
      if (referencePhoto) {
        const compressedRef = await imageCompression(referencePhoto.file, compressionOptions);
        const refForm = new FormData();
        refForm.append('ref', compressedRef);
        const refRes = await axios.post(`${API_BASE}/api/upload-ref`, refForm, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        referenceId = refRes.data.refId;
        setRefId(referenceId);
      }

      // 2. Generate headshot
      const generateRes = await axios.post(`${API_BASE}/api/generate`, {
        jobId: uploadRes.data.jobId,
        style: selectedStyle,
        prompt: customPrompt,
        refId: referenceId
      });

      // 3. Show result
      setResultImage(`${API_BASE}/uploads/${generateRes.data.result}`);
      setCurrentScreen('result');
    } catch (error: any) {
      console.error('Generation error:', error);
      const errorMsg = error.response?.data?.error 
        || error.response?.data?.message 
        || error.message 
        || 'Unknown error occurred';
      alert('Something went wrong! ' + errorMsg);
      setCurrentScreen('upload');
    }
  };

  const handleBackToUpload = () => {
    setCurrentScreen('upload');
    setResultImage(null);
  };

  const handleTryAnotherStyle = () => {
    setSelectedStyle(null);
    setCurrentScreen('upload');
    setResultImage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {currentScreen === 'upload' && (
          <UploadSection
            uploadedPhoto={uploadedPhoto}
            selectedStyle={selectedStyle}
            onPhotoUpload={handlePhotoUpload}
            onStyleSelect={handleStyleSelect}
            onGenerate={handleGenerateHeadshot}
            prompt={customPrompt}
            onPromptChange={setCustomPrompt}
            referencePhoto={referencePhoto}
            onReferenceUpload={setReferencePhoto}
          />
        )}
        
        {currentScreen === 'processing' && <ProcessingScreen />}
        
        {currentScreen === 'result' && uploadedPhoto && resultImage && (
          <ResultComparison
            originalImage={uploadedPhoto.preview}
            resultImage={resultImage}
            onBackToUpload={handleBackToUpload}
            onTryAnotherStyle={handleTryAnotherStyle}
            onRegenerate={handleGenerateHeadshot}
          />
        )}
      </main>
      
      <footer className="text-center py-8 text-gray-500">
        <p className="text-[16px]">
          © 2025 Pro Headshot AI | Powered by{' '}
          <a
            href="https://ubiksolution.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-700"
          >
            UBIK Solutions
          </a>
        </p>
      </footer>
      
      <Toaster />
    </div>
  );
}
