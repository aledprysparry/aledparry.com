// Leaderboard parsing + validation.
// Paste (comma OR tab), CSV upload, and XLSX upload (via the `xlsx`
// dep that cwis-creator-hub already ships). Tokeniser is the same
// quote-aware loop used across the hub's importers.

import * as XLSX from 'xlsx';
import type { LeaderboardRow, Movement } from './types';

function splitCells(line: string): string[] {
  const out: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cell += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',' || ch === '\t') { out.push(cell); cell = ''; }
      else cell += ch;
    }
  }
  out.push(cell);
  return out.map((c) => c.trim());
}

const HEADER_HINTS = ['rank', 'position', 'pos', 'safle', 'name', 'enw', 'player', 'username', 'user', 'score', 'sgor', 'points', 'pwynt', 'team', 'tîm', 'tim', 'location', 'lleoliad', 'postcode', 'côd post', 'cod post', 'ardal', 'area', 'move', 'movement', 'change'];

function looksLikeHeader(cells: string[]): boolean {
  const joined = cells.join(' ').toLowerCase();
  const hasHint = HEADER_HINTS.some((h) => joined.includes(h));
  const firstIsNumber = /^\d+$/.test((cells[0] ?? '').replace(/[^\d]/g, ''));
  return hasHint && !firstIsNumber;
}

interface ColMap { rank?: number; name?: number; score?: number; team?: number; location?: number; movement?: number; }

function buildColumnMap(headerCells: string[]): ColMap {
  const map: ColMap = {};
  headerCells.forEach((raw, idx) => {
    const h = raw.toLowerCase().trim();
    if (/(rank|position|pos|safle)/.test(h)) map.rank = idx;
    else if (/(name|enw|player|user)/.test(h)) map.name = idx;
    else if (/(score|sgor|points|pwynt|pts)/.test(h)) map.score = idx;
    else if (/(location|lleoliad|postcode|côd|cod|ardal|area)/.test(h)) map.location = idx;
    else if (/(team|tîm|tim|company|club)/.test(h)) map.team = idx;
    else if (/(move|change|delta|trend)/.test(h)) map.movement = idx;
  });
  return map;
}

// Freeform "list" paste: `1: Dylan Llyr (LL55) 529.99` / `1. Name 500` /
// `1 Name (CF5) 512` - rank, then name, optional (location), score at end.
function parseFreeformLine(line: string): { rank: number | null; name: string; location: string; score: number | null } | null {
  const m = line.match(/^\s*(\d+)\s*[:.)\-]?\s+(.*\S)\s+([£$]?[\d][\d.,]*)\s*$/);
  if (!m) return null;
  const rank = parseInt(m[1], 10);
  let rest = m[2].trim();
  let location = '';
  const locM = rest.match(/\(([^)]*)\)\s*$/);
  if (locM) { location = locM[1].trim(); rest = rest.slice(0, rest.length - locM[0].length).trim(); }
  return { rank: Number.isFinite(rank) ? rank : null, name: rest, location, score: cleanNum(m[3]) };
}

function parseMovement(raw: string | undefined): Movement | null {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim().toLowerCase();
  if (s === '0' || s === '-' || s === '=') return { dir: 0, value: 0 };
  const num = parseInt(s.replace(/[^\d]/g, ''), 10);
  const value = Number.isFinite(num) ? num : 0;
  if (/^[+]|up|▲|↑/.test(s)) return { dir: 1, value };
  if (/^-|down|▼|↓/.test(s)) return { dir: -1, value };
  if (value === 0) return { dir: 0, value: 0 };
  return { dir: 1, value };
}

