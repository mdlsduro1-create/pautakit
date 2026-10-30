import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, easeIn, smooth, wobble} from './anim';
import {LOGO_LETTERS, LOGO_SMILE, SMILE_CENTERLINE} from './logo-paths';

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

// Letras + sonrisa (sin el círculo, que es el "iris" de la escena principal).
export const LogoMark: React.FC<{id: string; start: number; exitStart?: number}> = ({
	id,
	start,
	exitStart,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const smileStart = start + 34;
	const smile = interpolate(frame, [smileStart, smileStart + 26], [0, 1], {...clamp, easing: smooth});
	// Cuando la sonrisa termina, todo el logo hace un pequeño "boing".
	const happy = wobble(frame - (smileStart + 20), 6, 0.7);
	const exit =
		exitStart === undefined
			? 0
			: interpolate(frame, [exitStart, exitStart + 26], [0, 1], {...clamp, easing: easeIn});

	if (frame < start || exit >= 1) return null;

	return (
		<g opacity={1 - exit} transform={`scale(${1 + exit * 1.5})`}>
			<g transform={`translate(0 240) scale(${1 + 0.06 * happy} ${1 - 0.08 * happy}) translate(0 -240)`}>
				{LOGO_LETTERS.map((l, i) => {
					const s = spring({
						frame: frame - start - i * 4,
						fps,
						config: {damping: 11, stiffness: 170, mass: 0.7},
					});
					return (
						<path
							key={l.id}
							d={l.d}
							fill="#fff"
							fillRule="evenodd"
							opacity={Math.min(1, s * 1.6)}
							transform={`translate(${l.cx} ${l.cy + (1 - s) * 160}) rotate(${(1 - s) * LETTER_TILT[i]}) scale(${0.2 + 0.8 * s}) translate(${-l.cx} ${-l.cy})`}
						/>
					);
				})}
				<DrawnSmile id={`${id}-smile`} progress={smile} />
			</g>
		</g>
	);
};
