import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, X, RefreshCw, AlertCircle, Check } from 'lucide-react';

interface BookCoverUploaderProps {
  value: string;
  onChange: (imageUrl: string) => void;
}

export const BookCoverUploader: React.FC<BookCoverUploaderProps> = ({ value, onChange }) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera tracks cleanly on unmount or when camera turns off
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const handleStartCamera = async () => {
    setCameraError(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported on this browser/device. You can choose an image from your gallery instead.');
      return;
    }

    setCameraLoading(true);
    setCameraActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // prefers rear camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraLoading(false);
    } catch (err: any) {
      console.warn('Camera permission or device access error:', err);
      stopCameraStream();
      setCameraActive(false);
      setCameraLoading(false);
      // Graceful error message specified in requirements
      setCameraError('Camera access was not allowed. You can choose an image from your gallery instead.');
    }
  };

  const handleCapturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      const canvas = document.createElement('canvas');
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        onChange(dataUrl);
      }
    } catch (err) {
      console.error('Error capturing image from camera:', err);
    } finally {
      stopCameraStream();
      setCameraActive(false);
    }
  };

  const handleCloseCamera = () => {
    stopCameraStream();
    setCameraActive(false);
    setCameraLoading(false);
  };

  const handleGalleryClick = () => {
    setCameraError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image MIME type
    if (!file.type.startsWith('image/')) {
      setCameraError('Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setCameraError('Image size exceeds 5MB. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
        setCameraError(null);
      }
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be selected again if desired
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    onChange('');
    setCameraError(null);
  };

  return (
    <div className="space-y-3">
      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px]">
        Book Cover Photo
      </label>

      {/* Hidden file input for Choose from Gallery */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Graceful Camera Error / Warning Banner */}
      {cameraError && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium leading-relaxed">{cameraError}</p>
            <button
              type="button"
              onClick={handleGalleryClick}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Choose from Gallery Instead
            </button>
          </div>
          <button
            type="button"
            onClick={() => setCameraError(null)}
            className="text-amber-500 hover:text-amber-700 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Camera Live Viewfinder Modal/Overlay */}
      {cameraActive && (
        <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-3 shadow-lg border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              Capture Physical Book Cover
            </span>
            <button
              type="button"
              onClick={handleCloseCamera}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close camera"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative rounded-xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border border-slate-800">
            {cameraLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 text-xs text-slate-300 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                <span>Initializing camera...</span>
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Viewfinder Target Frame */}
            <div className="absolute inset-6 border-2 border-dashed border-white/50 rounded-xl pointer-events-none flex items-center justify-center">
              <span className="text-[10px] text-white/80 bg-black/50 px-2 py-0.5 rounded font-medium">
                Align Book Cover Inside Frame
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleCloseCamera}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={cameraLoading}
              onClick={handleCapturePhoto}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              Capture Photo
            </button>
          </div>
        </div>
      )}

      {/* Selected Image Preview Mode */}
      {!cameraActive && value ? (
        <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="relative shrink-0">
            <img
              src={value}
              alt="Book cover preview"
              className="w-20 h-28 object-cover rounded-xl border border-slate-200 shadow-xs bg-white"
            />
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-xs">
              <Check className="w-3 h-3 stroke-[3]" />
            </span>
          </div>

          <div className="flex-1 space-y-2">
            <div>
              <p className="text-xs font-bold text-slate-800">Cover Image Attached</p>
              <p className="text-[11px] text-slate-500">Preview of the book cover that will appear in the catalog.</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleStartCamera}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-blue-900" />
                Retake Photo
              </button>
              <button
                type="button"
                onClick={handleGalleryClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-blue-900" />
                Change from Gallery
              </button>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Two Action Options (Take Photo & Choose from Gallery) when no photo is active or set */}
      {!cameraActive && !value && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Option A: Take Photo */}
          <button
            type="button"
            onClick={handleStartCamera}
            className="p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-900 hover:bg-blue-50/40 bg-slate-50/60 transition flex flex-col items-center justify-center text-center gap-2 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-950 flex items-center justify-center group-hover:scale-105 transition">
              <Camera className="w-5 h-5 text-blue-900" />
            </div>
            <div>
              <span className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Take Photo
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Use device camera to snap physical book cover
              </span>
            </div>
          </button>

          {/* Option B: Choose from Gallery */}
          <button
            type="button"
            onClick={handleGalleryClick}
            className="p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-900 hover:bg-blue-50/40 bg-slate-50/60 transition flex flex-col items-center justify-center text-center gap-2 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-950 flex items-center justify-center group-hover:scale-105 transition">
              <ImageIcon className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <span className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Choose from Gallery
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Select existing image from device storage
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
