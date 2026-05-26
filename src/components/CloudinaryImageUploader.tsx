"use client";

import { useMemo, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, UploadCloud } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

type UploadSignatureResponse = {
  timestamp: number;
  signature: string;
  cloudName: string;
  apiKey: string;
  folder: string;
  error?: string;
};

type CloudinaryImageUploaderProps = {
  buttonLabel: string;
  onUploaded: (urls: string[]) => void;
  multiple?: boolean;
  className?: string;
  enableCamera?: boolean;
};

const MAX_UPLOAD_SIZE = 8 * 1024 * 1024;

async function resizeImage(file: File, maxSize = 1600) {
  const imageUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Unable to load image."));
      img.src = imageUrl;
    });

    const canvas = document.createElement("canvas");
    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Unable to prepare image.");

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((nextBlob) => {
        if (nextBlob) resolve(nextBlob);
        else reject(new Error("Unable to resize image."));
      }, "image/jpeg", 0.88);
    });

    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export default function CloudinaryImageUploader({
  buttonLabel,
  onUploaded,
  multiple = true,
  className = "btn-ghost",
  enableCamera = false,
}: CloudinaryImageUploaderProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Array<{ name: string; url: string }>>([]);
  const [progressText, setProgressText] = useState("");

  const previewUrls = useMemo(() => selectedFiles.map((file) => file.url), [selectedFiles]);

  const clearPreviews = () => {
    selectedFiles.forEach((file) => URL.revokeObjectURL(file.url));
    setSelectedFiles([]);
  };

  const startUpload = async (files: FileList | null) => {
    if (!files?.length) return;

    const uploadFiles = Array.from(files);
    const invalidFile = uploadFiles.find((file) => !file.type.startsWith("image/") || file.size > MAX_UPLOAD_SIZE);
    if (invalidFile) {
      setError("Use image files under 8 MB each.");
      return;
    }

    setUploading(true);
    setError("");
    setProgressText("");
    clearPreviews();
    const nextPreviews = uploadFiles.map((file) => ({ name: file.name, url: URL.createObjectURL(file) }));
    setSelectedFiles(nextPreviews);

    try {
      const signatureResponse = await fetch("/api/upload", { method: "POST" });
      const signatureData = (await signatureResponse.json()) as UploadSignatureResponse;

      if (!signatureResponse.ok) {
        setError(signatureData.error || t("image_upload_failed"));
        return;
      }

      const uploadedUrls: string[] = [];
      for (let index = 0; index < uploadFiles.length; index += 1) {
        const file = uploadFiles[index];
        setProgressText(`${index + 1}/${uploadFiles.length}`);
        const resizedFile = await resizeImage(file);
        const formData = new FormData();
        formData.append("file", resizedFile);
        formData.append("api_key", signatureData.apiKey);
        formData.append("timestamp", String(signatureData.timestamp));
        formData.append("signature", signatureData.signature);
        formData.append("folder", signatureData.folder);

        const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`, {
          method: "POST",
          body: formData,
        });
        const uploadData = (await uploadResponse.json()) as { secure_url?: string; error?: { message?: string } };

        if (!uploadResponse.ok || !uploadData.secure_url) {
          setError(uploadData.error?.message || t("image_upload_failed"));
          return;
        }

        uploadedUrls.push(uploadData.secure_url);
      }

      onUploaded(uploadedUrls);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      if (cameraInputRef.current) {
        cameraInputRef.current.value = "";
      }
      window.setTimeout(() => {
        nextPreviews.forEach((file) => URL.revokeObjectURL(file.url));
        setSelectedFiles([]);
      }, 800);
    } catch {
      setError(t("image_upload_failed"));
    } finally {
      setUploading(false);
      setProgressText("");
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(event) => void startUpload(event.target.files)}
      />
      {enableCamera ? (
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => void startUpload(event.target.files)}
        />
      ) : null}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          void startUpload(event.dataTransfer.files);
        }}
        className={`rounded-[8px] border border-dashed p-4 transition-colors ${
          dragActive ? "border-fb-pink bg-fb-pink-bg" : "border-border-light bg-[var(--bg-surface)]"
        } ${uploading ? "pointer-events-none opacity-80" : "cursor-pointer"}`}
        aria-label={buttonLabel}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-fb-pink shadow-[var(--shadow-sm)]">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            </div>
            <div>
              <div className="text-[14px] font-semibold text-text-primary">
                {uploading ? t("uploading_images") : buttonLabel}
              </div>
              <div className="mt-1 text-[12px] text-text-muted">
                {uploading ? progressText : multiple ? "Add multiple photos" : "Add one photo"}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                inputRef.current?.click();
              }}
              disabled={uploading}
              className={`${className} inline-flex items-center gap-2`}
            >
              <UploadCloud className="h-4 w-4" />
              {uploading ? progressText || t("uploading_images") : t("upload_product_images")}
            </button>
            {enableCamera ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  cameraInputRef.current?.click();
                }}
                disabled={uploading}
                className="btn-ghost inline-flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                {t("take_photo")}
              </button>
            ) : null}
          </div>
        </div>
        {previewUrls.length ? (
          <div className="mt-4 grid grid-cols-4 gap-2 md:grid-cols-6">
            {selectedFiles.map((file) => (
              <div key={file.url} className="relative aspect-[3/4] overflow-hidden rounded-[6px] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element -- Object URLs are local upload previews, not remote product media. */}
                <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {error ? <p className="text-[12px] text-fb-pink">{error}</p> : null}
    </div>
  );
}
