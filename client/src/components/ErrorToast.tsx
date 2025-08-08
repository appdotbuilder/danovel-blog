import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ErrorToastProps {
  error: string | null;
  onClose: () => void;
}

export function ErrorToast({ error, onClose }: ErrorToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Allow fade out animation
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, onClose]);

  if (!error) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${
      isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
    }`}>
      <Alert className="max-w-md bg-red-50 border-red-200 shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-2">
            <span className="text-red-600">🚨</span>
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-100 -mt-1 -mr-1"
          >
            ✕
          </Button>
        </div>
      </Alert>
    </div>
  );
}