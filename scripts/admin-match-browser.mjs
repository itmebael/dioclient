import fs from 'node:fs';
const tab = await (await fetch('http://127.0.0.1:9223/json/new?http://127.0.0.1:5181/dist/index.html', { method: 'PUT' })).json();
await new Promise(resolve => setTimeout(resolve, 1200));
const socket = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
let serial = 0;
const pending = new Map();
export const browserErrors = [];
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') browserErrors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    message.error ? reject(message.error) : resolve(message.result);
  }
});
export function command(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++serial;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
export async function evaluate(expression) {
  const value = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (value.exceptionDetails) throw new Error(value.exceptionDetails.text);
  return value.result.value;
}
export async function screenshot(file) {
  const result = await command('Page.captureScreenshot', { format: 'png' });
  fs.mkdirSync('.design-preview', { recursive: true });
  fs.writeFileSync(`.design-preview/${file}.png`, Buffer.from(result.data, 'base64'));
}
export function close() { socket.close(); }
