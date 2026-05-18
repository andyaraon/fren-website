import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ── FIREBASE CONFIG ───────────────────────────────────────────
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
  navigator.clipboard.writeText('FqV9fmCVVCpfstxrG5HHkJpdt3xjn9EQn5WY1uAypump');
  const btn = document.querySelector('.ca-copy');
  btn.textContent = '[ copied! ]';
  setTimeout(() => btn.textContent = '[ copy ]', 2000);
};

// ── NAV ───────────────────────────────────────────────────────
window.setActive = function (el) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  el.classList.add('active');
};

window.switchTab = function (el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
};

// ── SPINNING 3D GLOBE ─────────────────────────────────────────
const SCAN_POINTS = [
  { lat: 6.5,   lng: 3.4,    label: 'Lagos',      code: 'NG' },
  { lat: 51.5,  lng: -0.1,   label: 'London',     code: 'GB' },
  { lat: 40.7,  lng: -74.0,  label: 'New York',   code: 'US' },
  { lat: 52.5,  lng: 13.4,   label: 'Berlin',     code: 'DE' },
  { lat: -23.5, lng: -46.6,  label: 'São Paulo',  code: 'BR' },
  { lat: 28.6,  lng: 77.2,   label: 'Delhi',      code: 'IN' },
  { lat: 43.7,  lng: -79.4,  label: 'Toronto',    code: 'CA' },
  { lat: -33.9, lng: 18.4,   label: 'Cape Town',  code: 'ZA' },
  { lat: 25.2,  lng: 55.3,   label: 'Dubai',      code: 'AE' },
  { lat: 1.3,   lng: 103.8,  label: 'Singapore',  code: 'SG' },
];

function initGlobe(scanData) {
  const canvas = document.getElementById('globe-canvas');
  if (!canvas) return;

  let rotation = 0;
  let isDragging = false;
  let lastX = 0;
  let animId;

  const resize = () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  const ctx = canvas.getContext('2d');

  const latLngTo3D = (lat, lng, rot) => {
    const phi   = (90 - lat) * Math.PI / 180;
    const theta = (lng + rot) * Math.PI / 180;
    const W = canvas.width, H = canvas.height;
    const R = Math.min(W, H) * 0.38;
    const cx = W / 2, cy = H / 2;
    return {
      x: cx + R * Math.sin(phi) * Math.cos(theta),
      y: cy - R * Math.cos(phi),
      z: R * Math.sin(phi) * Math.sin(theta),
      R, cx, cy
    };
  };

  const draw = (rot) => {
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) * 0.38;
    ctx.clearRect(0, 0, W, H);

    // Atmosphere
    const atmo = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 1.3);
    atmo.addColorStop(0, 'rgba(30,100,255,0.15)');
    atmo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = atmo;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Globe body
    const grad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.05, cx, cy, R);
    grad.addColorStop(0, '#1a3a6e');
    grad.addColorStop(0.4, '#0a1a3e');
    grad.addColorStop(1, '#030912');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    // Latitude grid lines
    ctx.strokeStyle = 'rgba(50,100,255,0.1)';
    ctx.lineWidth = 0.5;
    for (let lat = -60; lat <= 60; lat += 30) {
      const phi = (90 - lat) * Math.PI / 180;
      const rx = R * Math.sin(phi);
      const ry = R * Math.cos(phi);
      if (rx > 0) {
        ctx.beginPath();
        ctx.ellipse(cx, cy + ry, rx, Math.abs(ry * 0.15), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Longitude grid lines
    for (let lng = 0; lng < 360; lng += 30) {
      ctx.beginPath();
      let started = false;
      for (let lat = -90; lat <= 90; lat += 3) {
        const phi   = (90 - lat) * Math.PI / 180;
        const theta = (lng + rot) * Math.PI / 180;
        const z = Math.sin(phi) * Math.sin(theta);
        if (z >= 0) {
          const sx = cx + R * Math.sin(phi) * Math.cos(theta);
          const sy = cy - R * Math.cos(phi);
          if (!started) { ctx.moveTo(sx, sy); started = true; }
          else ctx.lineTo(sx, sy);
        } else { started = false; }
      }
      ctx.stroke();
    }

    // Rim
    ctx.strokeStyle = 'rgba(100,160,255,0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();

    // Specular
    const spec = ctx.createRadialGradient(
      cx - R * 0.35, cy - R * 0.35, 0,
      cx - R * 0.35, cy - R * 0.35, R * 0.55
    );
    spec.addColorStop(0, 'rgba(150,200,255,0.15)');
    spec.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = spec;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    // Scan dots
    const points = SCAN_POINTS.map(p => {
      const phi   = (90 - p.lat) * Math.PI / 180;
      const theta = (p.lng + rot) * Math.PI / 180;
      const z = Math.sin(phi) * Math.sin(theta);
      const x = cx + R * Math.sin(phi) * Math.cos(theta);
      const y = cy - R * Math.cos(phi);
      const scans = scanData[p.code] || 0;
      return { ...p, x, y, z, scans };
    })
    .filter(p => p.z >= 0)
    .sort((a, b) => b.z - a.z);

    points.forEach(p => {
      const depth = p.z / R;
      const alpha = 0.4 + depth * 0.6;
      const dotSize = 2 + depth * 4;

      // Pulse ring
      ctx.beginPath();
      ctx.arc(p.x, p.y, dotSize + 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(74,171,255,${alpha * 0.12})`;
      ctx.fill();

      // Dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, dotSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(120,220,255,${alpha})`;
      ctx.shadowColor = '#4aabff';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Label
      if (depth > 0.4) {
        ctx.fillStyle = `rgba(180,230,255,${alpha * 0.85})`;
        ctx.font = `${8 + depth * 2}px 'Space Mono', monospace`;
        const scanText = p.scans > 0 ? ` • ${p.scans.toLocaleString()}` : '';
        ctx.fillText(`${p.label}${scanText}`, p.x + dotSize + 5, p.y + 3);
      }
    });
  };

  const animate = () => {
    if (!isDragging) rotation -= 0.12;
    draw(rotation);
    animId = requestAnimationFrame(animate);
  };
  animate();

  // Mouse
  canvas.addEventListener('mousedown', e => { isDragging = true; lastX = e.clientX; });
  window.addEventListener('mouseup', () => { isDragging = false; });
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    rotation += (e.clientX - lastX) * 0.3;
    lastX = e.clientX;
  });

  // Touch
  canvas.addEventListener('touchstart', e => { isDragging = true; lastX = e.touches[0].clientX; });
  window.addEventListener('touchend', () => { isDragging = false; });
  window.addEventListener('touchmove', e => {
    if (!isDragging) return;
    rotation += (e.touches[0].clientX - lastX) * 0.3;
    lastX = e.touches[0].clientX;
  });
}

