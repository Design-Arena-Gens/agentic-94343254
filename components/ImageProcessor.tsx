"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { processImage, type OutputFormat } from "../lib/processImage";

interface ProcessedState {
  previewUrl: string;
  filename: string;
  width: number;
  height: number;
  size: number;
  mimeType: string;
  blob: Blob;
}

const OUTPUT_FORMATS: { value: OutputFormat; label: string; description: string }[] = [
  { value: "jpeg", label: "JPEG", description: "Best balance between quality and size" },
  { value: "png", label: "PNG", description: "Lossless images with transparency" },
  { value: "webp", label: "WebP", description: "Modern format with excellent compression" },
  { value: "pdf", label: "PDF", description: "Export as a single-page document" },
];

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) {
    return "-";
  }
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(value > 9 ? 0 : 2)} ${units[exponent]}`;
}

export function ImageProcessor() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number } | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);
  const [maintainAspect, setMaintainAspect] = useState(true);
  const [quality, setQuality] = useState<number>(80);
  const [format, setFormat] = useState<OutputFormat>("jpeg");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processed, setProcessed] = useState<ProcessedState | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const resetState = useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAspect(undefined);
    setCroppedAreaPixels(null);
    setQuality(80);
    setFormat("jpeg");
    setProcessed(null);
    setError(null);
  }, []);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    if (!selectedFile.type.startsWith("image/") && selectedFile.type !== "application/pdf") {
      setError("Please select a valid image or PDF file");
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    const url = URL.createObjectURL(selectedFile);
    objectUrlRef.current = url;
    setFile(selectedFile);
    setImageUrl(url);
    resetState();

    if (selectedFile.type === "application/pdf") {
      setError("PDF import is not supported yet. Please select an image format.");
      setNaturalDimensions(null);
      return;
    }

    const image = new Image();
    image.src = url;
    image.onload = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      setNaturalDimensions({ width, height });
      setTargetWidth(width);
      setTargetHeight(height);
    };
    image.onerror = () => {
      setError("Could not load the selected image.");
      setNaturalDimensions(null);
    };
  }, [resetState]);

  const aspectRatioText = useMemo(() => {
    if (!naturalDimensions) return "";
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(naturalDimensions.width, naturalDimensions.height);
    return `${Math.round(naturalDimensions.width / divisor)}:${Math.round(naturalDimensions.height / divisor)}`;
  }, [naturalDimensions]);

  const handleWidthChange = useCallback(
    (value: number) => {
      if (!naturalDimensions) return;
      setTargetWidth(value);
      if (maintainAspect) {
        const ratio = naturalDimensions.height / naturalDimensions.width;
        setTargetHeight(Math.round(value * ratio));
      }
    },
    [maintainAspect, naturalDimensions]
  );

  const handleHeightChange = useCallback(
    (value: number) => {
      if (!naturalDimensions) return;
      setTargetHeight(value);
      if (maintainAspect) {
        const ratio = naturalDimensions.width / naturalDimensions.height;
        setTargetWidth(Math.round(value * ratio));
      }
    },
    [maintainAspect, naturalDimensions]
  );

  const onCropComplete = useCallback((_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleProcess = useCallback(async () => {
    if (!file || !naturalDimensions) {
      setError("Upload an image to get started");
      return;
    }

    if (targetWidth <= 0 || targetHeight <= 0) {
      setError("Please provide valid output dimensions");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const qualityValue = Math.min(Math.max(quality / 100, 0.01), 1);
      const result = await processImage({
        file,
        targetWidth,
        targetHeight,
        format,
        quality: format === "png" ? 1 : qualityValue,
        cropArea: croppedAreaPixels ?? undefined,
        metadata: { originalName: file.name },
      });

      setProcessed({
        previewUrl: result.url,
        filename: result.filename,
        width: result.width,
        height: result.height,
        size: result.size,
        mimeType: result.mimeType,
        blob: result.blob,
      });
    } catch (processingError) {
      console.error(processingError);
      setError(
        processingError instanceof Error
          ? processingError.message
          : "Something went wrong while processing the image"
      );
    } finally {
      setIsProcessing(false);
    }
  }, [file, naturalDimensions, targetWidth, targetHeight, format, quality, croppedAreaPixels]);

  const handleDownload = useCallback(() => {
    if (!processed) return;
    const link = document.createElement("a");
    link.href = processed.previewUrl;
    link.download = processed.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [processed]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-glow backdrop-blur">
        <header className="mb-6 flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-sky-300">Upload your photo</h2>
          <p className="text-sm text-slate-300">
            Drop a large JPEG, PNG, WebP, HEIC (converted on import), or BMP file to start compressing instantly.
          </p>
        </header>
        <label className="group flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/60 px-6 py-10 text-center transition hover:border-sky-400 hover:bg-slate-900/60">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <span className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-sky-400 shadow-inner shadow-sky-400/20">
            📷
          </span>
          <span className="text-lg font-medium text-slate-100">
            Drop your photo or click to browse
          </span>
          <span className="text-xs text-slate-400 mt-2">
            Supports JPG, PNG, WebP, HEIC*
          </span>
          <span className="mt-3 text-[10px] text-slate-500">
            * HEIC support relies on your browser's decoder. Safari & iOS are fully supported.
          </span>
        </label>

        {naturalDimensions && (
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4">
              <h3 className="text-sm font-semibold text-slate-200">Original size</h3>
              <p className="mt-2 text-sm text-slate-300">
                {naturalDimensions.width} × {naturalDimensions.height} px
              </p>
              {aspectRatioText && (
                <p className="text-xs text-slate-500">Aspect ratio {aspectRatioText}</p>
              )}
              {file && (
                <p className="mt-3 text-xs text-slate-500">{formatBytes(file.size)}</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4">
              <h3 className="text-sm font-semibold text-slate-200">Output dimensions</h3>
              <div className="mt-3 space-y-3">
                <label className="flex items-center justify-between gap-4 text-xs text-slate-400">
                  Width
                  <input
                    type="number"
                    min={1}
                    value={targetWidth}
                    onChange={(event) => handleWidthChange(Number(event.target.value))}
                    className="w-32 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-right text-sm text-slate-100"
                  />
                </label>
                <label className="flex items-center justify-between gap-4 text-xs text-slate-400">
                  Height
                  <input
                    type="number"
                    min={1}
                    value={targetHeight}
                    onChange={(event) => handleHeightChange(Number(event.target.value))}
                    className="w-32 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-right text-sm text-slate-100"
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={maintainAspect}
                    onChange={(event) => setMaintainAspect(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-400 focus:ring-sky-500"
                  />
                  Lock aspect ratio
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={aspect !== undefined}
                    onChange={(event) => setAspect(event.target.checked && naturalDimensions ? naturalDimensions.width / naturalDimensions.height : undefined)}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-400 focus:ring-sky-500"
                  />
                  Crop with locked ratio
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4">
              <h3 className="text-sm font-semibold text-slate-200">Compression</h3>
              <label className="mt-3 block text-xs text-slate-400">
                Quality
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={quality}
                  disabled={format === "png"}
                  onChange={(event) => setQuality(Number(event.target.value))}
                  className="mt-2 w-full"
                />
                <span className="mt-1 inline-flex h-7 items-center rounded-full bg-slate-800 px-3 text-xs font-semibold text-sky-300">
                  {format === "png" ? "Lossless" : `${quality}%`}
                </span>
              </label>
              <div className="mt-4 text-xs text-slate-400">
                <p>Output format</p>
                <div className="mt-2 grid gap-2">
                  {OUTPUT_FORMATS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 transition ${
                        format === option.value
                          ? "border-sky-500/80 bg-sky-500/10"
                          : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                      }`}
                    >
                      <span>
                        <span className="block text-sm font-medium text-slate-100">{option.label}</span>
                        <span className="text-[11px] text-slate-500">{option.description}</span>
                      </span>
                      <input
                        type="radio"
                        name="output-format"
                        checked={format === option.value}
                        onChange={() => setFormat(option.value)}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {imageUrl && naturalDimensions && (
        <section className="rounded-3xl border border-slate-800 bg-slate-950/60 p-8 backdrop-blur">
          <h3 className="text-xl font-semibold text-slate-100">Crop & preview</h3>
          <div className="mt-6 grid gap-6 lg:grid-cols-[3fr_2fr]">
            <div className="relative h-[460px] overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                restrictPosition
                showGrid
                objectFit="contain"
                maxZoom={5}
                minZoom={1}
              />
            </div>
            <div className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="space-y-5">
                <div>
                  <label className="flex items-center justify-between text-xs text-slate-400">
                    Zoom
                    <input
                      type="range"
                      min={1}
                      max={4}
                      step={0.01}
                      value={zoom}
                      onChange={(event) => setZoom(Number(event.target.value))}
                      className="ml-4 flex-1"
                    />
                  </label>
                </div>
                <div className="text-xs text-slate-400">
                  <p className="font-semibold text-slate-200">Cropping tips</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Drag to frame your subject precisely.</li>
                    <li>• Use zoom slider to tighten the crop.</li>
                    <li>• Toggle the aspect lock for perfect ratios.</li>
                  </ul>
                </div>
              </div>
              <button
                onClick={handleProcess}
                disabled={isProcessing}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-glow transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
              >
                {isProcessing ? "Processing…" : "Compress & export"}
              </button>
              {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}
            </div>
          </div>
        </section>
      )}

      {processed && (
        <section className="rounded-3xl border border-slate-800 bg-slate-950/60 p-8 backdrop-blur">
          <h3 className="text-xl font-semibold text-slate-100">Your optimized photo</h3>
          <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_3fr]">
            <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">File name</span>
                <span className="text-slate-100">{processed.filename}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Dimensions</span>
                <span className="text-slate-100">
                  {processed.width} × {processed.height} px
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Output size</span>
                <span className="text-slate-100">{formatBytes(processed.size)}</span>
              </div>
              {file && (
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Savings</span>
                  <span>
                    {(((1 - processed.size / file.size) || 0) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
              <button
                onClick={handleDownload}
                className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-sky-400/50 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-200 transition hover:bg-sky-500/20"
              >
                Download optimized file
              </button>
            </div>
            <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
              {format === "pdf" ? (
                <p className="text-center text-sm text-slate-300">
                  PDF ready to download. Preview not available—open the downloaded file to review.
                </p>
              ) : (
                <img
                  src={processed.previewUrl}
                  alt="Processed preview"
                  className="max-h-[420px] w-auto rounded-2xl border border-slate-800/60 shadow-glow"
                />
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
