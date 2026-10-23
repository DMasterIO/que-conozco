// Windows ships no flag emoji glyphs: "🇨🇱" renders as the letters "CL". When the platform lacks
// them, load a small Twemoji font that only covers the flag code points (see unicode-range).
function platformDrawsFlags(): boolean {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 32
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return true
  ctx.textBaseline = 'top'
  ctx.font = '24px sans-serif'
  ctx.fillText('🇨🇭', 0, 0)
  const { data } = ctx.getImageData(0, 0, 32, 32)
  // Switzerland's flag is mostly red; two plain letters are black/grey.
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 200 && data[i] > 200 && data[i + 1] < 80 && data[i + 2] < 80) return true
  }
  return false
}

export function initFlagFont(): void {
  try {
    if (platformDrawsFlags()) return
  } catch {
    return
  }
  const style = document.createElement('style')
  style.textContent = `@font-face {
    font-family: "Twemoji Country Flags";
    unicode-range: U+1F1E6-1F1FF, U+1F3F4, U+E0062-E0063, U+E0065, U+E0067, U+E006C, U+E006E, U+E0073-E0074, U+E0077, U+E007F;
    src: url('${import.meta.env.BASE_URL}fonts/TwemojiCountryFlags.woff2') format('woff2');
    font-display: swap;
  }`
  document.head.appendChild(style)
}
