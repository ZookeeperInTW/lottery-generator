import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = resolve(__dirname, "../public/icons");
mkdirSync(iconsDir, { recursive: true });

// ── SVG 設計：深色圓形背景 + 彩色樂透球 + 光暈 ──
function makeSVG(size) {
  const s = size;
  const cx = s / 2;

  // 縮放係數（以 512 為基準）
  const k = s / 512;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <!-- 背景漸層 -->
    <radialGradient id="bg" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#26264a"/>
      <stop offset="100%" stop-color="#0a0a18"/>
    </radialGradient>
    <!-- 紅球漸層 -->
    <radialGradient id="r1" cx="35%" cy="32%" r="65%">
      <stop offset="0%" stop-color="#ff7b85"/>
      <stop offset="100%" stop-color="#c1121f"/>
    </radialGradient>
    <!-- 橙球漸層 -->
    <radialGradient id="r2" cx="35%" cy="32%" r="65%">
      <stop offset="0%" stop-color="#ffcb8e"/>
      <stop offset="100%" stop-color="#e07a20"/>
    </radialGradient>
    <!-- 青球漸層 -->
    <radialGradient id="r3" cx="35%" cy="32%" r="65%">
      <stop offset="0%" stop-color="#5de6d8"/>
      <stop offset="100%" stop-color="#1a7a70"/>
    </radialGradient>
    <!-- 藍球漸層 -->
    <radialGradient id="r4" cx="35%" cy="32%" r="65%">
      <stop offset="0%" stop-color="#7bb8d8"/>
      <stop offset="100%" stop-color="#2d5f80"/>
    </radialGradient>
    <!-- 紫球漸層 -->
    <radialGradient id="r5" cx="35%" cy="32%" r="65%">
      <stop offset="0%" stop-color="#c084fc"/>
      <stop offset="100%" stop-color="#5b21b6"/>
    </radialGradient>
    <!-- 金色球漸層（特別號） -->
    <radialGradient id="rg" cx="35%" cy="32%" r="65%">
      <stop offset="0%" stop-color="#ffe566"/>
      <stop offset="100%" stop-color="#b8860b"/>
    </radialGradient>
    <!-- 外圈光暈 -->
    <filter id="glow">
      <feGaussianBlur stdDeviation="${6 * k}" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <!-- 球體陰影 -->
    <filter id="shadow">
      <feDropShadow dx="${3 * k}" dy="${5 * k}" stdDeviation="${6 * k}" flood-color="#00000060"/>
    </filter>
    <!-- 裁切圓形 -->
    <clipPath id="circle"><circle cx="${cx}" cy="${cx}" r="${cx}"/></clipPath>
  </defs>

  <!-- 背景圓形 -->
  <circle cx="${cx}" cy="${cx}" r="${cx}" fill="url(#bg)"/>

  <!-- 裝飾：外圈星點 -->
  ${sparkles(s, k)}

  <!-- 球座配置（5球扇形排列 + 1特別號） -->
  <!-- 上排：3球 -->
  ${ball(s, 0.28, 0.34, 0.155, "r1", "07", k)}
  ${ball(s, 0.50, 0.25, 0.155, "r2", "19", k)}
  ${ball(s, 0.72, 0.34, 0.155, "r3", "28", k)}
  <!-- 下排：2球 -->
  ${ball(s, 0.355, 0.575, 0.155, "r4", "35", k)}
  ${ball(s, 0.645, 0.575, 0.155, "r5", "42", k)}

  <!-- 特別號（右下，稍小，金色虛線邊框） -->
  ${specialBall(s, 0.82, 0.78, 0.095, "rg", "★", k)}

  <!-- 底部品牌文字 -->
  <text x="${cx}" y="${s * 0.935}" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="${18 * k}" font-weight="700" letter-spacing="${2 * k}"
    fill="#ffffff60">大樂透</text>
</svg>`;
}

function ball(s, xRatio, yRatio, rRatio, gradId, label, k) {
  const x = s * xRatio;
  const y = s * yRatio;
  const r = s * rRatio;
  const fontSize = r * 0.72;
  const glowColor = gradId === "r1" ? "#e6394650" : gradId === "r2" ? "#f4a26150" :
    gradId === "r3" ? "#2a9d8f50" : gradId === "r4" ? "#457b9d50" : "#9b5de550";

  return `
  <!-- 光暈 -->
  <circle cx="${x}" cy="${y}" r="${r * 1.25}" fill="${glowColor}" opacity="0.6"/>
  <!-- 球體 -->
  <circle cx="${x}" cy="${y}" r="${r}" fill="url(#${gradId})" filter="url(#shadow)"/>
  <!-- 高光 -->
  <ellipse cx="${x - r * 0.2}" cy="${y - r * 0.28}" rx="${r * 0.35}" ry="${r * 0.22}" fill="white" opacity="0.35"/>
  <!-- 號碼 -->
  <text x="${x}" y="${y + fontSize * 0.36}" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="${fontSize}" font-weight="900" fill="white"
    paint-order="stroke" stroke="rgba(0,0,0,0.3)" stroke-width="${r * 0.06}">${label}</text>`;
}

function specialBall(s, xRatio, yRatio, rRatio, gradId, label, k) {
  const x = s * xRatio;
  const y = s * yRatio;
  const r = s * rRatio;
  const fontSize = r * 0.82;
  return `
  <!-- 特別號光暈 -->
  <circle cx="${x}" cy="${y}" r="${r * 1.4}" fill="#ffd70030" opacity="0.8"/>
  <!-- 虛線外圈 -->
  <circle cx="${x}" cy="${y}" r="${r * 1.12}" fill="none" stroke="#ffd700" stroke-width="${2.5 * k}"
    stroke-dasharray="${6 * k} ${4 * k}"/>
  <!-- 球體 -->
  <circle cx="${x}" cy="${y}" r="${r}" fill="url(#${gradId})" filter="url(#shadow)"/>
  <!-- 高光 -->
  <ellipse cx="${x - r * 0.18}" cy="${y - r * 0.25}" rx="${r * 0.32}" ry="${r * 0.2}" fill="white" opacity="0.4"/>
  <!-- 星號 -->
  <text x="${x}" y="${y + fontSize * 0.38}" text-anchor="middle"
    font-family="system-ui, sans-serif"
    font-size="${fontSize}" font-weight="900" fill="#1a1a1a">${label}</text>`;
}

function sparkles(s, k) {
  const pts = [
    [0.12, 0.18], [0.88, 0.14], [0.06, 0.62], [0.94, 0.72],
    [0.22, 0.88], [0.78, 0.90], [0.50, 0.08],
  ];
  return pts.map(([x, y]) => {
    const size = (2.5 + Math.random() * 2) * k;
    return `<circle cx="${s * x}" cy="${s * y}" r="${size}" fill="white" opacity="${0.2 + Math.random() * 0.3}"/>`;
  }).join("\n  ");
}

// 產生並儲存 SVG + PNG
const sizes = [192, 512];

for (const size of sizes) {
  const svg = makeSVG(size);
  const svgPath = resolve(iconsDir, `icon-${size}x${size}.svg`);
  writeFileSync(svgPath, svg, "utf-8");
  console.log(`✓ SVG saved: ${svgPath}`);
}

// 嘗試用 sharp 轉 PNG
try {
  const { default: sharp } = await import("sharp");
  for (const size of sizes) {
    const svgPath = resolve(iconsDir, `icon-${size}x${size}.svg`);
    const pngPath = resolve(iconsDir, `icon-${size}x${size}.png`);
    await sharp(svgPath).png().toFile(pngPath);
    console.log(`✓ PNG saved: ${pngPath}`);
  }
  // favicon
  await sharp(resolve(iconsDir, "icon-192x192.svg"))
    .resize(32, 32)
    .png()
    .toFile(resolve(__dirname, "../public/favicon.ico"));
  console.log("✓ favicon.ico saved");
} catch {
  console.log("ℹ sharp 未安裝，SVG 圖示已備妥（可直接使用 SVG）");
  // 更新 manifest 指向 SVG
}
