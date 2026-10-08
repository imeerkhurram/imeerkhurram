#!/usr/bin/env node
// Draws the static profile visuals (hero, buttons, flagship card, project cards,
// toolbox) into assets/ in light and dark, from the content in profile.mjs.
// No dependencies. Run after editing profile.mjs: `node scripts/build-assets.mjs`

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { buttons, flagship, person, projects, toolbox } from "./profile.mjs";
import { MONO, SANS, THEMES, WIDTH, chipRow, esc, eyebrow, frame, textWidth, wrap } from "./theme.mjs";

const root = new URL("../", import.meta.url);

function hero(t) {
  const X = 40;
  const bars = 30;
  const barW = 5;
  const step = 9.5;
  const waveX = WIDTH - 40 - bars * step;
  const midY = 125;

  // A speech-like envelope: two swells with small ripples, fixed so every build matches.
  let wave = "";
  for (let i = 0; i < bars; i++) {
    const p = i / (bars - 1);
    const swell = 0.55 * Math.sin(Math.PI * p) + 0.25 * Math.abs(Math.sin(3.2 * Math.PI * p + 0.6));
    const ripple = 0.2 * Math.abs(Math.sin(i * 1.9));
    const h = Math.round(18 + 132 * Math.min(1, swell + ripple));
    const level = h > 118 ? 4 : h > 84 ? 3 : h > 50 ? 2 : 1;
    const delay = -((i * 0.137) % 1.8).toFixed(2);
    wave += `<rect class="b" x="${(waveX + i * step).toFixed(1)}" y="${midY - h / 2}" width="${barW}" height="${h}" rx="2.5" fill="${t.ramp[level]}" style="animation-delay:${delay}s"/>`;
  }

  const chips = chipRow(X, 170, person.focus, t, { maxWidth: 440, size: 13, height: 28, padX: 13 });
  const body = `<style>
.b{transform-box:fill-box;transform-origin:center;animation:w 1.8s ease-in-out infinite}
@keyframes w{0%,100%{transform:scaleY(.5)}50%{transform:scaleY(1)}}
@media (prefers-reduced-motion:reduce){.b{animation:none}}
</style>
${eyebrow(X, 58, person.role, t)}
<text x="${X}" y="112" font-size="46" font-weight="700" letter-spacing="-0.8" fill="${t.ink}">${esc(person.name)}</text>
<text x="${X}" y="146" font-size="18" fill="${t.secondary}">${esc(person.tagline)}</text>
${chips.svg}
<text x="${X}" y="226" font-size="12" fill="${t.muted}">${esc(person.location)}</text>
${wave}`;
  return frame(250, t, {
    title: `${person.name}, ${person.role}`,
    desc: `${person.tagline} ${person.focus.join(", ")}. ${person.location}.`,
    body,
    gradient: true,
  });
}

function button(b, t) {
  const size = 14;
  const h = 38;
  const w = Math.ceil(textWidth(b.label, size, { bold: true }) + 40);
  const fill = b.primary ? t.accent : t.surface;
  const stroke = b.primary ? t.accent : t.border;
  const ink = b.primary ? t.accentInk : t.ink;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(b.label)}" font-family="${SANS}">
<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="${h / 2}" fill="${fill}" stroke="${stroke}"/>
<text x="${w / 2}" y="${h / 2 + 5}" font-size="${size}" font-weight="600" text-anchor="middle" fill="${ink}">${esc(b.label)}</text>
</svg>
`;
}

function flagshipCard(t) {
  const X = 32;
  const inner = WIDTH - 2 * X;
  let svg = eyebrow(X, 50, "Flagship project", t);

  const pillW = Math.ceil(textWidth(flagship.status, 12) + 40);
  const pillX = WIDTH - X - pillW;
  svg +=
    `<rect x="${pillX + 0.5}" y="32.5" width="${pillW - 1}" height="27" rx="14" fill="${t.raised}" stroke="${t.border}"/>` +
    `<circle cx="${pillX + 16}" cy="46" r="4" fill="${t.good}"/>` +
    `<text x="${pillX + 27}" y="50.5" font-size="12" fill="${t.ink}">${esc(flagship.status)}</text>`;

  svg += `<text x="${X}" y="94" font-size="30" font-weight="700" letter-spacing="-0.4" fill="${t.ink}">${esc(flagship.name)}</text>`;
  let y = 124;
  for (const line of wrap(flagship.summary, 15, inner)) {
    svg += `<text x="${X}" y="${y}" font-size="15" fill="${t.secondary}">${esc(line)}</text>`;
    y += 22;
  }

  // The call path, left to right. The agent is the step the two rows below describe.
  y += 10;
  const gap = 30;
  const nodeW = (inner - gap * (flagship.path.length - 1)) / flagship.path.length;
  const nodeH = 62;
  flagship.path.forEach(([name, note], i) => {
    const nx = X + i * (nodeW + gap);
    const strong = name === "Voice agent";
    svg +=
      `<rect x="${nx + 0.5}" y="${y + 0.5}" width="${nodeW - 1}" height="${nodeH - 1}" rx="10" fill="${strong ? t.tint : t.raised}" stroke="${strong ? t.accent : t.border}"/>` +
      `<text x="${nx + nodeW / 2}" y="${y + 27}" font-size="13.5" font-weight="600" text-anchor="middle" fill="${t.ink}">${esc(name)}</text>` +
      `<text x="${nx + nodeW / 2}" y="${y + 45}" font-size="11.5" text-anchor="middle" fill="${t.muted}">${esc(note)}</text>`;
    if (i < flagship.path.length - 1) {
      const ax = nx + nodeW + 7;
      const ay = y + nodeH / 2;
      svg += `<path d="M${ax} ${ay}h${gap - 14}m-5 -4l5 4l-5 4" fill="none" stroke="${t.muted}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
  });
  y += nodeH + 22;

  const labelW = 160;
  for (const [label, items, strong] of [
    ["Speech engines", flagship.engines, true],
    ["Each call returns", flagship.outputs, false],
  ]) {
    svg += eyebrow(X, y + 16, label, t);
    const row = chipRow(X + labelW, y, items, t, { maxWidth: inner - labelW, strong });
    svg += row.svg;
    y += row.height + 12;
  }

  y += 10;
  svg += `<line x1="${X}" y1="${y}" x2="${WIDTH - X}" y2="${y}" stroke="${t.border}"/>`;
  const colW = inner / flagship.facts.length;
  let factsBottom = y;
  flagship.facts.forEach(([value, label], i) => {
    const fx = X + i * colW;
    svg += `<text x="${fx}" y="${y + 46}" font-size="28" font-weight="700" fill="${t.ink}">${esc(value)}</text>`;
    wrap(label, 12.5, colW - 24).forEach((line, n) => {
      svg += `<text x="${fx}" y="${y + 68 + n * 17}" font-size="12.5" fill="${t.secondary}">${esc(line)}</text>`;
      factsBottom = Math.max(factsBottom, y + 68 + n * 17);
    });
  });

  return frame(factsBottom + 30, t, {
    title: `${flagship.name}: ${flagship.status}`,
    desc:
      `${flagship.summary} Call path: ${flagship.path.map((p) => p[0]).join(", then ")}. ` +
      `Speech engines: ${flagship.engines.join(", ")}. Each call returns: ${flagship.outputs.join(", ")}. ` +
      flagship.facts.map(([v, l]) => `${v} ${l}`).join(". ") + ".",
    body: svg,
  });
}

