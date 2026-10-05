import assert from 'node:assert/strict';
import { command, evaluate, close } from './design-browser.mjs';
try {
  await command('Page.enable');
  await command('Emulation.setDeviceMetricsOverride', { width: 1100, height: 950, deviceScaleFactor: 1, mobile: false });
  await command('Page.navigate', { url: 'http://127.0.0.1:5190/dist/index.html#login' });
  await new Promise(r => setTimeout(r, 1400));
  await evaluate(`document.querySelector('.login-create-account').click()`);
  await new Promise(r => setTimeout(r, 500));
  const fields = await evaluate(`['userFullName','userEmail','userPhoneNumber','userPassword','userPasswordConfirm'].map(id => { const el = document.getElementById(id); const rect = el.closest('.login-field').getBoundingClientRect(); return {id,x:rect.x,y:rect.y,width:rect.width}; })`);
  console.log(fields);
  assert.equal(fields[0].y, fields[1].y);
  assert.equal(fields[2].y, fields[3].y);
  assert.equal(fields[3].y, fields[4].y);
  assert.ok(fields[2].y > fields[0].y);
  assert.ok(fields[3].x > fields[2].x && fields[4].x > fields[3].x);
  console.log('Passed: name/email share row one; phone/password/confirmation share row two.');
} finally { close(); }
