import fs from 'node:fs';

const bundlePath = 'dist/assets/index-v20260422157000.js';
let source = fs.readFileSync(bundlePath, 'utf8');
const replacements = [
  ['DioLink', 'ParishLink'],
  ['logo-Ci9YLt91.png', 'logo.png'],
  ['I have read and agree to the ', 'To continue with Google, please accept the '],
];
for (const [before, after] of replacements) {
  if (source.includes(before)) source = source.replaceAll(before, after);
}
fs.writeFileSync(bundlePath, source);

const cssPath = 'dist/assets/index-yReDnWMe.css';
let css = fs.readFileSync(cssPath, 'utf8');
css = css.replaceAll('logo-Ci9YLt91.png', 'logo.png');
fs.writeFileSync(cssPath, css);

for (const htmlPath of ['dist/index.html']) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replaceAll('DioLink', 'ParishLink');
  fs.writeFileSync(htmlPath, html);
}
