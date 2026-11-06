import React from 'react';
import {Html5Audio, Sequence, staticFile} from 'remotion';
import {LAYER_LANDINGS, SEEDS_START, SHINE_START} from './Burger';
import {CELEBRATE, letterIn, smileStartFor, T} from './timeline';

// Efectos de sonido (generados con scripts/sfx.py), sincronizados con el guion.
const MASTER = 0.85;
const LETTERS = [0, 1, 2, 3, 4, 5];
const LAYER_SOUNDS: [string, number][] = [
	['thud', 0.7], // pan de abajo
	['thud-heavy', 0.6], // carne
	['splat', 0.6], // queso
	['plip', 0.55], // tomate
	['crunch', 0.55], // lechuga
	['thud', 0.75], // pan de arriba
];

type Cue = {at: number; sfx: string; volume: number};

const CUES: Cue[] = [
	// Logo
	{at: 3, sfx: 'pop-big', volume: 0.7},
	...LETTERS.map((i) => ({at: letterIn('pop', T.logoIn, i), sfx: `pop-${i + 1}`, volume: 0.5})),
	{at: smileStartFor('pop', T.logoIn), sfx: 'swoop', volume: 0.2},
	{at: smileStartFor('pop', T.logoIn) + 20, sfx: 'boing', volume: 0.4},

	// Apertura a pantalla completa
	{at: T.irisOpen - 10, sfx: 'whoosh-big', volume: 0.75},
	{at: T.irisOpenEnd - 8, sfx: 'boom', volume: 0.55},

	// Hamburguesa
	{at: T.title - 6, sfx: 'swish', volume: 0.3},
	...LAYER_LANDINGS.map((f, i) => ({at: T.burger + f, sfx: LAYER_SOUNDS[i][0], volume: LAYER_SOUNDS[i][1]})),
	{at: T.burger + LAYER_LANDINGS[1], sfx: 'sizzle', volume: 0.14},
	{at: T.burger + SEEDS_START, sfx: 'seeds', volume: 0.35},
	{at: T.burger + SHINE_START + 8, sfx: 'ting', volume: 0.3},
	{at: T.tagline - 4, sfx: 'swish', volume: 0.25},
	{at: T.tagline + 14, sfx: 'pop-mid', volume: 0.5},
	{at: T.tagline + 36, sfx: 'swoop', volume: 0.2},
	{at: T.tagline + 58, sfx: 'boing', volume: 0.3},
	{at: T.sceneOut - 2, sfx: 'swish', volume: 0.22},

	// Cierre
	{at: T.burgerLaunch - 2, sfx: 'zip', volume: 0.6},
	{at: T.irisClose, sfx: 'whoosh-down', volume: 0.55},
	{at: T.irisClose + 14, sfx: 'boom-soft', volume: 0.5},
	...LETTERS.flatMap((i) => [
		{at: letterIn('drop', T.logoBack, i), sfx: `pop-${i + 1}`, volume: 0.55},
		{at: letterIn('drop', T.logoBack, i), sfx: 'thud', volume: 0.22},
	]),
	{at: smileStartFor('drop', T.logoBack), sfx: 'swoop', volume: 0.2},
	{at: CELEBRATE, sfx: 'jingle', volume: 0.6},
	{at: CELEBRATE + 2, sfx: 'ting', volume: 0.3},
	{at: T.wink, sfx: 'blip', volume: 0.4},
	{at: T.wink + 8, sfx: 'ting', volume: 0.18},
];

export const Soundtrack: React.FC = () => (
	<>
		{CUES.map((cue, i) => (
			<Sequence key={i} from={Math.round(cue.at)} layout="none" name={cue.sfx}>
				<Html5Audio src={staticFile(`sfx/${cue.sfx}.wav`)} volume={cue.volume * MASTER} />
			</Sequence>
		))}
	</>
);
