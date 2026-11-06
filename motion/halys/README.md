# Haly's: animación de marca

Reel vertical de 11,5 s (1080×1920, 60 fps, con efectos de sonido) hecho con [Remotion](https://www.remotion.dev/).

Ya renderizado en `entregables/`:

- `halys-reel-1080x1920.mp4`: el vídeo con sonido, listo para Reels, Stories y TikTok.
- `halys-portada.png`: fotograma de la hamburguesa armada, para usar de portada.

## Guion

1. **Logo (0–2,3 s):** el círculo verde aparece con un rebote y dos ondas. Las letras de HALY'S entran una a una, la sonrisa se dibuja y el logo hace un "boing".
2. **Apertura (2,3–3 s):** el círculo crece hasta llenar la pantalla y las letras pasan de largo hacia la cámara.
3. **Hamburguesa (3–7 s):** las capas caen y aplastan la pila al aterrizar. Pan de abajo, carne, queso que gotea, tomate, lechuga y pan de arriba. Después salen el sésamo, un brillo y el vapor. Los textos dicen "HAMBURGUESAS / que te hacen sonreír", y debajo se dibuja la sonrisa del logo.
4. **Cierre (7–11,5 s):** la hamburguesa se agacha y sale disparada hacia arriba, y el verde se cierra en el círculo con un rebote. Las letras caen dentro, una a una, con la misma física de las capas. Se dibuja la sonrisa, la etiqueta "HAMBURGUESAS" se estampa bajo el logo con destellos y, al final, el logo hace un guiño.

## Sonido

Los efectos son sintéticos, generados con `scripts/sfx.py` (no usan samples de terceros, así que no hay licencias que cuidar):

- pops afinados para las letras
- golpes, aplastón, crujido y chisporroteo para cada capa de la hamburguesa
- whooshes en las transiciones
- campanitas en los brillos
- un jingle de cuerdas en el cierre

Los archivos están en `public/sfx/`. Dónde suena cada efecto y a qué volumen se define en `src/Soundtrack.tsx`, a partir de los mismos tiempos de `src/timeline.ts`: si cambias un tiempo, el sonido lo sigue.

## Editar y volver a renderizar

```bash
npm install
npm run studio   # vista previa en el navegador, con línea de tiempo
npm run render   # genera out/halys-reel.mp4
npm run sfx      # regenera los efectos de sonido (requiere Python con numpy y scipy)
```

- **Tiempos:** `src/timeline.ts`. Todo el guion está en frames (60 = 1 segundo).
- **Colores:** `src/theme.ts`. El verde `#004721` está medido sobre el logo.
- **Textos y escena:** `src/HalysReel.tsx`.
- **Hamburguesa:** `src/Burger.tsx`.
- **Logo:** `src/logo-paths.ts`. Se vectorizó a partir de la foto de perfil. Si tienen el logo original en vector (SVG o AI), conviene reemplazar esos trazados por los oficiales.

Tipografía de los textos: Nunito (licencia OFL, en `public/fonts/`).
