const fs = require('fs');
const { spawn } = require('child_process');

async function run() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=412,915',
    'http://localhost:8081/product/12',
  ]);

  await new Promise((r) => setTimeout(r, 4000));

  const listRes = await fetch('http://localhost:9222/json/list');
  const pages = await listRes.json();
  const wsUrl = pages[0].webSocketDebuggerUrl;

  const ws = new WebSocket(wsUrl);
  await new Promise((r) => (ws.onopen = r));

  let id = 1;
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const msgId = id++;
      const handler = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === msgId) {
          ws.removeEventListener('message', handler);
          if (d.error) reject(d.error);
          else resolve(d.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

  await send('Runtime.enable');

  const clickRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const divs = Array.from(document.querySelectorAll('div'));
        const target = divs.find(d => d.innerText === 'Select Variant' || d.innerText === 'Add to Cart');
        if (target) {
          target.click();
          return 'clicked: ' + target.innerText;
        }
        return 'not_found';
      })()
    `,
    returnByValue: true,
  });
  console.log('Click result:', clickRes.result.value);

  await new Promise((r) => setTimeout(r, 1500));

  const res = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('T:\\ProjectTBDD\\product_12_sheet.png', Buffer.from(res.data, 'base64'));
  console.log('Saved product_12_sheet.png successfully!');

  ws.close();
  chrome.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

