// Genera resources/icon.png (1024×1024) y resources/splash.png (2732×2732): un punto rosa sobre negro,
// la marca de Cerebro. Después, `npx capacitor-assets generate --android` saca todos los tamaños.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const NEGRO = '#0A0A0C';
const ROSA = '#EB0C6E';

function punto(lado, diametro) {
  const r = diametro / 2;
  const c = lado / 2;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}">
       <rect width="100%" height="100%" fill="${NEGRO}"/>
       <circle cx="${c}" cy="${c}" r="${r}" fill="${ROSA}"/>
     </svg>`,
  );
}

mkdirSync('resources', { recursive: true });
await sharp(punto(1024, 560)).png().toFile('resources/icon.png');
await sharp(punto(2732, 400)).png().toFile('resources/splash.png');
console.log('resources/icon.png y resources/splash.png listos');
