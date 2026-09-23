import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  X,
  RotateCcw,
  Sparkles,
  Upload,
  Check,
  AlertCircle,
  FlipHorizontal,
  FileText,
  Loader2,
  Receipt,
  ScanLine,
} from 'lucide-react';
import { api, ParsedReceiptData } from '../lib/api';
import { formatCurrency } from '../lib/formatters';

interface ReceiptCameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onReceiptParsed: (data: ParsedReceiptData, receiptImageBase64: string) => void;
}

export const ReceiptCameraScanner: React.FC<ReceiptCameraScannerProps> = ({
  isOpen,
  onClose,
  onReceiptParsed,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [parsedResult, setParsedResult] = useState<ParsedReceiptData | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Check for camera devices
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      }).catch(() => {});
    }
  }, []);

  // Start camera stream
  const startCamera = useCallback(async (mode: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    try {
      // Stop existing stream if running
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      let newStream: MediaStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch (err) {
        // Fallback to any camera if environment facing fails
        console.warn('Falling back to default camera:', err);
        newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      setStream(newStream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch((e) => console.warn('Video play error:', e));
      }
    } catch (err: any) {
      console.error('Failed to start camera:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings or upload an image file instead.'
          : err.message || 'Unable to access camera.'
      );
      setCameraActive(false);
    }
  }, [facingMode, stream]);

  // Stop camera stream cleanly
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  }, [stream]);

  // Handle open / close lifecycle
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, capturedImage]);

  // Flip camera between front and rear
  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture photo from live video canvas
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');

    // Scale canvas to reasonable receipt size (max 1400px)
    let width = video.videoWidth || 1280;
    let height = video.videoHeight || 720;
    const maxDim = 1400;

    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    stopCamera();
    setCapturedImage(dataUrl);
    analyzeWithGemini(dataUrl);
  };

  // Handle file upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        stopCamera();
        setCapturedImage(dataUrl);
        analyzeWithGemini(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Trigger Gemini 3.8 Flash multimodal analysis
  const analyzeWithGemini = async (imageDataUrl: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setParsedResult(null);

    try {
      const result = await api.scanReceiptPhoto(imageDataUrl, 'image/jpeg');
      setParsedResult(result);
    } catch (err: any) {
      console.error('Gemini receipt parse failed:', err);
      setAnalysisError(err.message || 'Gemini could not parse this receipt. Try another photo or enter manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    setParsedResult(null);
    setAnalysisError(null);
    startCamera(facingMode);
  };

  // Confirm and apply parsed data
  const handleApply = () => {
    if (parsedResult && capturedImage) {
      onReceiptParsed(parsedResult, capturedImage);
      handleClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setParsedResult(null);
    setAnalysisError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0A0E17] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Capture Physical Receipt</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-mono">
                  Gemini AI
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                Auto-extracts merchant, amount, date & category
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative flex-1 bg-black overflow-hidden min-h-[360px] sm:min-h-[420px] flex items-center justify-center">
          {/* Hidden Canvas for capture processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* 1. Live Camera Mode */}
          {!capturedImage && (
            <div className="relative w-full h-full min-h-[360px] sm:min-h-[420px] flex items-center justify-center">
              {cameraError ? (
                <div className="p-6 text-center max-w-sm space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Camera Inactive</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">{cameraError}</p>
                  </div>
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      onClick={() => startCamera(facingMode)}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-all"
                    >
                      Retry Camera
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Receipt Photo</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className="w-full h-full object-cover"
                  />

                  {/* Receipt Framing Guide Overlay */}
                  <div className="absolute inset-6 sm:inset-10 border-2 border-emerald-500/40 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                    {/* Corner brackets aesthetic */}
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
                      <div className="w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
                    </div>

                    <div className="text-center py-2 px-3 bg-black/60 backdrop-blur-md rounded-xl mx-auto border border-white/10 max-w-[240px]">
                      <span className="text-[11px] font-medium text-emerald-300 flex items-center justify-center gap-1.5">
                        <ScanLine className="w-3.5 h-3.5 animate-pulse" />
                        Align receipt inside box
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
                      <div className="w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 2. Captured Photo Preview & Analysis Mode */}
          {capturedImage && (
            <div className="relative w-full h-full min-h-[360px] sm:min-h-[420px] flex items-center justify-center bg-zinc-950">
              <img
                src={capturedImage}
                alt="Captured receipt"
                className="w-full h-full object-contain max-h-[460px]"
              />

              {/* Laser Scanning Animation when Gemini is analyzing */}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 space-y-4">
                  {/* Moving scanning beam */}
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-bounce" />

                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 animate-pulse">
                    <Sparkles className="w-7 h-7 animate-spin duration-1000" />
                  </div>

                  <div className="text-center space-y-1">
                    <h4 className="text-sm font-bold text-white">Gemini 3.8 Flash Analyzing...</h4>
                    <p className="text-xs text-zinc-400 font-mono">
                      Extracting merchant, total amount & date
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* File Input fallback */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Footer Controls & Results */}
        <div className="p-4 sm:p-5 bg-[#0D121D] border-t border-zinc-800 space-y-3">
          {/* Live Camera Controls */}
          {!capturedImage && !cameraError && (
            <div className="flex items-center justify-between gap-4">
              {/* Upload file button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-2xl transition-colors border border-zinc-700/60"
                title="Upload image from device"
              >
                <Upload className="w-5 h-5" />
              </button>

              {/* Shutter Button */}
              <button
                type="button"
                onClick={handleCapturePhoto}
                disabled={!cameraActive}
                className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
                title="Capture receipt photo"
              >
                <div className="w-12 h-12 rounded-full border-2 border-black/40 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-black" />
                </div>
              </button>

              {/* Switch Camera Button (if multiple cameras exist) */}
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="p-3 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-2xl transition-colors border border-zinc-700/60"
                title="Switch Camera (Front/Rear)"
              >
                <FlipHorizontal className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Analysis Results Display */}
          {capturedImage && parsedResult && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <Check className="w-4 h-4" />
                    <span>Receipt Parsed Successfully</span>
                  </div>
                  {parsedResult.confidence && (
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {Math.round(parsedResult.confidence * 100)}% match
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                    <span className="text-[10px] text-zinc-400 block">Merchant</span>
                    <strong className="text-white text-xs truncate block">
                      {parsedResult.merchant || 'Unknown Merchant'}
                    </strong>
                  </div>
                  <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                    <span className="text-[10px] text-zinc-400 block">Amount</span>
                    <strong className="text-emerald-400 text-xs font-mono">
                      {parsedResult.amount !== undefined ? formatCurrency(parsedResult.amount, 'INR') : '₹0'}
                    </strong>
                  </div>
                  <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                    <span className="text-[10px] text-zinc-400 block">Date</span>
                    <span className="text-zinc-200 text-xs font-mono">
                      {parsedResult.date || new Date().toISOString().substring(0, 10)}
                    </span>
                  </div>
                  <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                    <span className="text-[10px] text-zinc-400 block">Category</span>
                    <span className="text-zinc-200 text-xs capitalize">
                      {parsedResult.category_id || 'Expense'}
                    </span>
                  </div>
                </div>

                {parsedResult.items_summary && (
                  <p className="text-[11px] text-zinc-400 italic pt-1 border-t border-white/5 truncate">
                    Items: {parsedResult.items_summary}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex-1 py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake</span>
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Apply to Transaction</span>
                </button>
              </div>
            </div>
          )}

          {/* Analysis Error Display */}
          {capturedImage && analysisError && !isAnalyzing && (
            <div className="space-y-3">
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-rose-200">Receipt Extraction Failed</strong>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{analysisError}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake Clearer Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => analyzeWithGemini(capturedImage)}
                  className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Retry AI</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
