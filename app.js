import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ── CONFIG ────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCXgPX1DCdVLfFEmMVxgD3NO-IWEtA1C_M",
  authDomain: "fren-website.firebaseapp.com",
  databaseURL: "https://fren-website-default-rtdb.firebaseio.com",
  projectId: "fren-website",
  storageBucket: "fren-website.firebasestorage.app",
  messagingSenderId: "1041638106968",
  appId: "1:1041638106968:web:6ec3f15c11e1337699e72d"
};

const BACKEND = 'https://fren-beckend.vercel.app';

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ── FREN NAME ─────────────────────────────────────────────────
function getFrenName() {
  const stored = localStorage.getItem('fren_name');
  if (stored) return stored;
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(2);
  const name = `${mm}/${dd}/${yy}fren`;
  localStorage.setItem('fren_name', name);
  return name;
}

const myName = getFrenName();
document.getElementById('my-name').textContent = myName;

// ── COPY CA ───────────────────────────────────────────────────
window.copyCA = function () {
  navigator.clipboard.writeText('0x000...fren');
  const btn = document.querySelector('.ca-copy');
  btn.textContent = '[ copied! ]';
  setTimeout(() => btn.textContent = '[ copy ]', 2000);
};

// ── NAV ACTIVE ────────────────────────────────────────────────
window.setActive = function (el) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  el.classList.add('active');
};

// ── TABS ──────────────────────────────────────────────────────
window.switchTab = function (el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
};

// ── COUNTRY POSITIONS ON MAP ──────────────────────────────────
const COUNTRY_POS = {
  NG: { x: 440, y: 228, name: 'Nigeria' },
  GB: { x: 418, y: 82,  name: 'United Kingdom' },
  US: { x: 165, y: 145, name: 'United States' },
  DE: { x: 455, y: 88,  name: 'Germany' },
  BR: { x: 220, y: 300, name: 'Brazil' },
  IN: { x: 600, y: 160, name: 'India' },
  CA: { x: 155, y: 100, name: 'Canada' },
  FR: { x: 435, y: 95,  name: 'France' },
  ZA: { x: 455, y: 310, name: 'South Africa' },
  AU: { x: 710, y: 268, name: 'Australia' },
  GH: { x: 425, y: 222, name: 'Ghana' },
  KE: { x: 495, y: 232, name: 'Kenya' },
  AE: { x: 565, y: 165, name: 'UAE' },
  JP: { x: 740, y: 110, name: 'Japan' },
  CN: { x: 680, y: 110, name: 'China' },
};

// ── SCAN STATS ────────────────────────────────────────────────
async function loadScanStats() {
  try {
    const res = await fetch(`${BACKEND}/api/stats`);
    const data = await res.json();

    document.getElementById('total-scans').textContent = data.total.toLocaleString();
    document.getElementById('total-countries').textContent = Object.keys(data.countries).length;

    // Map dots
    const dotsGroup = document.getElementById('scan-dots');
    dotsGroup.innerHTML = '';

    // Country table
    const tableEl = document.getElementById('country-rows');
    tableEl.innerHTML = '';

    const sorted = Object.entries(data.countries)
      .sort((a, b) => b[1].count - a[1].count);

    const maxScans = sorted[0]?.[1]?.count || 1;

    sorted.forEach(([code, info]) => {
      const pos = COUNTRY_POS[code];

      // Draw dot on map
      if (pos) {
        const size = Math.min(4 + (info.count / maxScans) * 8, 12);
        dotsGroup.innerHTML += `
          <circle cx="${pos.x}" cy="${pos.y}" r="${size}" fill="white" opacity="0.9"/>
          <circle cx="${pos.x}" cy="${pos.y}" r="${size + 8}" fill="white" opacity="0.08"/>
          <text x="${pos.x}" y="${pos.y + size + 13}" text-anchor="middle"
            fill="white" font-size="7" font-family="monospace" opacity="0.5">
            ${code} • ${info.count}
          </text>
        `;
      }

      // Table row
      const row = document.createElement('div');
      row.className = 'country-row';
      row.innerHTML = `
        <div>
          <span class="country-code">${code}</span>
          <span class="country-name">${pos?.name || code}</span>
        </div>
        <div class="scan-count">${info.count.toLocaleString()}</div>
        <div class="scan-bar-wrap">
          <div class="scan-bar-fill" style="width:${(info.count / maxScans) * 100}%"></div>
        </div>
      `;
      tableEl.appendChild(row);
    });

  } catch (err) {
    console.error('Stats error:', err);
  }
}

loadScanStats();
setInterval(loadScanStats, 30000);

// ── CHAT ──────────────────────────────────────────────────────
const messagesRef = ref(db, 'messages');
const feedEl = document.getElementById('messages-feed');

onValue(messagesRef, (snapshot) => {
  feedEl.innerHTML = '';
  const data = snapshot.val();

  if (!data) {
    feedEl.innerHTML = '<div class="loading-msg">no frens yet. be the first 👋</div>';
    return;
  }

  const messages = Object.entries(data)
    .map(([id, msg]) => ({ id, ...msg }))
    .sort((a, b) => a.timestamp - b.timestamp);

  // Online count (rough)
  document.getElementById('online-count').textContent =
    Math.min(messages.length + Math.floor(Math.random() * 10) + 3, 99);

  messages.forEach((msg, i) => {
    const el = document.createElement('div');
    el.className = 'message-item';

    const time = msg.timestamp
      ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    el.innerHTML = `
      <div class="msg-avatar">${(msg.name || 'fren').slice(0, 5)}</div>
      <div style="flex:1">
        <div>
          <span class="msg-name">${msg.name || 'anon'}</span>
          <span class="msg-num">No.${1000 + i}</span>
          <span class="msg-time">${time}</span>
        </div>
        <div class="msg-text">${msg.text}</div>
        <div class="msg-actions">
          <button class="msg-action-btn">[ reply ]</button>
          <button class="msg-action-btn">[ quote ]</button>
          <button class="msg-action-btn">[ +1 ]</button>
        </div>
      </div>
    `;
    feedEl.appendChild(el);
  });

  feedEl.scrollTop = feedEl.scrollHeight;
});

// ── POST MESSAGE ──────────────────────────────────────────────
window.postMessage = function () {
  const input = document.getElementById('message-input');
  const text = input.value.trim();
  if (!text) return;

  push(messagesRef, {
    name: myName,
    text: text,
    timestamp: Date.now(),
  });

  input.value = '';
};