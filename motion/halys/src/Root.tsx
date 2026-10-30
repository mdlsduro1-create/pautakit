import React from 'react';
import {Composition} from 'remotion';
import {HalysReel} from './HalysReel';
import {DURATION, FPS} from './timeline';

export const RemotionRoot: React.FC = () => (
	<Composition
		id="HalysReel"
		component={HalysReel}
		durationInFrames={DURATION}
		fps={FPS}
		width={1080}
		height={1920}
	/>
);
