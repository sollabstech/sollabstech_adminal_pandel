"use client";

import { useEffect, useRef, useState } from "react";

const MAX_BYTES = 2 * 1024 * 1024;

// A signature as a PNG data URL: draw it on the pad or upload an image.
// Kept in memory only, like the rest of the bill.
export default function SignatureInput({
  label,
  value,
  onChange,
  defaultSrc,
  defaultLabel = "Use default signature",
}: {
  label: string;
  value: string | null;
  onChange: (png: string | null) => void;
  // Optional built-in signature the user can switch back to.
  defaultSrc?: string | null;
  defaultLabel?: string;
}) {
  const [mode, setMode] = useState<"draw" | "upload">("draw");
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);

  // Size the canvas for sharp lines on high-DPI screens.
  useEffect(() => {
    if (mode !== "draw" || value) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
    hasInk.current = false;
  }, [mode, value]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Not critical: drawing still works without capture.
    }
    drawing.current = true;
    const { x, y } = point(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.01, y + 0.01);
    ctx.stroke();
    hasInk.current = true;
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    const { x, y } = point(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function end() {
    drawing.current = false;
  }

  function saveDrawing() {
    const canvas = canvasRef.current;
    if (!canvas || !hasInk.current) {
      setError("Sign in the box first.");
      return;
    }
    setError("");
    onChange(canvas.toDataURL("image/png"));
  }

  function clearPad() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    hasInk.current = false;
    setError("");
  }

  function upload(file: File | undefined) {
    if (!file) return;
    if (file.type !== "image/png") {
      setError("Please choose a PNG image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image is too large (max 2 MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setError("");
      onChange(String(reader.result));
    };
    reader.onerror = () => setError("Could not read that image.");
    reader.readAsDataURL(file);
  }

  const tab = (m: "draw" | "upload", text: string) => (
    <button
      type="button"
      onClick={() => {
        setMode(m);
        setError("");
      }}
      aria-pressed={mode === m}
      className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
        mode === m ? "bg-white text-blue-800 shadow-sm" : "text-slate-600"
      }`}
    >
      {text}
    </button>
  );

  return (
    <div>
      <div className="mb-1.5 text-sm font-medium text-slate-700">{label}</div>

      {value ? (
        <div className="rounded-xl border border-slate-300 bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={`${label} preview`} className="mx-auto h-20 w-auto max-w-full object-contain" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="mt-2 w-full rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Remove / change
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-300 bg-slate-50 p-2">
          {defaultSrc && (
            <button
              type="button"
              onClick={() => {
                setError("");
                onChange(defaultSrc);
              }}
              className="mb-2 w-full rounded-lg border border-blue-300 bg-blue-50 py-2.5 text-sm font-semibold text-blue-800 hover:bg-blue-100"
            >
              {defaultLabel}
            </button>
          )}
          <div className="mb-2 flex gap-1 rounded-lg bg-slate-200/70 p-1">
            {tab("draw", "Draw")}
            {tab("upload", "Upload PNG")}
          </div>

          {mode === "draw" ? (
            <>
              <canvas
                ref={canvasRef}
                onPointerDown={start}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={end}
                aria-label={`${label} drawing pad`}
                className="h-32 w-full touch-none rounded-lg border border-dashed border-slate-400 bg-white"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={clearPad}
                  className="flex-1 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={saveDrawing}
                  className="flex-1 rounded-lg bg-blue-700 py-2.5 text-sm font-semibold text-white"
                >
                  Use signature
                </button>
              </div>
            </>
          ) : (
            <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-400 bg-white text-center text-sm text-slate-600">
              <span className="font-semibold text-blue-700">Choose PNG image</span>
              <span className="text-xs text-slate-400">Transparent background looks best · max 2 MB</span>
              <input
                type="file"
                accept="image/png"
                className="sr-only"
                onChange={(e) => {
                  upload(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
