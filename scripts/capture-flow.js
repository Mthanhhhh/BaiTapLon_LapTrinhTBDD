const fs = require('fs');
const { spawn } = require('child_process');

async function run() {
  console.log('Starting Chrome headless with CDP...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=412,915',
    'about:blank',
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const versionRes = await fetch('http://localhost:9222/json/list');
  const pages = await versionRes.json();
  const pageWsUrl = pages[0].webSocketDebuggerUrl;

  const ws = new WebSocket(pageWsUrl);
  await new Promise(r => (ws.onopen = r));

  let id = 1;
  const send = (method, params = {}) => {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      const handler = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === msgId) {
          ws.removeEventListener('message', handler);
          if (data.error) reject(data.error);
          else resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  };

  const capture = async (filename) => {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`T:\\ProjectTBDD\\${filename}`, Buffer.from(res.data, 'base64'));
    console.log(`Saved screenshot: ${filename}`);
  };

  const evaluate = async (expression) => {
    return send('Runtime.evaluate', { expression, returnByValue: true });
  };

  await send('Page.enable');
  await send('Runtime.enable');

  // 1. Go to Search (Best Sales)
  console.log('Navigating to Search...');
  await send('Page.navigate', { url: 'http://localhost:8081/search' });
  await new Promise(r => setTimeout(r, 4000));
  await capture('search_sort_best_sales.png');

  // 2. Click Popular
  console.log('Clicking Popular button...');
  await evaluate(`
    (() => {
      const el = Array.from(document.querySelectorAll('div')).find(e => e.innerText === 'Popular');
      if (el) el.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 2500));
  await capture('search_sort_popular.png');

  // 3. Click Price Asc
  console.log('Clicking Price button (Asc)...');
  await evaluate(`
    (() => {
      const el = Array.from(document.querySelectorAll('div')).find(e => e.innerText && e.innerText.includes('Price'));
      if (el) el.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 2500));
  await capture('search_sort_price_asc.png');

  // 4. Click Price Desc
  console.log('Clicking Price button (Desc)...');
  await evaluate(`
    (() => {
      const el = Array.from(document.querySelectorAll('div')).find(e => e.innerText && e.innerText.includes('Price'));
      if (el) el.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 2500));
  await capture('search_sort_price_desc.png');

  // 5. Open Product 12 and open variant sheet
  console.log('Navigating to Product 12 (Hoodie shirt)...');
  await send('Page.navigate', { url: 'http://localhost:8081/product/12' });
  await new Promise(r => setTimeout(r, 4000));

  // Click Add to Cart / Select Variant row
  console.log('Clicking Select Variant row...');
  await evaluate(`
    (() => {
      const el = Array.from(document.querySelectorAll('div')).find(e => e.innerText && e.innerText.includes('Select Variant'));
      if (el) el.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 2000));
  await capture('product_12_variant_sheet.png');

  console.log('All captures completed successfully!');
  ws.close();
  chrome.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error('Error running capture flow:', err);
  process.exit(1);
});

