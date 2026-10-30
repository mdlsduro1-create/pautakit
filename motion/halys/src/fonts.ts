import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

export const FONT = 'Nunito';

loadFont({family: FONT, url: staticFile('fonts/nunito-latin-800-normal.woff2'), weight: '800'});
loadFont({family: FONT, url: staticFile('fonts/nunito-latin-900-normal.woff2'), weight: '900'});
