"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
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

  const startUpload = async (files: FileList | null) => {
    if (!files?.length) return;

    setUploading(true);
    setError("");

    try {
      const signatureResponse = await fetch("/api/upload", { method: "POST" });
      const signatureData = (await signatureResponse.json()) as UploadSignatureResponse;

      if (!signatureResponse.ok) {
        setError(signatureData.error || t("image_upload_failed"));
        return;
      }

      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
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
    } catch {
      setError(t("image_upload_failed"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
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
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className={className}>
          {uploading ? t("uploading_images") : buttonLabel}
        </button>
        {enableCamera ? (
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
            className="btn-ghost inline-flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            {t("take_photo")}
          </button>
        ) : null}
      </div>
      {error ? <p className="text-[12px] text-fb-pink">{error}</p> : null}
    </div>
  );
}
