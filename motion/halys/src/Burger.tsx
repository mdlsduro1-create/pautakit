import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, easeOut, smooth, wobble} from './anim';
import {C} from './theme';

// Cada capa cae desde arriba (gravedad) y, al aterrizar, aplasta un poco la pila.
const DROP = 20;
const DROP_FROM = -1500;
const LAYERS = [
	{at: 0, tilt: -6}, // pan de abajo
	{at: 10, tilt: 9}, // carne
	{at: 19, tilt: -11}, // queso
	{at: 27, tilt: 8}, // tomate
	{at: 35, tilt: -7}, // lechuga
	{at: 45, tilt: 12}, // pan de arriba
];
export const BURGER_LANDED = LAYERS[LAYERS.length - 1].at + DROP;
const BOTTOM = 242; // base de la hamburguesa: origen del aplastamiento

const TOP_BUN =
	'M-292 10C-300 -35 -285 -85 -235 -125C-180 -172 -95 -195 0 -195C95 -195 180 -172 235 -125C285 -85 300 -35 292 10C289 22 278 28 262 28L-262 28C-278 28 -289 22 -292 10Z';
const BOTTOM_BUN =
	'M-284 156L284 156C298 156 302 168 298 184C288 226 252 242 200 242L-200 242C-252 242 -288 226 -298 184C-302 168 -298 156 -284 156Z';

const LETTUCE = (() => {
	const n = 12;
	const x0 = -312;
	const w = 624;
	let d = `M${x0} 22Q0 8 ${x0 + w} 22L${x0 + w} 36`;
	for (let i = n; i > 0; i--) {
		const xa = x0 + (w * i) / n;
		const xb = x0 + (w * (i - 1)) / n;
		d += `Q${(xa + xb) / 2} ${i % 2 ? 66 : 56} ${xb} 36`;
	}
	return d + 'Z';
})();

const drip = (x: number, w: number, h: number) =>
	`M${x - w / 2} 88L${x + w / 2} 88L${x + w / 2} ${88 + h - w / 2}A${w / 2} ${w / 2} 0 0 1 ${x - w / 2} ${88 + h - w / 2}Z`;
const DRIPS = [drip(-200, 42, 62), drip(-30, 36, 44), drip(160, 46, 72)];
const CHEESE_TIPS = ['M262 70L322 76L298 128Z', 'M-262 70L-320 80L-292 122Z'];

const SEEDS: [number, number, number][] = [
	[-175, -110, -35], [-105, -148, -15], [-25, -165, 8], [60, -160, 22], [140, -135, 35],
	[205, -85, 48], [-215, -55, -50], [-130, -80, -20], [-45, -105, 12], [40, -100, -8],
	[120, -75, 25], [-75, -38, 30], [55, -40, -25], [185, -30, 40],
];
const SPOTS: [number, number, number][] = [
	[-250, 128, 7], [-205, 146, 5], [-160, 120, 6], [-110, 140, 8], [-60, 124, 5], [-10, 150, 6],
	[35, 122, 7], [85, 142, 5], [130, 126, 6], [180, 148, 7], [225, 124, 5], [262, 142, 6],
];
const STEAM_X = [-110, 0, 110];

