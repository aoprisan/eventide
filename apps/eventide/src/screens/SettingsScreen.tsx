import { useRef, useState } from 'react';
import { useEngine } from '../engine/EngineContext.js';
import { usePwa } from '../pwa/PwaContext.js';
import { Segmented, TopBar } from '../components/ui.js';
import type { MotionPref } from '@eventide/engine';

export function SettingsScreen() {
  const { store, prefs, setPrefs, refresh } = useEngine();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function exportData() {
    const json = await store.exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `eventide-export-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus('Exported.');
  }

  async function importData(file: File) {
    try {
      await store.importJson(await file.text());
      await refresh();
      setStatus('Imported.');
    } catch {
      setStatus('That file could not be read.');
    }
  }

  return (
    <div className="shell view-enter">
      <TopBar />
      <header className="col" style={{ marginBottom: 28 }}>
        <span className="overline overline-hour">Settings</span>
        <h1 className="display" style={{ marginTop: 8 }}>
          Quiet &amp; yours
        </h1>
      </header>

      <div className="col" style={{ gap: 24 }}>
        <ToggleRow
          label="Haptics"
          hint="Gentle pulses on phase changes"
          on={prefs.haptics ?? true}
          onToggle={() => setPrefs({ haptics: !(prefs.haptics ?? true) })}
        />

        <Segmented<MotionPref>
          label="Motion"
          value={prefs.reducedMotion ?? 'system'}
          onChange={(v) => setPrefs({ reducedMotion: v })}
          options={[
            { value: 'system', label: 'System' },
            { value: 'on', label: 'Reduced' },
            { value: 'off', label: 'Full' },
          ]}
        />

        <SliderRow
          label="Ambient volume"
          value={prefs.ambientVolume ?? 0.4}
          onChange={(v) => setPrefs({ ambientVolume: v })}
        />
        <SliderRow
          label="Tone volume"
          value={prefs.toneVolume ?? 0.5}
          onChange={(v) => setPrefs({ toneVolume: v })}
        />

        <div className="col gap-sm">
          <div className="rule-head">
            <span className="overline">Your data</span>
          </div>
          <p className="faint" style={{ fontSize: '0.9rem' }}>
            Everything lives on this device only. No account, no servers. Take it with
            you anytime.
          </p>
          <div className="row gap-sm" style={{ marginTop: 6 }}>
            <button className="btn btn-quiet grow" onClick={exportData}>
              Export
            </button>
            <button className="btn btn-quiet grow" onClick={() => fileRef.current?.click()}>
              Import
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importData(f);
              e.target.value = '';
            }}
          />
          {status && (
            <p className="muted text-center" style={{ marginTop: 6 }}>
              {status}
            </p>
          )}
        </div>

        <AboutBuild />

        <p className="faint text-center" style={{ marginTop: 12, fontSize: '0.8rem' }}>
          Eventide · practices for the turning of the day
        </p>
      </div>
    </div>
  );
}

function AboutBuild() {
  const { needRefresh, checking, buildTime, checkForUpdate, applyUpdate } = usePwa();
  const [checked, setChecked] = useState(false);

  async function onCheck() {
    setChecked(false);
    await checkForUpdate();
    // If a newer build was found, `needRefresh` flips and we show Update instead.
    setChecked(true);
  }

  return (
    <div className="col gap-sm">
      <div className="rule-head">
        <span className="overline">About this build</span>
      </div>
      <div className="row between">
        <span className="faint" style={{ fontSize: '0.9rem' }}>
          Built
        </span>
        <span className="muted" style={{ fontSize: '0.9rem' }}>
          {formatBuildTime(buildTime)}
        </span>
      </div>

      {needRefresh ? (
        <>
          <button className="btn btn-primary btn-block" onClick={applyUpdate} style={{ marginTop: 6 }}>
            Update &amp; restart
          </button>
          <span className="faint text-center" style={{ fontSize: '0.85rem' }}>
            A newer version is ready.
          </span>
        </>
      ) : (
        <>
          <button
            className="btn btn-quiet btn-block"
            onClick={() => void onCheck()}
            disabled={checking}
            style={{ marginTop: 6 }}
          >
            {checking ? 'Checking…' : 'Check for updates'}
          </button>
          {checked && !checking && (
            <span className="faint text-center" style={{ fontSize: '0.85rem' }}>
              You're on the latest version.
            </span>
          )}
        </>
      )}
    </div>
  );
}

function formatBuildTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ToggleRow({
  label,
  hint,
  on,
  onToggle,
}: {
  label: string;
  hint?: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button className="row between full" onClick={onToggle} style={{ textAlign: 'left' }}>
      <span className="col">
        <span style={{ fontSize: '1.05rem' }}>{label}</span>
        {hint && <span className="faint" style={{ fontSize: '0.85rem' }}>{hint}</span>}
      </span>
      <span className={`toggle ${on ? 'on' : ''}`} />
    </button>
  );
}

function SliderRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="col gap-sm">
      <span className="row between">
        <span style={{ fontSize: '1.05rem' }}>{label}</span>
        <span className="faint">{Math.round(value * 100)}%</span>
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider"
      />
    </label>
  );
}
