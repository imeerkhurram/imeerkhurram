#!/usr/bin/env node
// Rebuilds the activity card (assets/activity-{light,dark}.svg) and the ACTIVITY
// block in README.md from the GitHub contribution calendar.
// No dependencies. Needs Node 20+ and a token in GITHUB_TOKEN (or GH_TOKEN).

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { THEMES, WIDTH, frame } from "./theme.mjs";

const login = process.env.GH_LOGIN || process.env.GITHUB_REPOSITORY_OWNER;
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!login || !token) {
  console.error("Set GH_LOGIN (or GITHUB_REPOSITORY_OWNER) and GITHUB_TOKEN.");
  process.exit(1);
}

const root = new URL("../", import.meta.url);
const START = "<!--ACTIVITY:START-->";
const END = "<!--ACTIVITY:END-->";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LEVELS = ["NONE", "FIRST_QUARTILE", "SECOND_QUARTILE", "THIRD_QUARTILE", "FOURTH_QUARTILE"];

const num = (n) => n.toLocaleString("en-US");
const plural = (n, word) => `${num(n)} ${word}${n === 1 ? "" : "s"}`;
const prettyDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

async function fetchCalendar() {
  const query = `query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date weekday contributionCount contributionLevel } }
        }
      }
    }
  }`;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      authorization: `bearer ${token}`,
      "content-type": "application/json",
      "user-agent": `${login}-activity-card`,
    },
    body: JSON.stringify({ query, variables: { login } }),
  });
  const body = await res.json();
  if (!res.ok || body.errors || !body.data?.user) {
    throw new Error(`GitHub API ${res.status}: ${JSON.stringify(body.errors ?? body)}`);
  }
  return body.data.user.contributionsCollection.contributionCalendar;
}

function summarise(calendar) {
  const days = calendar.weeks.flatMap((w) => w.contributionDays);
  const counts = days.map((d) => d.contributionCount);

  let longest = 0;
  let run = 0;
  for (const c of counts) {
    run = c > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }

  // Today may simply not have happened yet, so an empty last day doesn't break the streak.
  let i = counts.length - 1;
  if (counts[i] === 0) i--;
  let current = 0;
  while (i >= 0 && counts[i] > 0) {
    current++;
    i--;
  }

  const lastActive = days.findLast((d) => d.contributionCount > 0)?.date ?? null;

  return {
    total: calendar.totalContributions,
    last30: counts.slice(-30).reduce((a, b) => a + b, 0),
    activeDays: counts.filter((c) => c > 0).length,
    current,
    longest,
    lastActive,
    updated: days.at(-1).date,
  };
}

