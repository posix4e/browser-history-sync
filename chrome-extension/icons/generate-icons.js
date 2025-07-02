// Script to generate placeholder icons for the extension
const fs = require('fs')
const path = require('path')

// Simple SVG icon
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" fill="#2196F3"/>
  <text x="64" y="64" font-family="Arial" font-size="48" fill="white" text-anchor="middle" dy=".3em">H</text>
</svg>`

// Convert SVG to data URL (for future use)
// const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgIcon).toString('base64')}`

// Create placeholder for each size
const sizes = [16, 48, 128]

console.log('Generating placeholder icons...')
console.log('Note: These are temporary. Replace with proper icons before release.')

sizes.forEach((size) => {
  const filename = path.join(__dirname, `icon-${size}.png`)
  console.log(`- ${filename} (placeholder)`)
})

// Save SVG for reference
fs.writeFileSync(path.join(__dirname, 'icon.svg'), svgIcon)
console.log('\nSaved icon.svg as reference. Use an image editor to create PNG versions.')
console.log('Or use an online converter to convert the SVG to PNG files.')
