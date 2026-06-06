import type { ReactNode } from 'react';
import { useNav } from '../nav.js';
import './ui.css';

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {ICONS[name]}
    </svg>
  );
}

export type IconName =
  | 'back'
  | 'close'
  | 'moon'
  | 'chart'
  | 'gear'
  | 'play'
  | 'pause'
  | 'check'
  | 'plus'
  | 'trash'
  | 'sparkle';

const ICONS: Record<IconName, ReactNode> = {
  back: <path d="M15 18l-6-6 6-6" />,
  close: <path d="M18 6L6 18M6 6l12 12" />,
  moon: <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />,
  chart: <path d="M4 19V5M4 19h16M9 16V9m5 7V6m5 13v-4" />,
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H3a2 2 0 110-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V3a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z" />
    </>
  ),
  play: <path d="M7 5l12 7-12 7V5z" fill="currentColor" stroke="none" />,
  pause: <path d="M9 5v14M15 5v14" />,
  check: <path d="M20 6L9 17l-5-5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <path d="M3 6h18M8 6V4h8v2m-1 0v14H9V6m-2 0v14a2 2 0 002 2h6a2 2 0 002-2V6" />,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />,
};

/** Top bar with a back affordance and an optional trailing slot. */
export function TopBar({ trailing }: { trailing?: ReactNode }) {
  const nav = useNav();
  return (
    <div className="topbar row between">
      <button
        className="icon-btn"
        onClick={() => (nav.canGoBack ? nav.back() : nav.home())}
        aria-label="Back"
      >
        <Icon name="back" />
      </button>
      <div className="row gap-sm">{trailing}</div>
    </div>
  );
}

/** A horizontal segmented choice (durations, patterns, ambients). */
export function Segmented<T>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <div className="col gap-sm">
      {label && <span className="eyebrow">{label}</span>}
      <div className="segmented" role="group">
        {options.map((o) => (
          <button
            key={String(o.value)}
            className={`seg ${o.value === value ? 'seg-on' : ''}`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
