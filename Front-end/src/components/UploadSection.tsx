import React, { useCallback, useState } from 'react';
import { Upload, Camera, X, Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toast } from 'sonner';
import type { HeadshotStyle, UploadedPhoto } from '../App';

interface UploadSectionProps {
  uploadedPhoto: UploadedPhoto | null;
  selectedStyle: HeadshotStyle | null;
  onPhotoUpload: (photo: UploadedPhoto | null) => void;
  onStyleSelect: (style: HeadshotStyle) => void;
  onGenerate: () => void;
  prompt: string;
  onPromptChange: (v: string) => void;
  // Reference image support
  referencePhoto?: UploadedPhoto | null;
  onReferenceUpload?: (photo: UploadedPhoto | null) => void;
}

const styles = [
  { id: 'corporate', name: 'Corporate Classic', description: 'Clean background, formal attire', image: 'https://i.pinimg.com/736x/22/5f/4c/225f4c968155fcd81cc89182f673583b.jpg' },
  { id: 'creative', name: 'Creative Professional', description: 'Modern background, natural light', image: 'https://i.pinimg.com/1200x/63/ae/b7/63aeb7c9f0f981843758935d955ecb40.jpg' },
  { id: 'executive', name: 'Executive Portrait', description: 'Premium, elegant tone', image: 'https://i.pinimg.com/1200x/8b/67/9a/8b679a8e85572fa52abe386fb703c7db.jpg' },
  { id: 'medical', name: 'Medical Professional', description: 'White coat, clinic-like lighting', image: 'https://i.pinimg.com/736x/f2/b5/68/f2b568d847f4a19a2ba5cff185174565.jpg?crop=entropy&cs=tinysrgb&fit=max&fm=jpg' }
];

