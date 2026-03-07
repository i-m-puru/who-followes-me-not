"use client";

import * as React from "react";

export type UploadZipProps = {
  disabled?: boolean;
  onFile: (file: File) => void;
};

export function UploadZip({ disabled, onFile }: UploadZipProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleFile = React.useCallback(
    (file: File | null | undefined) => {
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".zip")) {
        // Let parent handle errors; we only filter obvious mismatches.
        onFile(file);
        return;
      }
      onFile(file);
    },
    [onFile],
  );

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept=".zip,application/zip"
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) setIsDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
          if (disabled) return;
          const file = e.dataTransfer.files?.[0];
          handleFile(file);
        }}
        className={[
          "w-full rounded-2xl border border-slate-200 bg-white p-8 text-left shadow-sm",
          "transition focus:outline-none focus:ring-2 focus:ring-[rgba(221,42,123,0.4)]",
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:bg-slate-50",
          isDragOver
            ? "border-transparent bg-linear-to-r from-[#f58529] via-[#dd2a7b] to-[#515bd4] text-white"
            : "",
        ].join(" ")}
      >
        <div className="flex flex-col gap-3">
          <div>
            <div className="text-lg font-semibold text-slate-900">
              Upload your Instagram export (.zip)
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Drag and drop the ZIP here, or click to choose a file.
            </div>
          </div>
          <div
            aria-hidden="true"
            className="inline-flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-[#f58529] via-[#dd2a7b] to-[#515bd4] text-xs font-semibold text-white shadow-sm">
              .zip
            </div>
            <div className="flex flex-col">
              <span className="font-medium">Drop your Instagram report</span>
              <span className="text-xs text-slate-500">
                Look for the .zip file you downloaded from Accounts Center.
              </span>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            We process everything locally in your browser—nothing is uploaded.
          </div>
        </div>
      </button>
    </div>
  );
}
