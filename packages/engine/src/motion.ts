/**
 * Reduced-motion handling. Honors the OS setting by default, with an explicit
 * override for users who want to force calm motion on or off in-app.
 */
export type MotionPref = 'system' | 'on' | 'off';

function systemPrefersReduced(): boolean {
  if (typeof matchMedia === 'undefined') return false;
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** True when animations should be reduced to gentle fades / static states. */
export function reduceMotion(pref: MotionPref = 'system'): boolean {
  if (pref === 'on') return true;
  if (pref === 'off') return false;
  return systemPrefersReduced();
}

/** Subscribe to OS-level reduced-motion changes. Returns an unsubscribe fn. */
export function onMotionChange(cb: (reduced: boolean) => void): () => void {
  if (typeof matchMedia === 'undefined') return () => {};
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  const handler = () => cb(mq.matches);
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}
