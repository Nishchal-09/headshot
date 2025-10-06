import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ArrowLeft, Download, RefreshCw, Palette } from 'lucide-react';
import { toast } from 'sonner';

interface ResultComparisonProps {
  originalImage: string;
  resultImage: string;
  onBackToUpload: () => void;
  onTryAnotherStyle: () => void;
  onRegenerate: () => void;
}

export function ResultComparison({
  originalImage,
  resultImage,
  onBackToUpload,
  onTryAnotherStyle,
  onRegenerate
}: ResultComparisonProps) {
  const [isComparing, setIsComparing] = useState(false);

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      // Fetch the image as a blob to force a download with a nice filename
      const response = await fetch(resultImage, { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch image');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Derive filename from URL or default
      const urlParts = resultImage.split('/');
      const last = urlParts[urlParts.length - 1] || 'headshot.png';
      const filename = last.includes('.') ? last : `${last}.png`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      // Small success toast for feedback
      toast.success('Downloading headshot...');
    } catch (e: any) {
      console.error(e);
      toast.error('Could not download image');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onBackToUpload}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Upload
        </Button>
        
        <h1 className="text-2xl font-semibold text-gray-900">
          Your Professional Headshot
        </h1>
        
        <div className="w-24" /> {/* Spacer for center alignment */}
      </div>

      {/* Image Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Original Image */}
        <Card className="bg-white/70 backdrop-blur-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Before</h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                Original
              </span>
            </div>
            
            <div className="aspect-[3/4] overflow-hidden rounded-xl bg-gray-100">
              <img
                src={originalImage}
                alt="Original photo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </Card>

        {/* Result Image */}
        <Card className="bg-white/70 backdrop-blur-sm border border-gray-200 overflow-hidden ring-2 ring-[#3662E3] ring-opacity-30">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">After</h3>
              <span className="text-sm text-white bg-[#3662E3] px-3 py-1 rounded-full">
                AI Enhanced
              </span>
            </div>
            
            <div className="aspect-[3/4] overflow-hidden rounded-xl bg-gray-100 relative">
              <img
                src={resultImage}
                alt="AI generated headshot"
                className="w-full h-full object-cover"
              />
              
              {/* Subtle enhancement indicator */}
              <div className="absolute top-3 right-3 w-8 h-8 bg-[#3662E3] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">AI</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Mobile Comparison Toggle */}
      <div className="lg:hidden">
        <Card className="bg-white/70 backdrop-blur-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-center mb-4">
              <Button
                variant="outline"
                onClick={() => setIsComparing(!isComparing)}
                className="rounded-xl"
              >
                {isComparing ? 'Show After' : 'Show Before'}
              </Button>
            </div>
            
            <div className="aspect-[3/4] overflow-hidden rounded-xl bg-gray-100">
              <img
                src={isComparing ? originalImage : resultImage}
                alt={isComparing ? 'Original photo' : 'AI generated headshot'}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            </div>
            
            <p className="text-center text-sm text-gray-500 mt-3">
              {isComparing ? 'Before (Original)' : 'After (AI Enhanced)'}
            </p>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button
          onClick={handleDownload}
          className={`bg-[#3662E3] hover:bg-[#2952d3] text-white rounded-xl px-8 py-3 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all duration-200 w-full sm:w-auto ${isDownloading ? 'opacity-90' : ''}`}
          disabled={isDownloading}
        >
          <span className="relative inline-flex items-center">
            <Download className={`w-4 h-4 mr-2 ${isDownloading ? 'animate-bounce' : ''}`} />
            {isDownloading ? 'Preparing download…' : 'Download Headshot'}
          </span>
        </Button>
        
        <Button
          variant="outline"
          onClick={onTryAnotherStyle}
          className="rounded-xl px-6 py-3 w-full sm:w-auto"
        >
          <Palette className="w-4 h-4 mr-2" />
          Try Another Style
        </Button>
        
        <Button
          variant="ghost"
          onClick={onRegenerate}
          className="text-gray-600 hover:text-gray-900 rounded-xl px-6 py-3 w-full sm:w-auto"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Regenerate
        </Button>
      </div>

      {/* Privacy Notice */}
      <div className="text-center">
        <p className="text-sm text-gray-500 bg-gray-50/50 backdrop-blur-sm rounded-xl px-6 py-3 inline-block">
          Images are processed securely and deleted automatically after 24 hours.
        </p>
      </div>
    </div>
  );
}