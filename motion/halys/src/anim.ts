import {Easing} from 'remotion';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const smooth = Easing.bezier(0.65, 0, 0.35, 1);
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);

// Oscilación amortiguada que arranca en t = 0 (rebotes y aplastamientos).
export const wobble = (t: number, decay = 7, freq = 0.55) =>
	t < 0 ? 0 : Math.exp(-t / decay) * Math.sin(t * freq);