export function UploadSection({
  uploadedPhoto,
  selectedStyle,
  onPhotoUpload,
  onStyleSelect,
  onGenerate,
  prompt,
  onPromptChange,
  referencePhoto,
  onReferenceUpload
}: UploadSectionProps) {
  // Step 2: Add drag state
  const [isDragOver, setIsDragOver] = useState(false);

  // Step 3: Add drag-and-drop handlers
  const handleDragOver = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = useCallback((e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return toast.error('No file detected');
    if (!file.type.startsWith('image/')) return toast.error('Invalid image type');
    if (file.size > 10 * 1024 * 1024) return toast.error('File too large (max 10MB)');
    const reader = new FileReader();
    reader.onload = () => {
      onPhotoUpload({ file, preview: reader.result as string });
      toast.success('Photo uploaded successfully!');
    };
    reader.onerror = () => toast.error('Error reading file');
    reader.readAsDataURL(file);
  }, [onPhotoUpload]);

  const handleFileSelect = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Invalid image type');
    if (file.size > 10 * 1024 * 1024) return toast.error('File too large (max 10MB)');

    const reader = new FileReader();
    reader.onload = () => {
      onPhotoUpload({ file, preview: reader.result as string });
      toast.success('Photo uploaded successfully!');
    };
    reader.onerror = () => toast.error('Error reading file');
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    onPhotoUpload(null);
  };

  const handleRefFileSelect = (e: any) => {
    if (!onReferenceUpload) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Invalid image type');
    if (file.size > 10 * 1024 * 1024) return toast.error('File too large (max 10MB)');

    const reader = new FileReader();
    reader.onload = () => {
      onReferenceUpload({ file, preview: reader.result as string });
      toast.success('Reference image added');
    };
    reader.onerror = () => toast.error('Error reading file');
    reader.readAsDataURL(file);
  };

  const removeReference = () => {
    if (onReferenceUpload) onReferenceUpload(null);
  };

  return (
  <div className="max-w-4xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
          <span className="text-gray-900">Turn your regular photo into a </span>
          <span className="text-hero-blue text-hero-xl font-semibold">
            Professional Headshot
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Upload your photo, pick a style, and get a polished version in seconds.
        </p>
      </div>

      {/* Upload Area */}
      <div className="space-y-6">
        {!uploadedPhoto ? (
          <Card
            className={`border-2 border-dashed transition-colors duration-200 bg-white/50 backdrop-blur-sm ${
              isDragOver ? 'border-blue-500' : 'border-gray-300 hover:border-blue-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById('file-upload')?.click()}
  style={{ cursor: 'pointer' }}
>
            <div className="p-12 text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">Upload your photo</h3>
                <p className="text-gray-500">Drag and drop your image here, or click to browse</p>
              </div>
              <div>
                <label htmlFor="file-upload">
                  <Button className="bg-[#3662E3] hover:bg-[#2952d3] text-white rounded-xl px-8 py-3">
                    <Camera className="w-4 h-4 mr-2" />
                    Choose Photo
                  </Button>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-gray-400">
                Supported formats: .jpg, .jpeg, .png, .webp
              </p>
            </div>
          </Card>
        ) : (
          <Card className="bg-white/70 backdrop-blur-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Uploaded Photo</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removePhoto}
                  className="text-gray-500 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-start gap-6">
                <div className="relative">
                  <img
                    src={uploadedPhoto.preview}
                    alt="Uploaded photo"
                    className="w-24 h-24 object-cover rounded-xl border border-gray-200"
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="font-medium text-gray-900">{uploadedPhoto.file.name}</p>
                    <p className="text-sm text-gray-500">{(uploadedPhoto.file.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    onClick={() => document.getElementById('change-file')?.click()}
                  >
                    Change Photo
                  </Button>
                  <input id="change-file" type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                </div>
              </div>

              {/* Custom Prompt */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Optional prompt</label>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400">Add a few details to guide the style (kept subtle and natural).</p>
                  <div className="flex items-center gap-2">
                    <input id="ref-upload" type="file" accept="image/*" className="hidden" onChange={handleRefFileSelect} />
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-gray-700"
                      onClick={() => document.getElementById('ref-upload')?.click()}
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add reference
                    </Button>
                  </div>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => onPromptChange(e.target.value)}
                  placeholder="e.g., warm studio lighting, soft clean background, slight smile"
                  className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-sm placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#3662E3] transition"
                  rows={3}
                />

                {referencePhoto && (
                  <div className="mt-3 flex items-center gap-3">
                    <img src={referencePhoto.preview} alt="Reference" className="w-12 h-12 object-cover rounded-md border border-gray-200" />
                    <div className="text-sm text-gray-600 flex-1">
                      <p className="font-medium text-gray-900 truncate">{referencePhoto.file.name}</p>
                      <p className="text-xs">{(referencePhoto.file.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-600" onClick={removeReference}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Style Selection (hidden when reference image provided) */}
      {uploadedPhoto && !referencePhoto && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Select Your Headshot Style
            </h2>
            <p className="text-gray-600">Choose the style that best fits your professional needs</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {styles.map(style => (
              <Card
                key={style.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-blue-100 ${
                  selectedStyle === style.id
                    ? 'ring-2 ring-[#3662E3] shadow-lg shadow-blue-100 bg-blue-50/50'
                    : 'bg-white/70 hover:bg-white/90'
                } backdrop-blur-sm`}
                onClick={() => onStyleSelect(style.id as HeadshotStyle)}
              >
                <div className="p-6">
                  <div className="aspect-[4/5] mb-4 overflow-hidden rounded-xl w-full h-48 flex items-center justify-center bg-gray-100">
                    <img
                      src={style.image}
                      alt={style.name}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900">{style.name}</h3>
                    <p className="text-sm text-gray-600">{style.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Generate Button: enabled if style chosen OR reference provided */}
      {uploadedPhoto && (selectedStyle || referencePhoto) && (
        <div className="text-center">
          <Button
            onClick={onGenerate}
            className="bg-[#3662E3] hover:bg-[#2952d3] text-white rounded-xl px-12 py-4 text-lg font-medium shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all duration-200"
          >
            Generate Professional Headshot
          </Button>
        </div>
      )}
    </div>
  );
}