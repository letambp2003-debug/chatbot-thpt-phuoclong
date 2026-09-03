const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('Index_CCCD.html', 'utf8');
const regex = /src=["']data:image\/(?:jpeg|png);base64,([^"']+)["']/;
const match = html.match(regex);

if (match && match[1]) {
  const assetsDir = path.join(__dirname, '..', 'public', 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });
  const target = path.join(assetsDir, 'logo.jpg');
  fs.writeFileSync(target, Buffer.from(match[1], 'base64'));
  console.log('Logo extracted successfully! Path:', target, 'Size:', fs.statSync(target).size, 'bytes');
} else {
  console.error('Logo not found in Index_CCCD.html');
  process.exit(1);
}