// ── COUNTRY POSITIONS (for table) ────────────────────────────
const COUNTRY_NAMES = {
  NG: 'Nigeria', GB: 'United Kingdom', US: 'United States',
  DE: 'Germany', BR: 'Brazil', IN: 'India', CA: 'Canada',
  FR: 'France', ZA: 'South Africa', AU: 'Australia',
  GH: 'Ghana', KE: 'Kenya', AE: 'UAE', JP: 'Japan', CN: 'China',
};

// ── SCAN STATS ────────────────────────────────────────────────
async function loadScanStats() {
  try {
    const res = await fetch(`${BACKEND}/api/stats`);
    const data = await res.json();

    document.getElementById('total-scans').textContent = data.total.toLocaleString();
    document.getElementById('total-countries').textContent = Object.keys(data.countries).length;

    // Build scan data map for globe dots
    const scanData = {};
    Object.entries(data.countries).forEach(([code, info]) => {
      scanData[code] = info.count;
    });

    // Init globe with real data
    initGlobe(scanData);

    // Country table
    const tableEl = document.getElementById('country-rows');
    tableEl.innerHTML = '';
    const sorted = Object.entries(data.countries).sort((a, b) => b[1].count - a[1].count);
    const maxScans = sorted[0]?.[1]?.count || 1;

    sorted.forEach(([code, info]) => {
      const row = document.createElement('div');
      row.className = 'country-row';
      row.innerHTML = `
        <div>
          <span class="country-code">${code}</span>
          <span class="country-name">${COUNTRY_NAMES[code] || code}</span>
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
    // Init globe with empty data if API fails
    initGlobe({});
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

// ── POST ──────────────────────────────────────────────────────
window.postMessage = function () {
  const input = document.getElementById('message-input');
  const text = input.value.trim();
  if (!text) return;
  push(messagesRef, {
    name: myName,
    text,
    timestamp: Date.now(),
  });
  input.value = '';
};