function projectCard(p, t) {
  const W = 412;
  const X = 24;
  const live = p.kind.toLowerCase().startsWith("live");
  let svg = live ? `<circle cx="${X + 4}" cy="36" r="4" fill="${t.good}"/>` : "";
  svg += eyebrow(live ? X + 15 : X, 40, p.kind, t);
  svg += `<path d="M${W - X - 12} 42l12 -12m-9 0h9v9" fill="none" stroke="${t.muted}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
  svg += `<text x="${X}" y="78" font-size="22" font-weight="700" letter-spacing="-0.2" fill="${t.ink}">${esc(p.name)}</text>`;
  wrap(p.summary, 13.5, W - 2 * X).forEach((line, n) => {
    svg += `<text x="${X}" y="${104 + n * 19}" font-size="13.5" fill="${t.secondary}">${esc(line)}</text>`;
  });
  svg += chipRow(X, 136, p.stack, t, { maxWidth: W - 2 * X, size: 11.5, height: 22, padX: 9, gap: 6 }).svg;
  return frame(182, t, {
    width: W,
    title: `${p.name} (${p.kind})`,
    desc: `${p.summary} Built with ${p.stack.join(", ")}.`,
    body: svg,
  });
}

function toolboxCard(t) {
  const X = 32;
  const labelW = 132;
  let y = 30;
  let svg = "";
  toolbox.forEach(([label, items], i) => {
    if (i > 0) {
      svg += `<line x1="${X}" y1="${y}" x2="${WIDTH - X}" y2="${y}" stroke="${t.border}"/>`;
      y += 16;
    }
    svg += eyebrow(X, y + 16, label, t);
    const row = chipRow(X + labelW, y, items, t, { maxWidth: WIDTH - 2 * X - labelW });
    svg += row.svg;
    y += row.height + 16;
  });
  return frame(y + 14, t, {
    title: "What I work with",
    desc: toolbox.map(([label, items]) => `${label}: ${items.join(", ")}`).join(". ") + ".",
    body: svg,
  });
}

const files = {};
for (const [name, t] of Object.entries(THEMES)) {
  files[`assets/hero-${name}.svg`] = hero(t);
  files[`assets/avivro-${name}.svg`] = flagshipCard(t);
  files[`assets/toolbox-${name}.svg`] = toolboxCard(t);
  for (const p of projects) files[`assets/project-${p.id}-${name}.svg`] = projectCard(p, t);
  for (const b of buttons.filter((b) => !b.primary)) files[`assets/btn-${b.id}-${name}.svg`] = button(b, t);
}
// The filled button reads the same on both themes, so it needs one file.
for (const b of buttons.filter((b) => b.primary)) files[`assets/btn-${b.id}.svg`] = button(b, THEMES.light);

await mkdir(new URL("assets/", root), { recursive: true });
const changed = [];
for (const [path, content] of Object.entries(files)) {
  const url = new URL(path, root);
  if ((await readFile(url, "utf8").catch(() => null)) === content) continue;
  await writeFile(url, content);
  changed.push(path);
}
console.log(changed.length ? `Rewrote ${changed.length} file(s):\n  ${changed.join("\n  ")}` : "Assets already up to date.");
