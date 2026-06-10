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

const HEADER_HINTS = ['rank', 'position', 'pos', 'safle', 'name', 'enw', 'player', 'score', 'sgor', 'points', 'pwynt', 'team', 'tîm', 'tim', 'move', 'movement', 'change'];

function looksLikeHeader(cells: string[]): boolean {
  const joined = cells.join(' ').toLowerCase();
  const hasHint = HEADER_HINTS.some((h) => joined.includes(h));
  const firstIsNumber = /^\d+$/.test((cells[0] ?? '').replace(/[^\d]/g, ''));
  return hasHint && !firstIsNumber;
}

interface ColMap { rank?: number; name?: number; score?: number; team?: number; movement?: number; }

function buildColumnMap(headerCells: string[]): ColMap {
  const map: ColMap = {};
  headerCells.forEach((raw, idx) => {
    const h = raw.toLowerCase().trim();
    if (/(rank|position|pos|safle)/.test(h)) map.rank = idx;
    else if (/(name|enw|player)/.test(h)) map.name = idx;
    else if (/(score|sgor|points|pwynt|pts)/.test(h)) map.score = idx;
    else if (/(team|tîm|tim|company|club)/.test(h)) map.team = idx;
    else if (/(move|change|delta|trend)/.test(h)) map.movement = idx;
  });
  return map;
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
    const rank = cleanInt(cols.rank != null ? cells[cols.rank] : '') ?? autoRank;
    const name = (cols.name != null ? cells[cols.name] : '') || '';
    const score = cleanInt(cols.score != null ? cells[cols.score] : '');
    const team = (cols.team != null ? cells[cols.team] : '') || '';
    const movement = parseMovement(cols.movement != null ? cells[cols.movement] : '');
    if (!name && score == null) continue;
    rows.push({ rank, name: name.trim(), score, team: team.trim(), movement });
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

export const SAMPLE_CSV = `safle,enw,sgor,tîm,symud
1,Aled Parry,985,Tîm Gwynedd,+2
2,Sioned Jones,942,Tîm Caerdydd,-1
3,Rhys Williams,910,Tîm Abertawe,0
4,Megan Hughes,888,Tîm Gwynedd,+1
5,Dafydd Evans,861,Tîm Wrecsam,+3
6,Catrin Pugh,840,Tîm Caerdydd,-2
7,Iwan Davies,815,Tîm Bangor,0
8,Lowri Morgan,792,Tîm Abertawe,+4
9,Geraint Lloyd,770,Tîm Wrecsam,-1
10,Elin Roberts,748,Tîm Bangor,+1`;
