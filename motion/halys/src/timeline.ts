// Todo el guion de la pieza, en frames (60 fps).
export const FPS = 60;
export const DURATION = 660;

export const T = {
	logoIn: 6, // entran las letras del logo
	irisOpen: 138, // el círculo verde crece hasta llenar la pantalla
	irisOpenEnd: 178,
	burger: 172, // empiezan a caer las capas de la hamburguesa
	title: 196, // "HAMBURGUESAS"
	tagline: 300, // "que te hacen sonreír"
	sceneOut: 414, // salen los textos
	burgerCrouch: 426, // la hamburguesa se agacha para saltar...
	burgerLaunch: 440, // ...y sale disparada hacia arriba
	irisClose: 446, // el verde se cierra de nuevo en el círculo del logo
	logoBack: 470, // las letras caen dentro del círculo
	wink: 600, // guiño final
};

// Entrada de las letras: "pop" (inicio) o "drop" (caen desde arriba, en el cierre).
export type LetterEntry = 'pop' | 'drop';
export const LETTER_STAGGER: Record<LetterEntry, number> = {pop: 4, drop: 5};
export const DROP_FALL = 16;

// Frame en que cada letra termina de entrar (aparece o aterriza).
export const letterIn = (entry: LetterEntry, start: number, i: number) =>
	start + i * LETTER_STAGGER[entry] + (entry === 'drop' ? DROP_FALL : 2);

export const smileStartFor = (entry: LetterEntry, start: number) =>
	entry === 'pop' ? start + 34 : letterIn('drop', start, 5) + 5;

// Cuando la sonrisa del cierre termina: destellos, jingle y un golpecito del círculo.
export const CELEBRATE = smileStartFor('drop', T.logoBack) + 22;
