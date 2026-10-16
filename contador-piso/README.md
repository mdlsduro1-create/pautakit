# Contador en el piso

Cuenta regresiva escrita con tiza luminosa, acostada en perspectiva sobre el piso de la escena "P 26 3/3".

- `contador-piso.mp4`: video listo para editar (1080x1920, 30 fps, 12,9 s, de 10 a 0).
- `index.html`: la animación en vivo. Ábrelo en el navegador; toca la pantalla (o pulsa espacio) para reiniciar.

## Parámetros

Se pasan en la URL de `index.html` o como opciones de `render.mjs`:

| Parámetro | Por defecto | Qué hace |
|-----------|-------------|----------|
| `desde`   | `10`        | Número inicial |
| `hasta`   | `0`         | Número final (si es mayor que `desde`, cuenta hacia arriba) |
| `paso`    | `1`         | Segundos que dura cada número |
| `loop`    | apagado     | `?loop=1` repite la animación (solo en vivo) |

Ejemplo: `index.html?desde=5&hasta=0&loop=1`

Los últimos tres números antes del final se ponen rojos; el último número llega con un destello rojo y una sacudida.

## Exportar otro video

Requiere Node 18+ y ffmpeg.

```sh
npm install
npx playwright install chromium
node render.mjs --desde 5 --hasta 0 --salida cinco.mp4
```

Opciones extra: `--fps`, `--ancho`, `--alto`.

Fuente: Rock Salt (Apache 2.0, ver `fonts/LICENSE-RockSalt.txt`).