function cleanInt(raw: string | undefined): number | null {
  if (raw == null) return null;
  const n = parseInt(String(raw).replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

// Scores may be decimals (e.g. 61.33) - keep the point.
function cleanNum(raw: string | undefined): number | null {
  if (raw == null) return null;
  const n = parseFloat(String(raw).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

export interface ParseResult {
  rows: LeaderboardRow[];
  warnings: string[];
  error: string | null;
}

export function parseLeaderboardText(text: string): ParseResult {
  const warnings: string[] = [];
  if (!text || !text.trim()) {
    return { rows: [], warnings: [], error: 'No data - paste a leaderboard or upload a file.' };
  }
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { rows: [], warnings: [], error: 'No rows found.' };

  let cols: ColMap = {};
  let startIdx = 0;
  const firstCells = splitCells(lines[0]);
  if (looksLikeHeader(firstCells)) {
    cols = buildColumnMap(firstCells);
    startIdx = 1;
  }
  if (cols.name == null || cols.score == null) {
    cols = { rank: 0, name: 1, score: 2, team: 3, movement: 4 };
    if (startIdx === 1 && /^\d+$/.test((firstCells[0] ?? '').replace(/[^\d]/g, ''))) startIdx = 0;
  }

  const rows: LeaderboardRow[] = [];
  let autoRank = 0;
  for (let i = startIdx; i < lines.length; i++) {
    const cells = splitCells(lines[i]);
    autoRank++;

    // No delimiters on this line - try the freeform "1: Name (LOC) score" shape.
    if (cells.length <= 1) {
      const ff = parseFreeformLine(lines[i]);
      if (ff && (ff.name || ff.score != null)) {
        rows.push({ rank: ff.rank ?? autoRank, name: ff.name.trim(), score: ff.score, team: '', location: ff.location.trim(), movement: null });
        continue;
      }
    }

    const rank = cleanInt(cols.rank != null ? cells[cols.rank] : '') ?? autoRank;
    const name = (cols.name != null ? cells[cols.name] : '') || '';
    const score = cleanNum(cols.score != null ? cells[cols.score] : '');
    const team = (cols.team != null ? cells[cols.team] : '') || '';
    const location = (cols.location != null ? cells[cols.location] : '') || '';
    const movement = parseMovement(cols.movement != null ? cells[cols.movement] : '');
    if (!name && score == null) continue;
    rows.push({ rank, name: name.trim(), score, team: team.trim(), location: location.trim(), movement });
  }

  if (rows.length === 0) {
    return { rows: [], warnings: [], error: "Couldn't read any rows. Expected: rank, name, score." };
  }

  const missingName = rows.filter((r) => !r.name).length;
  const missingScore = rows.filter((r) => r.score == null).length;
  if (missingName) warnings.push(`${missingName} row(s) missing a name.`);
  if (missingScore) warnings.push(`${missingScore} row(s) missing a score.`);
  if (rows.length < 10) warnings.push(`Only ${rows.length} of 10 places filled.`);
  if (rows.length > 10) warnings.push(`${rows.length} rows pasted - only the top 10 are used.`);

  rows.sort((a, b) => (a.rank || 999) - (b.rank || 999));
  rows.forEach((r, i) => { if (!r.rank || Number.isNaN(r.rank)) r.rank = i + 1; });
  return { rows: rows.slice(0, 10), warnings, error: null };
}

// CSV/TXT → text passthrough; XLSX/XLS → first sheet to CSV text. The
// returned text flows into the same textarea + parse path, so a
// spreadsheet upload is visible and editable like a paste.
export async function fileToText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_csv(sheet);
  }
  return file.text();
}

export function rowsInRange(rows: LeaderboardRow[], range?: [number, number]): LeaderboardRow[] {
  if (!range) return rows;
  const [from, to] = range;
  return rows.filter((r) => r.rank >= from && r.rank <= to);
}

// Real Cwis Bob Dydd shape: position, username (location/postcode), score.
// Paste this freeform list straight in, or use CSV with a location column.
export const SAMPLE_CSV = `1: Dylan Llyr (LL55) 529.99
2: GaryP (LL58) 523.50
3: EleanorT (BS9) 522.99
4: iolo77 (CF5) 512.94
5: HuwT (LL77) 501.08
6: melfync (LL30) 488.88
7: EmyrE (LL61) 476.18
8: Siwan Mair (LL54) 471.31
9: Guto E (SA41) 467.02
10: Gwilym Dwyfor (LL54) 466.99`;
