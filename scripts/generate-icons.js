const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const publicDir = path.join(__dirname, '..', 'public')
const logoPath = path.join(publicDir, 'kounterLogo.jpeg')

const sizes = [
  { name: 'icon-72x72.png', size: 72 },
  { name: 'icon-96x96.png', size: 96 },
  { name: 'icon-128x128.png', size: 128 },
  { name: 'icon-144x144.png', size: 144 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'favicon.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
]

async function generateIcons() {
  if (!fs.existsSync(logoPath)) {
    console.error('Logo not found at', logoPath)
    process.exit(1)
  }

  for (const { name, size } of sizes) {
    const outPath = path.join(publicDir, name)
    await sharp(logoPath)
      .resize(size, size, { fit: 'contain', background: { r: 13, g: 148, b: 136, alpha: 1 } })
      .png()
      .toFile(outPath)
    console.log(`Generated ${name}`)
  }
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err)
  process.exit(1)
})