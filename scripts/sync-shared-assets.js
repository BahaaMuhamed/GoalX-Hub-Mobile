const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const sharedRoot = path.resolve(projectRoot, '../shared');

const folders = [
  { from: path.join(sharedRoot, 'ads'), to: path.join(projectRoot, 'assets', 'ads') },
  { from: path.join(sharedRoot, 'brand'), to: path.join(projectRoot, 'assets', 'brand') },
];

for (const folder of folders) {
  fs.mkdirSync(folder.to, { recursive: true });
  if (!fs.existsSync(folder.from)) continue;
  for (const name of fs.readdirSync(folder.from)) {
    if (!/\.(png|jpe?g|webp)$/i.test(name)) continue;
    fs.copyFileSync(path.join(folder.from, name), path.join(folder.to, name));
  }
}
