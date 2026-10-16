// Exporta la animación a MP4 cuadro a cuadro (sin depender de la velocidad de la máquina).
// Requiere: Node 18+, `npm install` (Playwright) y ffmpeg en el PATH.
//
//   node render.mjs                                   -> contador-piso.mp4 (10 a 0, 1080x1920, 30 fps)
//   node render.mjs --desde 5 --hasta 0 --salida cinco.mp4
//   node render.mjs --desde 0 --hasta 20 --paso 0.5 --fps 60
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const args = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) args[argv[i].slice(2)] = argv[++i];
const fps = +(args.fps ?? 30);
const ancho = +(args.ancho ?? 1080);
const alto = +(args.alto ?? 1920);
const dir = path.dirname(fileURLToPath(import.meta.url));
const salida = path.resolve(args.salida ?? path.join(dir, 'contador-piso.mp4'));

const q = new URLSearchParams({ export: '1' });
for (const k of ['desde', 'hasta', 'paso']) if (args[k] != null) q.set(k, args[k]);
const url = `${pathToFileURL(path.join(dir, 'index.html'))}?${q}`;

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: ancho, height: alto } });
pagina.on('pageerror', e => console.error('Error en la página:', e.message));
await pagina.goto(url);
await pagina.evaluate(async () => {
  await document.fonts.load('330px "Rock Salt"');
  await document.fonts.ready;
  await document.getElementById('fondo').decode();
});
const duracion = await pagina.evaluate(() => window.contador.duracion);
const total = Math.ceil(duracion / 1000 * fps);

const ffmpeg = spawn('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart', salida,
], { stdio: ['pipe', 'inherit', 'inherit'] });
const terminado = new Promise((ok, mal) => ffmpeg.on('close', c => (c === 0 ? ok() : mal(new Error(`ffmpeg salió con código ${c}`)))));

for (let f = 0; f < total; f++) {
  await pagina.evaluate(t => window.contador.render(t), (f / fps) * 1000);
  const img = await pagina.screenshot({ type: 'jpeg', quality: 95 });
  if (!ffmpeg.stdin.write(img)) await new Promise(r => ffmpeg.stdin.once('drain', r));
  if (f % fps === 0) process.stdout.write(`\rCuadro ${f + 1}/${total}`);
}
ffmpeg.stdin.end();
await terminado;
await navegador.close();
console.log(`\nListo: ${salida} (${(duracion / 1000).toFixed(1)} s, ${ancho}x${alto}, ${fps} fps)`);
