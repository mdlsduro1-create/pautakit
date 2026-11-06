import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, easeIn, smooth, wobble} from './anim';
import {LOGO_LETTERS, LOGO_SMILE, SMILE_CENTERLINE} from './logo-paths';
import {DROP_FALL, LETTER_STAGGER, LetterEntry, smileStartFor} from './timeline';

// La sonrisa del logo, dibujada de izquierda a derecha con una máscara
// que recorre su línea central. Coordenadas del logo (radio 500).
export const DrawnSmile: React.FC<{id: string; progress: number}> = ({id, progress}) => {
	if (progress <= 0) return null;
	return (
		<>
			<defs>
				<mask id={id} maskUnits="userSpaceOnUse" x={-500} y={-500} width={1000} height={1000}>
					<path
						d={SMILE_CENTERLINE}
						fill="none"
						stroke="#fff"
						strokeWidth={72}
						strokeLinecap="round"
						strokeLinejoin="round"
						pathLength={1}
						strokeDasharray="1 2"
						strokeDashoffset={1 - progress}
					/>
				</mask>
			</defs>
			<path d={LOGO_SMILE.d} fill="#fff" fillRule="evenodd" mask={`url(#${id})`} />
		</>
	);
};

const LETTER_TILT = [-18, 12, -10, 16, 28, -14];
const BASELINE = 65; // base de las letras: origen del aplastamiento al aterrizar
const DROP_FROM = -1300;

const pulse = (frame: number, from: number, dur: number) =>
	Math.sin(Math.PI * interpolate(frame, [from, from + dur], [0, 1], clamp));

// Letras + sonrisa (sin el círculo, que es el "iris" de la escena principal).
export const LogoMark: React.FC<{
	id: string;
	start: number;
	entry: LetterEntry;
	exitStart?: number;
	winkAt?: number;
}> = ({id, start, entry, exitStart, winkAt}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const smileStart = smileStartFor(entry, start);
	const smile = interpolate(frame, [smileStart, smileStart + 26], [0, 1], {...clamp, easing: smooth});
	// Cuando la sonrisa termina, todo el logo hace un pequeño "boing".
	const happy = wobble(frame - (smileStart + 20), 6, 0.7);
	const exit =
		exitStart === undefined
			? 0
			: interpolate(frame, [exitStart, exitStart + 26], [0, 1], {...clamp, easing: easeIn});
	const wink = winkAt === undefined ? 0 : interpolate(frame, [winkAt, winkAt + 28], [0, 1], {...clamp, easing: smooth});
	const grin = Math.sin(Math.PI * wink);

	if (frame < start || exit >= 1) return null;

	const letterTransform = (i: number, cx: number, cy: number, isApostrophe: boolean) => {
		const wave = winkAt === undefined ? 0 : -22 * pulse(frame, winkAt + i * 3, 16);
		const spin = isApostrophe ? `translate(0 ${-50 * grin}) rotate(${360 * wink} ${cx} ${cy})` : '';

		if (entry === 'pop') {
			const s = spring({frame: frame - start - i * LETTER_STAGGER.pop, fps, config: {damping: 11, stiffness: 170, mass: 0.7}});
			return {
				opacity: Math.min(1, s * 1.6),
				transform: `translate(0 ${wave}) ${spin} translate(${cx} ${cy + (1 - s) * 160}) rotate(${(1 - s) * LETTER_TILT[i]}) scale(${0.2 + 0.8 * s}) translate(${-cx} ${-cy})`,
			};
		}

		// "drop": cae con gravedad, se aplasta al tocar fondo y rebota un poco.
		const from = start + i * LETTER_STAGGER.drop;
		const p = interpolate(frame, [from, from + DROP_FALL], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
		const since = frame - (from + DROP_FALL);
		const squash = wobble(since, 5, 0.6);
		const hop = -Math.max(0, -squash) * 46;
		const base = isApostrophe ? cy : BASELINE;
		return {
			opacity: 1,
			transform: `translate(0 ${(1 - p) * DROP_FROM + hop + wave}) ${spin} translate(${cx} ${base}) rotate(${(1 - p) * LETTER_TILT[i]}) scale(${1 + 0.16 * squash} ${1 - 0.24 * squash}) translate(${-cx} ${-base})`,
		};
	};

	return (
		<g opacity={1 - exit} transform={`scale(${1 + exit * 1.5})`}>
			<g transform={`translate(0 240) scale(${1 + 0.06 * happy} ${1 - 0.08 * happy}) translate(0 -240)`}>
				{LOGO_LETTERS.map((l, i) => {
					const {opacity, transform} = letterTransform(i, l.cx, l.cy, l.id === 'apostrophe');
					return <path key={l.id} d={l.d} fill="#fff" fillRule="evenodd" opacity={opacity} transform={transform} />;
				})}
				<g
					transform={`translate(${LOGO_SMILE.cx} ${LOGO_SMILE.cy}) scale(${1 + 0.14 * grin} ${1 + 0.1 * grin}) translate(${-LOGO_SMILE.cx} ${-LOGO_SMILE.cy})`}
				>
					<DrawnSmile id={`${id}-smile`} progress={smile} />
				</g>
			</g>
		</g>
	);
};
