"use client";

import { useCallback, useRef, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".csv", ".xlsx"];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface FileDropZoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  uploading?: boolean;
}

export function FileDropZone({ onFileSelected, disabled, uploading }: FileDropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = useCallback(
    (file: File) => {
      setError("");
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        setError(`Unsupported format "${ext}". Use: ${ACCEPTED_EXTENSIONS.join(", ")}`);
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max ${MAX_SIZE_MB} MB.`);
        return;
      }
      setSelectedFile(file);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled || uploading) return;
      const file = e.dataTransfer.files[0];
      if (file) validateAndSelect(file);
    },
    [disabled, uploading, validateAndSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndSelect(file);
      // Reset input so same file can be re-selected
      e.target.value = "";
    },
    [validateAndSelect]
  );

  const clearFile = () => {
    setSelectedFile(null);
    setError("");
  };

  return (
    <div>
      <GlassCard
        variant="inset"
        padding="lg"
        className={cn(
          "relative cursor-pointer transition-all duration-200 border-2 border-dashed",
          dragOver
            ? "border-accent-blue/60 bg-accent-blue/5"
            : "border-white/[0.08] hover:border-white/[0.15]",
          (disabled || uploading) && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        onDragOver={(e: React.DragEvent) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(",")}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled || uploading}
        />

        <div className="flex flex-col items-center gap-3 py-4">
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 text-accent-blue animate-spin" />
              <p className="text-callout text-label-secondary">
                Extracting text & scanning...
              </p>
            </>
          ) : selectedFile ? (
            <>
              <FileText className="h-8 w-8 text-accent-blue" />
              <div className="flex items-center gap-2">
                <p className="text-callout text-label-primary font-medium">
                  {selectedFile.name}
                </p>
                <Badge variant="muted" size="sm">
                  {(selectedFile.size / 1024).toFixed(0)} KB
                </Badge>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  className="text-label-tertiary hover:text-label-primary transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-label-quaternary" />
              <div className="text-center">
                <p className="text-callout text-label-secondary">
                  Drop a file here or <span className="text-accent-blue">browse</span>
                </p>
                <p className="text-caption-1 text-label-quaternary mt-1">
                  PDF, DOCX, TXT, CSV, XLSX &mdash; up to {MAX_SIZE_MB} MB
                </p>
              </div>
            </>
          )}
        </div>
      </GlassCard>

      {error && (
        <p className="text-caption-1 text-accent-red mt-2">{error}</p>
      )}
    </div>
  );
}
