import React from 'react';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Sparkles } from 'lucide-react';

export function ProcessingScreen() {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(timer);
          return 100;
        }
        return Math.min(prev + Math.random() * 15 + 5, 95);
      });
    }, 300);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-white/70 backdrop-blur-sm border border-gray-200 shadow-xl">
        <div className="p-12 text-center space-y-8">
          {/* Animated Icon */}
          <div className="relative">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-blue-600 animate-pulse" />
            </div>
            
            {/* Spinning ring animation */}
            <div className="absolute inset-0 w-24 h-24 mx-auto border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
          </div>
          
          {/* Text Content */}
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold text-gray-900">
              Creating your professional headshot...
            </h2>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              Please wait a few seconds while we enhance your photo using AI.
            </p>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-3">
            <Progress 
              value={progress} 
              className="w-full h-3 bg-gray-200"
            />
            <p className="text-sm text-gray-500">
              {Math.round(progress)}% complete
            </p>
          </div>
          
          {/* Subtle animation elements */}
          <div className="flex justify-center space-x-2 mt-8">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        </div>
      </Card>
      
      {/* Background gradient animation */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 animate-pulse opacity-50"></div>
    </div>
  );
}