function renderCard(calendar, stats, t) {
  const X = 32;
  const CELL = 11;
  const STEP = 14;
  const GRID_X = X + 30;
  const GRID_Y = 164;

  const tiles = [
    [num(stats.total), "contributions, last 12 months"],
    [num(stats.last30), "contributions, last 30 days"],
    [plural(stats.current, "day"), "current streak"],
    [plural(stats.longest, "day"), "longest streak, last 12 months"],
  ];
  const tileW = (WIDTH - 2 * X) / tiles.length;
  const tileSvg = tiles
    .map(([value, label], i) => {
      const x = X + i * tileW;
      return (
        `<text x="${x}" y="96" font-size="28" font-weight="700" fill="${t.ink}">${value}</text>` +
        `<text x="${x}" y="116" font-size="12.5" fill="${t.secondary}">${label}</text>`
      );
    })
    .join("");

  const cells = calendar.weeks
    .flatMap((week, w) =>
      week.contributionDays.map((d) => {
        const level = Math.max(0, LEVELS.indexOf(d.contributionLevel));
        return `<rect x="${GRID_X + w * STEP}" y="${GRID_Y + d.weekday * STEP}" width="${CELL}" height="${CELL}" rx="2.5" fill="${t.ramp[level]}"/>`;
      }),
    )
    .join("");

  // Label a column when its month changes; drop a label that would crowd the next one.
  const monthStarts = [];
  calendar.weeks.forEach((week, w) => {
    const month = Number(week.contributionDays[0].date.slice(5, 7));
    if (monthStarts.at(-1)?.month !== month) monthStarts.push({ w, month });
  });
  const monthSvg = monthStarts
    .filter((m, i) => (monthStarts[i + 1]?.w ?? Infinity) - m.w >= 3)
    .map((m) => `<text x="${GRID_X + m.w * STEP}" y="${GRID_Y - 8}">${MONTHS[m.month - 1]}</text>`)
    .join("");

  const daySvg = [
    [1, "Mon"],
    [3, "Wed"],
    [5, "Fri"],
  ]
    .map(([row, name]) => `<text x="${X}" y="${GRID_Y + row * STEP + CELL - 2}">${name}</text>`)
    .join("");

  const legendY = GRID_Y + 7 * STEP + 12;
  const legendRight = GRID_X + calendar.weeks.length * STEP - (STEP - CELL);
  const swatchX = legendRight - 34 - t.ramp.length * STEP;
  const legendSvg =
    `<text x="${swatchX - 8}" y="${legendY + CELL - 2}" text-anchor="end">Less</text>` +
    t.ramp
      .map((fill, i) => `<rect x="${swatchX + i * STEP}" y="${legendY}" width="${CELL}" height="${CELL}" rx="2.5" fill="${fill}"/>`)
      .join("") +
    `<text x="${legendRight}" y="${legendY + CELL - 2}" text-anchor="end">More</text>`;

  const body = `<text x="${X}" y="46" font-size="15" font-weight="600" fill="${t.ink}">Contribution activity</text>
<text x="${WIDTH - X}" y="46" font-size="12" text-anchor="end" fill="${t.muted}">Updated ${prettyDate(stats.updated)}</text>
${tileSvg}
<g font-size="11" fill="${t.muted}">${monthSvg}${daySvg}${legendSvg}
<text x="${GRID_X}" y="${legendY + CELL - 2}">Private repositories included</text></g>
${cells}`;

  return frame(legendY + CELL + 28, t, {
    title: `GitHub contribution activity for ${login}`,
    desc:
      `${plural(stats.total, "contribution")} in the last 12 months across ${plural(stats.activeDays, "active day")}. ` +
      `${num(stats.last30)} in the last 30 days. Current streak ${plural(stats.current, "day")}, longest ${plural(stats.longest, "day")}.`,
    body,
  });
}

function renderReadmeBlock(stats) {
  const summary =
    `${plural(stats.total, "contribution")} in the last 12 months across ${plural(stats.activeDays, "active day")}` +
    (stats.lastActive ? `, most recently on ${prettyDate(stats.lastActive)}` : "");
  return [
    START,
    "<picture>",
    '  <source media="(prefers-color-scheme: dark)" srcset="assets/activity-dark.svg">',
    `  <img src="assets/activity-light.svg" width="100%" alt="${summary}.">`,
    "</picture>",
    "",
    `<sub>${summary}. Refreshed twice a day by <a href=".github/workflows/activity.yml">a GitHub Action</a> from my contribution calendar.</sub>`,
    END,
  ].join("\n");
}

async function writeIfChanged(relPath, content) {
  const url = new URL(relPath, root);
  const before = await readFile(url, "utf8").catch(() => null);
  if (before === content) return false;
  await writeFile(url, content);
  return true;
}

const calendar = await fetchCalendar();
const stats = summarise(calendar);

await mkdir(new URL("assets/", root), { recursive: true });
const changed = [];
for (const [name, t] of Object.entries(THEMES)) {
  const file = `assets/activity-${name}.svg`;
  if (await writeIfChanged(file, renderCard(calendar, stats, t))) changed.push(file);
}

const readme = await readFile(new URL("README.md", root), "utf8");
const from = readme.indexOf(START);
const to = readme.indexOf(END);
if (from === -1 || to === -1 || to < from) {
  throw new Error(`README.md needs a ${START} ... ${END} block.`);
}
const nextReadme = readme.slice(0, from) + renderReadmeBlock(stats) + readme.slice(to + END.length);
if (await writeIfChanged("README.md", nextReadme)) changed.push("README.md");

console.log(JSON.stringify({ login, ...stats, changed }, null, 2));