export const Burger: React.FC<{start: number}> = ({start}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame - start;

	const fall = (at: number) =>
		interpolate(t, [at, at + DROP], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
	const sinceLanding = (at: number) => t - (at + DROP);

	const layer = (i: number, children: React.ReactNode) => {
		const {at, tilt} = LAYERS[i];
		const p = fall(at);
		if (p <= 0) return null;
		const hop = -Math.abs(wobble(sinceLanding(at), 5, 0.45)) * 26;
		return (
			<g transform={`translate(0 ${(1 - p) * DROP_FROM + hop}) rotate(${(1 - p) * tilt})`}>{children}</g>
		);
	};

	const squash = LAYERS.reduce((sum, l) => sum + wobble(sinceLanding(l.at), 7, 0.55), 0);
	const ground = fall(0);

	const cheeseAt = LAYERS[2].at;
	const drips = interpolate(sinceLanding(cheeseAt), [2, 22], [0, 1], {...clamp, easing: easeOut});
	const topAt = LAYERS[5].at;
	const shine = interpolate(t, [BURGER_LANDED + 30, BURGER_LANDED + 60], [-460, 460], {
		...clamp,
		easing: smooth,
	});
	const steam = interpolate(t, [BURGER_LANDED + 18, BURGER_LANDED + 50], [0, 1], clamp);

	return (
		<g>
			<defs>
				<linearGradient id="bun-top" x1="0" y1="-195" x2="0" y2="28" gradientUnits="userSpaceOnUse">
					<stop offset="0" stopColor={C.bunTop} />
					<stop offset="0.55" stopColor={C.bun} />
					<stop offset="1" stopColor={C.bunDark} />
				</linearGradient>
				<linearGradient id="bun-bottom" x1="0" y1="156" x2="0" y2="242" gradientUnits="userSpaceOnUse">
					<stop offset="0" stopColor={C.bun} />
					<stop offset="1" stopColor={C.bunDark} />
				</linearGradient>
				<linearGradient id="patty" x1="0" y1="86" x2="0" y2="166" gradientUnits="userSpaceOnUse">
					<stop offset="0" stopColor={C.patty} />
					<stop offset="1" stopColor={C.pattyDark} />
				</linearGradient>
				<linearGradient id="cheese" x1="0" y1="70" x2="0" y2="160" gradientUnits="userSpaceOnUse">
					<stop offset="0" stopColor={C.cheese} />
					<stop offset="1" stopColor={C.cheeseDark} />
				</linearGradient>
				<clipPath id="bun-clip">
					<path d={TOP_BUN} />
				</clipPath>
			</defs>

			{/* sombra en el suelo */}
			<ellipse
				cx={0}
				cy={BOTTOM + 16}
				rx={280 * (0.3 + 0.7 * ground) * (1 + 0.04 * squash)}
				ry={22}
				fill="#000"
				opacity={0.3 * ground}
			/>

			{/* vapor */}
			{steam > 0 &&
				STEAM_X.map((x, i) => (
					<path
						key={x}
						d={`M${x} -225C${x + 26} -262 ${x - 26} -298 ${x} -335C${x + 26} -372 ${x - 26} -405 ${x} -440`}
						fill="none"
						stroke="#fff"
						strokeWidth={9}
						strokeLinecap="round"
						pathLength={200}
						strokeDasharray="60 140"
						strokeDashoffset={-(t * 1.6 + i * 70)}
						opacity={0.4 * steam}
					/>
				))}

			<g
				transform={`translate(0 ${BOTTOM}) scale(${1 + 0.045 * squash} ${1 - 0.06 * squash}) translate(0 ${-BOTTOM})`}
			>
				{layer(0, <path d={BOTTOM_BUN} fill="url(#bun-bottom)" />)}
				{layer(
					1,
					<>
						<rect x={-302} y={86} width={604} height={80} rx={40} fill="url(#patty)" />
						<rect x={-268} y={95} width={536} height={12} rx={6} fill={C.pattyLight} opacity={0.6} />
						{SPOTS.map(([x, y, r]) => (
							<ellipse key={x} cx={x} cy={y} rx={r * 1.6} ry={r} fill={C.pattyDark} opacity={0.6} />
						))}
					</>,
				)}
				{layer(
					2,
					<>
						<rect x={-300} y={70} width={600} height={24} rx={6} fill="url(#cheese)" />
						{CHEESE_TIPS.map((d) => (
							<path key={d} d={d} fill="url(#cheese)" />
						))}
						<g transform={`translate(0 88) scale(1 ${drips}) translate(0 -88)`}>
							{DRIPS.map((d) => (
								<path key={d} d={d} fill="url(#cheese)" />
							))}
						</g>
					</>,
				)}
				{layer(
					3,
					<>
						{[-276, 8].map((x) => (
							<g key={x}>
								<rect x={x} y={40} width={268} height={36} rx={16} fill={C.tomato} />
								<rect x={x + 8} y={47} width={252} height={22} rx={10} fill={C.tomatoLight} opacity={0.55} />
							</g>
						))}
					</>,
				)}
				{layer(4, <path d={LETTUCE} fill={C.lettuce} stroke={C.lettuceDark} strokeWidth={4} strokeLinejoin="round" />)}
				{layer(
					5,
					<>
						<path d={TOP_BUN} fill="url(#bun-top)" />
						<ellipse cx={-120} cy={-140} rx={72} ry={22} fill="#fff" opacity={0.3} transform="rotate(-20 -120 -140)" />
						{SEEDS.map(([x, y, rot], i) => {
							const s = spring({
								frame: sinceLanding(topAt) - 2 - i * 2,
								fps,
								config: {damping: 10, stiffness: 220, mass: 0.5},
							});
							return (
								<ellipse
									key={i}
									cx={0}
									cy={0}
									rx={7}
									ry={13}
									fill={C.sesame}
									stroke={C.sesameEdge}
									strokeWidth={1.5}
									transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}
								/>
							);
						})}
						{shine > -460 && shine < 460 && (
							<g clipPath="url(#bun-clip)">
								<rect x={shine - 40} y={-240} width={70} height={300} fill="#fff" opacity={0.35} transform={`skewX(-22)`} />
							</g>
						)}
					</>,
				)}
			</g>
		</g>
	);
};
