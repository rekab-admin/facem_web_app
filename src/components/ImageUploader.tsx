"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onFileSelected: (file: File | null) => void;
  disabled?: boolean;
}

export function ImageUploader({ onFileSelected, disabled }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFile(file: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
    onFileSelected(file);
  }

  return (
    <div
      className={cn(
        "flex min-h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-border",
        disabled && "pointer-events-none opacity-60",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFile(e.dataTransfer.files?.[0] ?? null);
      }}
    >
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="Selected preview" className="max-h-56 rounded-md object-contain" />
      ) : (
        <div className="space-y-1">
          <p className="text-sm font-medium">Drag & drop a photo here</p>
          <p className="text-xs text-muted-foreground">Front-facing photo, even lighting, neutral expression</p>
        </div>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="mt-4 text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        {previewUrl ? "Choose a different photo" : "Browse files"}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
