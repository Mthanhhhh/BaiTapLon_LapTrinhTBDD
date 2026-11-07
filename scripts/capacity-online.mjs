import fs from 'node:fs';
import {setTimeout as sleep} from 'node:timers/promises';

const url = process.env.ONLINE_URL || 'ws://127.0.0.1:18080/ws/promotions';
const output = process.env.ONLINE_OUTPUT || '.tools/capacity-online.json';
const burst = process.env.ONLINE_HEARTBEAT_MODE === 'burst';
const rows = [];

async function measure(target) {
  const clients = [];
  let connected = 0;
  let acknowledged = 0;
  let failed = 0;
  let pong = 0;
  const latencies = [];
  let active = 0;
  let peak = 0;
  let minimum = 0;
  let holding = false;

  for (let i = 0; i < target; i++) {
    if (i > 0 && i % 100 === 0) await sleep(85);
    const ws = new WebSocket(url);
    const client = {ws, ready: false, pong: false};
    clients.push(client);
    ws.addEventListener('open', () => connected++);
    ws.addEventListener('error', () => failed++);
    ws.addEventListener('message', ({data}) => {
      const {type} = JSON.parse(data);
      if (type === 'CONNECTED' && !client.ready) {
        client.ready = true;
        acknowledged++;
        active++;
        peak = Math.max(active, peak);
      }
      if (type === 'PONG' && !client.pong) {
        client.pong = true;
        pong++;
        latencies.push(performance.now() - client.sentAt);
      }
    });
    ws.addEventListener('close', () => {
      if (client.ready) {
        active--;
        if (holding) minimum = Math.min(minimum, active);
      }
    });
  }

  for (let i = 0; acknowledged < target && i < 350; i++) await sleep(100);
  minimum = active;
  holding = true;
  await Promise.all(clients.map(async (client, i) => {
    await sleep(burst ? 18000 + 20 * (i % 100) : Math.random() * 20000);
    if (client.ws.readyState === WebSocket.OPEN) {
      client.sentAt = performance.now();
      client.ws.send('ping');
    }
  }));
  await sleep(2500);
  latencies.sort((a, b) => a - b);
  const pongP95Ms = latencies.length ? Math.round(latencies[Math.ceil(latencies.length * .95) - 1]) : null;
  const row = {target, heartbeatMode: burst ? 'burst' : 'spread', connected, acknowledged, peak, minDuringHold: minimum, activeAtEnd: active, pong, pongP95Ms, errors: failed};
  holding = false;
  for (const {ws} of clients) if (ws.readyState < WebSocket.CLOSING) ws.close();
  await sleep(2200);
  return row;
}

for (const target of (process.env.ONLINE_LEVELS || "20").split(",").map(Number)) {
  const row = await measure(target);
  rows.push(row);
  fs.writeFileSync(output, JSON.stringify(rows, null, 2));
  console.log(JSON.stringify(row));
  if (row.minDuringHold !== target || row.pong !== target || row.errors) break;
}

// The report is written synchronously. Do not wait for stalled close handshakes.
process.exit(0);
