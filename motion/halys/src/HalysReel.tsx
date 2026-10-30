import React from 'react';
import {AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, easeIn, easeOut, smooth, wobble} from './anim';
import {Burger} from './Burger';
import {FONT} from './fonts';
import {DrawnSmile, LogoMark} from './Logo';
import {C} from './theme';
import {T} from './timeline';

const LOGO_SCALE = 0.82; // radio del círculo: 500 * 0.82 = 410 px
const COVER = 3.1; // escala del círculo para tapar toda la pantalla vertical
const BURGER_Y = 1000;
const BURGER_SCALE = 1.08;

// Anillos que salen del círculo cuando aparece.
const Ripple: React.FC<{at: number}> = ({at}) => {
	const frame = useCurrentFrame();
	const p = interpolate(frame, [at, at + 42], [0, 1], {...clamp, easing: easeOut});
	if (p <= 0 || p >= 1) return null;
	return (
		<circle r={500 * (1 + 0.55 * p)} fill="none" stroke={C.greenLight} strokeWidth={10 * (1 - p)} opacity={0.8 * (1 - p)} />
	);
};

const Sunburst: React.FC = () => {
	const frame = useCurrentFrame();
	const rays = 20;
	const half = (4.5 * Math.PI) / 180;
	return (
		<g transform={`rotate(${frame * 0.12})`}>
			{Array.from({length: rays}, (_, i) => {
				const a = (i / rays) * Math.PI * 2;
				const R = 1700;
				return (
					<path
						key={i}
						d={`M0 0L${R * Math.cos(a - half)} ${R * Math.sin(a - half)}L${R * Math.cos(a + half)} ${R * Math.sin(a + half)}Z`}
						fill="#fff"
						opacity={0.05}
					/>
				);
			})}
		</g>
	);
};

// Semillas de sésamo flotando en el fondo verde.
const Seeds: React.FC = () => {
	const frame = useCurrentFrame();
	const {width, height} = useVideoConfig();
	return (
		<>
			{Array.from({length: 26}, (_, i) => {
				const speed = 0.6 + random(`speed-${i}`) * 0.9;
				const span = height + 200;
				const y = ((random(`y-${i}`) * span - frame * speed) % span + span) % span - 100;
				const x = random(`x-${i}`) * width + Math.sin(frame / 40 + i) * 18;
				const size = 0.8 + random(`s-${i}`) * 0.9;
				return (
					<ellipse
						key={i}
						rx={7 * size}
						ry={13 * size}
						fill={C.sesame}
						opacity={0.16 + random(`o-${i}`) * 0.18}
						transform={`translate(${x} ${y}) rotate(${random(`r-${i}`) * 360 + frame * (i % 2 ? 0.6 : -0.6)})`}
					/>
				);
			})}
		</>
	);
};

