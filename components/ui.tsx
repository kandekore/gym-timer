"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "bg-white text-slate-900 hover:bg-white/90 active:bg-white/80",
  secondary:
    "bg-white/15 text-white hover:bg-white/25 active:bg-white/30 ring-1 ring-white/30",
  danger: "bg-red-600 text-white hover:bg-red-500 active:bg-red-700",
  ghost: "bg-transparent text-white hover:bg-white/10 ring-1 ring-white/30",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

/** Large, touch-friendly button shared across the controls. */
export function Button({
  variant = "secondary",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={`select-none rounded-2xl px-5 py-3 text-base font-bold transition disabled:opacity-40 disabled:cursor-not-allowed sm:px-6 sm:py-4 sm:text-lg ${VARIANT_CLASS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}

/** Accessible on/off toggle row. */
export function Toggle({ label, checked, onChange, hint }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl bg-slate-800/60 px-4 py-3 text-left ring-1 ring-white/10 hover:bg-slate-800"
    >
      <span>
        <span className="block font-semibold text-white">{label}</span>
        {hint && <span className="block text-sm text-slate-400">{hint}</span>}
      </span>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-emerald-500" : "bg-slate-600"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </span>
    </button>
  );
}

interface StepperProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

/** Number input with large +/- buttons (touch-friendly config). */
export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  unit,
}: StepperProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  return (
    <div className="rounded-xl bg-slate-800/60 p-4 ring-1 ring-white/10">
      <div className="mb-2 font-semibold text-white">{label}</div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(clamp(value - step))}
          className="h-12 w-12 shrink-0 rounded-xl bg-slate-700 text-2xl font-bold text-white hover:bg-slate-600 active:bg-slate-500"
        >
          −
        </button>
        <div className="flex-1 text-center">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isNaN(n)) onChange(clamp(n));
            }}
            className="w-full bg-transparent text-center text-3xl font-black tabular-nums text-white outline-none"
          />
          {unit && <div className="text-sm text-slate-400">{unit}</div>}
        </div>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(clamp(value + step))}
          className="h-12 w-12 shrink-0 rounded-xl bg-slate-700 text-2xl font-bold text-white hover:bg-slate-600 active:bg-slate-500"
        >
          +
        </button>
      </div>
    </div>
  );
}
