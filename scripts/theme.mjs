// Shared look for every generated SVG in assets/: colours, type and small layout
// helpers. SVGs shown through <img> cannot load web fonts, so only system stacks.

export const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif";
export const MONO = "ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace";

export const WIDTH = 840;
export const RADIUS = 12;

// ramp[0] is the "nothing" neutral; 1-4 are one blue hue, darker = more on light
// and lighter = more on dark.
export const THEMES = {
  light: {
    surface: "#ffffff",
    tint: "#eaf3fe",
    raised: "#f6f8fa",
    border: "#d9dee5",
    ink: "#0b0b0b",
    secondary: "#52514e",
    muted: "#6f6e69",
    accent: "#2a78d6",
    accentInk: "#ffffff",
    good: "#0ca30c",
    ramp: ["#f0efec", "#86b6ef", "#3987e5", "#1c5cab", "#0d366b"],
  },
  dark: {
    surface: "#0d1117",
    tint: "#10233d",
    raised: "#151b23",
    border: "#2b323c",
    ink: "#ffffff",
    secondary: "#c3c2b7",
    muted: "#898781",
    accent: "#3987e5",
    accentInk: "#ffffff",
    good: "#0ca30c",
    ramp: ["#22262c", "#184f95", "#2a78d6", "#6da7ec", "#b7d3f6"],
  },
};

export const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Rough advance widths, good enough to size chips and wrap lines without a font engine.
export function textWidth(text, size, { mono = false, bold = false } = {}) {
  if (mono) return text.length * size * 0.61;
  let units = 0;
  for (const ch of text) {
    if (" .,:;'|!il".includes(ch)) units += 0.28;
    else if ("ftjr()-·".includes(ch)) units += 0.36;
    else if ("mwMW".includes(ch)) units += 0.86;
    else if (ch >= "A" && ch <= "Z") units += 0.67;
    else if (ch >= "0" && ch <= "9") units += 0.58;
    else units += 0.54;
  }
  return units * size * (bold ? 1.06 : 1);
}

export function wrap(text, size, maxWidth, opts) {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (line && textWidth(next, size, opts) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function chip(x, y, label, t, { size = 12, padX = 10, height = 24, strong = false } = {}) {
  const w = Math.ceil(textWidth(label, size) + padX * 2);
  const fill = strong ? t.tint : t.raised;
  const stroke = strong ? t.accent : t.border;
  const svg =
    `<rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${height - 1}" rx="${height / 2}" fill="${fill}" stroke="${stroke}"/>` +
    `<text x="${x + w / 2}" y="${y + height / 2 + size * 0.36}" font-size="${size}" text-anchor="middle" fill="${t.ink}">${esc(label)}</text>`;
  return { svg, w };
}

// Lays chips left to right, wrapping at maxWidth. Returns the markup and the height used.
export function chipRow(x, y, labels, t, { maxWidth, gap = 8, lineGap = 8, ...opts } = {}) {
  const height = opts.height ?? 24;
  let cx = x;
  let cy = y;
  let svg = "";
  for (const label of labels) {
    const w = Math.ceil(textWidth(label, opts.size ?? 12) + (opts.padX ?? 10) * 2);
    if (cx > x && cx + w > x + maxWidth) {
      cx = x;
      cy += height + lineGap;
    }
    svg += chip(cx, cy, label, t, opts).svg;
    cx += w + gap;
  }
  return { svg, height: cy + height - y };
}

export function frame(height, t, { title, desc, body, width = WIDTH, gradient = false }) {
  const fill = gradient ? "url(#wash)" : t.surface;
  const defs = gradient
    ? `<defs><linearGradient id="wash" x1="0" y1="0" x2="1" y2="1"><stop offset="0.35" stop-color="${t.surface}"/><stop offset="1" stop-color="${t.tint}"/></linearGradient></defs>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc" font-family="${SANS}">
<title id="title">${esc(title)}</title>
<desc id="desc">${esc(desc)}</desc>
${defs}<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${RADIUS}" fill="${fill}" stroke="${t.border}"/>
${body}
</svg>
`;
}

export const eyebrow = (x, y, label, t, anchor = "start") =>
  `<text x="${x}" y="${y}" font-family="${MONO}" font-size="11" letter-spacing="1.4" text-anchor="${anchor}" fill="${t.muted}">${esc(label.toUpperCase())}</text>`;