// Texto que sube letra por letra desde una línea invisible.
const RiseText: React.FC<{text: string; start: number; stagger: number; style: React.CSSProperties}> = ({
	text,
	start,
	stagger,
	style,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return (
		<div style={{display: 'flex', justifyContent: 'center', overflow: 'hidden', padding: '0.12em 0', ...style}}>
			{[...text].map((ch, i) => {
				const s = spring({frame: frame - start - i * stagger, fps, config: {damping: 14, stiffness: 150, mass: 0.8}});
				return (
					<span
						key={i}
						style={{
							display: 'inline-block',
							whiteSpace: 'pre',
							transform: `translateY(${(1 - s) * 120}%) rotate(${(1 - s) * 10}deg)`,
						}}
					>
						{ch}
					</span>
				);
			})}
		</div>
	);
};

export const HalysReel: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const cx = width / 2;

	// El círculo del logo hace de "iris": aparece, se abre a pantalla completa y se vuelve a cerrar.
	const pop = spring({frame: frame - 2, fps, config: {damping: 12, stiffness: 120, mass: 0.9}});
	const open = interpolate(frame, [T.irisOpen, T.irisOpenEnd], [0, 1], {...clamp, easing: smooth});
	const close = spring({frame: frame - T.irisClose, fps, config: {damping: 15, stiffness: 85}});
	const iris = pop * (1 + (open - close) * (COVER - 1));

	const lift = interpolate(frame, [T.lift, T.lift + 36], [0, -90], {...clamp, easing: smooth});
	const float = Math.sin((frame - T.lift) / 30) * 5 * interpolate(frame, [T.lift, T.lift + 50], [0, 1], clamp);
	const logoY = height / 2 + lift + float;
	const irisTransform = `translate(${cx} ${logoY}) scale(${LOGO_SCALE * iris})`;

	const scene =
		interpolate(frame, [T.irisOpen + 6, T.irisOpenEnd], [0, 1], clamp) *
		interpolate(frame, [T.irisClose + 10, T.irisClose + 40], [1, 0], clamp);
	const burgerOut = interpolate(frame, [T.irisClose - 4, T.irisClose + 26], [0, 1], {...clamp, easing: easeIn});
	const halo = 1 - scene;

	// Textos de la escena de la hamburguesa
	const textOut = interpolate(frame, [T.sceneOut, T.sceneOut + 26], [0, 1], {...clamp, easing: smooth});
	const sonreirPop = spring({frame: frame - (T.tagline + 14), fps, config: {damping: 10, stiffness: 140, mass: 0.8}});
	const taglineSmile = interpolate(frame, [T.tagline + 36, T.tagline + 62], [0, 1], {...clamp, easing: smooth});
	const taglineHappy = wobble(frame - (T.tagline + 58), 6, 0.7);

	// Cierre
	const endIn = interpolate(frame, [T.endText, T.endText + 50], [0, 1], {...clamp, easing: easeOut});

	return (
		<AbsoluteFill style={{background: `radial-gradient(circle at 50% 46%, #0F2A18 0%, ${C.black} 62%)`, fontFamily: FONT}}>
			<svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
				<defs>
					<clipPath id="iris">
						<circle r={500} transform={irisTransform} />
					</clipPath>
					<radialGradient id="spot">
						<stop offset="0" stopColor="#2FA463" stopOpacity={0.55} />
						<stop offset="1" stopColor={C.green} stopOpacity={0} />
					</radialGradient>
					<radialGradient id="halo">
						<stop offset="0.55" stopColor={C.greenLight} stopOpacity={0.35} />
						<stop offset="1" stopColor={C.greenLight} stopOpacity={0} />
					</radialGradient>
				</defs>

				{/* resplandor detrás del logo */}
				<circle cx={cx} cy={logoY} r={720 * LOGO_SCALE * iris} fill="url(#halo)" opacity={halo} />

				<g transform={`translate(${cx} ${logoY}) scale(${LOGO_SCALE})`}>
					<Ripple at={8} />
					<Ripple at={18} />
					<Ripple at={T.irisClose + 12} />
					<Ripple at={T.irisClose + 22} />
				</g>

				<g transform={irisTransform}>
					<circle r={500} fill={C.green} stroke={C.ring} strokeWidth={3} />
				</g>

				{/* escena de la hamburguesa, recortada dentro del círculo */}
				{scene > 0 && (
					<g clipPath="url(#iris)" opacity={scene}>
						<circle cx={cx} cy={BURGER_Y} r={780} fill="url(#spot)" />
						<g transform={`translate(${cx} ${BURGER_Y})`}>
							<Sunburst />
						</g>
						<Seeds />
						<g
							opacity={1 - burgerOut}
							transform={`translate(${cx} ${BURGER_Y + (logoY - BURGER_Y) * burgerOut}) scale(${BURGER_SCALE * (1 - 0.8 * burgerOut)})`}
						>
							<Burger start={T.burger} />
						</g>
					</g>
				)}

				<g transform={irisTransform}>
					<LogoMark id="intro" start={T.logoIn} exitStart={T.irisOpen} />
					<LogoMark id="outro" start={T.logoBack} />
				</g>
			</svg>

			{/* HAMBURGUESAS */}
			{frame >= T.title && frame < T.sceneOut + 28 && (
				<div
					style={{
						position: 'absolute',
						top: 300,
						width: '100%',
						opacity: 1 - textOut,
						transform: `translateY(${-60 * textOut}px)`,
					}}
				>
					<RiseText
						text="HAMBURGUESAS"
						start={T.title}
						stagger={2.5}
						style={{fontSize: 100, fontWeight: 900, color: C.white, letterSpacing: '0.01em', lineHeight: 1}}
					/>
				</div>
			)}

			{/* que te hacen sonreír */}
			{frame >= T.tagline && frame < T.sceneOut + 28 && (
				<div
					style={{
						position: 'absolute',
						top: 1318,
						width: '100%',
						opacity: 1 - textOut,
						transform: `translateY(${60 * textOut}px)`,
					}}
				>
					<RiseText
						text="que te hacen"
						start={T.tagline}
						stagger={1.5}
						style={{fontSize: 72, fontWeight: 800, color: C.cream, lineHeight: 1}}
					/>
					<div
						style={{
							textAlign: 'center',
							fontSize: 176,
							fontWeight: 900,
							color: C.white,
							lineHeight: 1,
							marginTop: -6,
							opacity: Math.min(1, sonreirPop * 1.5),
							transform: `scale(${(0.4 + 0.6 * sonreirPop) * (1 + 0.05 * taglineHappy)}, ${(0.4 + 0.6 * sonreirPop) * (1 - 0.07 * taglineHappy)})`,
							transformOrigin: '50% 100%',
						}}
					>
						sonreír
					</div>
					<svg
						width={300}
						height={110}
						viewBox="-214 110 380 140"
						style={{display: 'block', margin: '6px auto 0'}}
					>
						<DrawnSmile id="tagline-smile" progress={taglineSmile} />
					</svg>
				</div>
			)}

			{/* cierre */}
			{endIn > 0 && (
				<div
					style={{
						position: 'absolute',
						top: height / 2 - 90 + 410 + 74,
						width: '100%',
						textAlign: 'center',
						fontSize: 50,
						fontWeight: 800,
						color: C.white,
						opacity: 0.92 * endIn,
						letterSpacing: `${interpolate(endIn, [0, 1], [0.9, 0.4])}em`,
						paddingLeft: `${interpolate(endIn, [0, 1], [0.9, 0.4])}em`,
						filter: `blur(${(1 - endIn) * 10}px)`,
					}}
				>
					HAMBURGUESAS
				</div>
			)}
		</AbsoluteFill>
	);
};
