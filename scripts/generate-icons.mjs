import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = resolve(__dirname, "../public/icons");
mkdirSync(iconsDir, { recursive: true });

// ── iOS 規格：正方形滿版背景，系統自動套圓角 ──
function makeSVG(size) {
  const s = size;
  const k = s / 512;
  const cx = s / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <!-- 正方形滿版背景漸層 -->
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a1a3e"/>
      <stop offset="50%" stop-color="#0d0d22"/>
      <stop offset="100%" stop-color="#0a0a18"/>
    </linearGradient>
    <!-- 紅球 -->
    <radialGradient id="r1" cx="35%" cy="30%" r="65%">
      <stop offset="0%" stop-color="#ff8c94"/>
      <stop offset="100%" stop-color="#c1121f"/>
    </radialGradient>
    <!-- 橙球 -->
    <radialGradient id="r2" cx="35%" cy="30%" r="65%">
      <stop offset="0%" stop-color="#ffcb8e"/>
      <stop offset="100%" stop-color="#d4721a"/>
    </radialGradient>
    <!-- 青球 -->
    <radialGradient id="r3" cx="35%" cy="30%" r="65%">
      <stop offset="0%" stop-color="#5de6d8"/>
      <stop offset="100%" stop-color="#157a70"/>
    </radialGradient>
    <!-- 藍球 -->
    <radialGradient id="r4" cx="35%" cy="30%" r="65%">
      <stop offset="0%" stop-color="#7bb8d8"/>
      <stop offset="100%" stop-color="#245f80"/>
    </radialGradient>
    <!-- 紫球 -->
    <radialGradient id="r5" cx="35%" cy="30%" r="65%">
      <stop offset="0%" stop-color="#c084fc"/>
      <stop offset="100%" stop-color="#4c1d95"/>
    </radialGradient>
    <!-- 金球（特別號） -->
    <radialGradient id="rg" cx="35%" cy="30%" r="65%">
      <stop offset="0%" stop-color="#ffe97a"/>
      <stop offset="100%" stop-color="#a16207"/>
    </radialGradient>
    <!-- 球陰影 -->
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="${2*k}" dy="${4*k}" stdDeviation="${5*k}" flood-color="#00000070"/>
    </filter>
    <!-- 背景光暈 -->
    <filter id="bgGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="${30*k}" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- ① 正方形滿版背景 -->
  <rect width="${s}" height="${s}" fill="url(#bg)"/>

  <!-- ② 背景裝飾：柔和光暈圓 -->
  <circle cx="${s*0.25}" cy="${s*0.28}" r="${s*0.28}" fill="#e63946" opacity="0.06"/>
  <circle cx="${s*0.75}" cy="${s*0.32}" r="${s*0.22}" fill="#6d3fa8" opacity="0.08"/>
  <circle cx="${s*0.50}" cy="${s*0.72}" r="${s*0.30}" fill="#2a9d8f" opacity="0.07"/>

  <!-- ③ 小星點 -->
  ${stars(s, k)}

  <!-- ④ 號碼球（號碼全在 1–47 區間）-->
  <!-- 上排 3 球：06 / 17 / 29 -->
  ${ball(s, 0.22, 0.36, 0.148, "r1", "06", k)}
  ${ball(s, 0.50, 0.26, 0.148, "r2", "17", k)}
  ${ball(s, 0.78, 0.36, 0.148, "r3", "29", k)}
  <!-- 下排 2 球：33 / 45 -->
  ${ball(s, 0.34, 0.60, 0.148, "r4", "33", k)}
  ${ball(s, 0.66, 0.60, 0.148, "r5", "45", k)}

  <!-- ⑤ 特別號（右下角，金色） -->
  ${specialBall(s, 0.83, 0.80, 0.092, "rg", "★", k)}

  <!-- ⑥ 品牌文字 -->
  <text x="${cx}" y="${s*0.938}" text-anchor="middle"
    font-family="system-ui, -apple-system, PingFang TC, sans-serif"
    font-size="${20*k}" font-weight="700" letter-spacing="${2.5*k}"
    fill="rgba(255,255,255,0.45)">大樂透</text>
</svg>`;
}

function ball(s, xR, yR, rR, grad, label, k) {
  const x = s * xR, y = s * yR, r = s * rR;
  const fs = r * 0.70;
  const glows = { r1:"#e6394640", r2:"#f4a26140", r3:"#2a9d8f40", r4:"#457b9d40", r5:"#9b5de540" };
  return `
  <circle cx="${x}" cy="${y}" r="${r*1.3}" fill="${glows[grad]??'#ffffff20'}"/>
  <circle cx="${x}" cy="${y}" r="${r}" fill="url(#${grad})" filter="url(#shadow)"/>
  <ellipse cx="${x-r*0.22}" cy="${y-r*0.28}" rx="${r*0.36}" ry="${r*0.22}" fill="white" opacity="0.32"/>
  <text x="${x}" y="${y+fs*0.37}" text-anchor="middle"
    font-family="system-ui,-apple-system,sans-serif"
    font-size="${fs}" font-weight="900" fill="white"
    paint-order="stroke" stroke="rgba(0,0,0,0.25)" stroke-width="${r*0.055}">${label}</text>`;
}

function specialBall(s, xR, yR, rR, grad, label, k) {
  const x = s * xR, y = s * yR, r = s * rR;
  const fs = r * 0.85;
  return `
  <circle cx="${x}" cy="${y}" r="${r*1.5}" fill="#ffd70025"/>
  <circle cx="${x}" cy="${y}" r="${r*1.15}" fill="none" stroke="#ffd700"
    stroke-width="${2.2*k}" stroke-dasharray="${5.5*k} ${3.5*k}" opacity="0.9"/>
  <circle cx="${x}" cy="${y}" r="${r}" fill="url(#${grad})" filter="url(#shadow)"/>
  <ellipse cx="${x-r*0.2}" cy="${y-r*0.26}" rx="${r*0.33}" ry="${r*0.20}" fill="white" opacity="0.38"/>
  <text x="${x}" y="${y+fs*0.38}" text-anchor="middle"
    font-family="system-ui,sans-serif"
    font-size="${fs}" font-weight="900" fill="#1c1410">${label}</text>`;
}

function stars(s, k) {
  const pts = [
    [0.08,0.08],[0.92,0.06],[0.05,0.52],[0.95,0.48],
    [0.15,0.88],[0.85,0.90],[0.50,0.05],[0.38,0.92],
  ];
  return pts.map(([x, y]) => {
    const r = (1.8 + Math.random() * 2.2) * k;
    const op = (0.18 + Math.random() * 0.28).toFixed(2);
    return `<circle cx="${(s*x).toFixed(1)}" cy="${(s*y).toFixed(1)}" r="${r.toFixed(1)}" fill="white" opacity="${op}"/>`;
  }).join("\n  ");
}

// ── 產生 & 轉換 ──
const sizes = [180, 192, 512]; // 180 = Apple Touch Icon 標準尺寸

for (const size of sizes) {
  const svg = makeSVG(size);
  const svgPath = resolve(iconsDir, `icon-${size}x${size}.svg`);
  writeFileSync(svgPath, svg, "utf-8");
  console.log(`✓ SVG ${size}px saved`);
}

const { default: sharp } = await import("sharp");

for (const size of sizes) {
  const svgPath = resolve(iconsDir, `icon-${size}x${size}.svg`);
  const pngPath = resolve(iconsDir, `icon-${size}x${size}.png`);
  await sharp(svgPath).png().toFile(pngPath);
  console.log(`✓ PNG ${size}px saved`);
}

// favicon 32px
await sharp(resolve(iconsDir, "icon-192x192.svg"))
  .resize(32, 32).png()
  .toFile(resolve(__dirname, "../public/favicon.png"));
console.log("✓ favicon.png saved");

console.log("\n🎉 All icons generated (square, iOS-ready)");
