import type { ReactNode } from "react";

export function Mark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="currentColor" className="text-surface-3" />
      <circle cx="16" cy="16" r="8.2" fill="none" stroke="#E39B3C" strokeWidth="1.7" />
      <ellipse cx="16" cy="16" rx="3.3" ry="8.2" fill="none" stroke="#A3988C" strokeWidth="1.2" />
      <circle cx="21" cy="10.6" r="1.7" fill="#E39B3C" />
    </svg>
  );
}

export function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-bg/80 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[85dvh] w-full max-w-md overflow-auto rounded-card border border-line bg-surface p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="font-display text-lg tracking-tight text-balance">{title}</h2>
          <button type="button" onClick={onClose} className="text-sm text-muted" aria-label="Закрыть">
            Закрыть
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SwitchRow({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint?: string;
  on: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex min-h-11 w-full items-center justify-between gap-3 py-1 text-left"
    >
      <span>
        <span className="block text-sm">{label}</span>
        {hint ? <span className="block text-2xs text-faint">{hint}</span> : null}
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full ${on ? "bg-accent" : "bg-surface-3"}`}>
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-fg transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`}
        />
      </span>
    </button>
  );
}

export function SliderRow({
  label,
  value,
  min,
  max,
  step,
  text,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  text: string;
  onChange: (value: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block py-1">
      <span className="flex items-baseline justify-between text-sm">
        <span>{label}</span>
        <span className="text-2xs tabular-nums text-muted">{text}</span>
      </span>
      <input
        className="range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ ["--pct" as string]: `${pct}%` }}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block py-1">
      <span className="mb-1 block text-2xs text-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-2xs text-pretty text-faint">{hint}</span> : null}
    </label>
  );
}

export const fieldClass =
  "w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg outline-none placeholder:text-faint";

export function Section({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-line">
      <button type="button" onClick={onToggle} className="flex h-11 w-full items-center justify-between text-sm">
        <span>{title}</span>
        <span className="text-faint" aria-hidden="true">{open ? "–" : "+"}</span>
      </button>
      {open ? <div className="pb-3">{children}</div> : null}
    </section>
  );
}
