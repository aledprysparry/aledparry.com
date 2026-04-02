"use client";

import { useRef, useEffect, useState, useCallback } from "react";

// ── Tetromino definitions (4 rotation states each) ──────────────────────────
// Each shape is a list of [row, col] offsets from the piece origin
const TETROMINOES: [number, number][][][] = [
  // I
  [
    [[0,0],[0,1],[0,2],[0,3]],
    [[0,0],[1,0],[2,0],[3,0]],
    [[0,0],[0,1],[0,2],[0,3]],
    [[0,0],[1,0],[2,0],[3,0]],
  ],
  // O
  [
    [[0,0],[0,1],[1,0],[1,1]],
    [[0,0],[0,1],[1,0],[1,1]],
    [[0,0],[0,1],[1,0],[1,1]],
    [[0,0],[0,1],[1,0],[1,1]],
  ],
  // T
  [
    [[0,0],[0,1],[0,2],[1,1]],
    [[0,0],[1,0],[2,0],[1,1]],
    [[1,0],[1,1],[1,2],[0,1]],
    [[0,0],[1,0],[2,0],[1,-1]],
  ],
  // S
  [
    [[0,1],[0,2],[1,0],[1,1]],
    [[0,0],[1,0],[1,1],[2,1]],
    [[0,1],[0,2],[1,0],[1,1]],
    [[0,0],[1,0],[1,1],[2,1]],
  ],
  // Z
  [
    [[0,0],[0,1],[1,1],[1,2]],
    [[0,1],[1,0],[1,1],[2,0]],
    [[0,0],[0,1],[1,1],[1,2]],
    [[0,1],[1,0],[1,1],[2,0]],
  ],
  // J
  [
    [[0,0],[1,0],[1,1],[1,2]],
    [[0,0],[0,1],[1,0],[2,0]],
    [[0,0],[0,1],[0,2],[1,2]],
    [[0,0],[1,0],[2,0],[2,-1]],
  ],
  // L
  [
    [[0,2],[1,0],[1,1],[1,2]],
    [[0,0],[1,0],[2,0],[2,1]],
    [[0,0],[0,1],[0,2],[1,0]],
    [[0,0],[0,1],[1,1],[2,1]],
  ],
];

// Piece opacities — subtle variation, lower overall for background feel
const PIECE_ALPHA = [0.10, 0.13, 0.11, 0.09, 0.14, 0.08, 0.07];
const PIECE_ACTIVE_BOOST = 0.04;
const GHOST_ALPHA = 0.03;
// Warm stone tone (avoids cool/blue cast at low opacity on cream bg)
const STONE = "120, 113, 108";

const COLS = 10;
const ROWS = 20;

// NES-style scoring multipliers
const LINE_SCORES = [0, 40, 100, 300, 1200];

interface Piece {
  type: number;
  rotation: number;
  x: number;
  y: number;
}

interface GameState {
  board: number[][];
  current: Piece;
  next: number;
  bag: number[];
  score: number;
  level: number;
  lines: number;
  dropTimer: number;
  running: boolean;
  gameOver: boolean;
  gameOverTimer: number;
  clearRows: number[];
  clearTimer: number;
  lastKeyTime: number;
  // DAS state
  dasKey: string;
  dasTimer: number;
  dasInterval: number;
  // AI state
  aiTarget: { rotation: number; x: number } | null;
  aiMoveTimer: number;
}

function createBoard(): number[][] {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function shuffleBag(): number[] {
  const bag = [0, 1, 2, 3, 4, 5, 6];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

function drawFromBag(bag: number[]): [number, number[]] {
  if (bag.length === 0) bag = shuffleBag();
  const piece = bag.pop()!;
  return [piece, bag];
}

function getCells(type: number, rotation: number, x: number, y: number): [number, number][] {
  return TETROMINOES[type][rotation].map(([r, c]) => [y + r, x + c]);
}

function collides(board: number[][], type: number, rotation: number, x: number, y: number): boolean {
  const cells = getCells(type, rotation, x, y);
  for (const [r, c] of cells) {
    if (c < 0 || c >= COLS || r >= ROWS) return true;
    if (r >= 0 && board[r][c] !== 0) return true;
  }
  return false;
}

function tryRotate(board: number[][], piece: Piece): Piece | null {
  const newRot = (piece.rotation + 1) % 4;
  // Try basic rotation, then wall kicks
  const kicks = piece.type === 0 ? [0, -1, 1, -2, 2] : [0, -1, 1];
  for (const dx of kicks) {
    if (!collides(board, piece.type, newRot, piece.x + dx, piece.y)) {
      return { ...piece, rotation: newRot, x: piece.x + dx };
    }
  }
  return null;
}

function getGhostY(board: number[][], piece: Piece): number {
  let y = piece.y;
  while (!collides(board, piece.type, piece.rotation, piece.x, y + 1)) {
    y++;
  }
  return y;
}

function getDropInterval(level: number): number {
  return Math.max(2, 48 - (level - 1) * 3);
}

// ── Simple AI for auto-play ─────────────────────────────────────────────────
function evaluatePosition(board: number[][], type: number, rotation: number, x: number): number {
  // Drop piece to bottom
  let y = 0;
  while (!collides(board, type, rotation, x, y + 1)) y++;
  if (collides(board, type, rotation, x, y)) return -Infinity;

  // Simulate placing the piece
  const testBoard = board.map((r) => [...r]);
  const cells = getCells(type, rotation, x, y);
  for (const [r, c] of cells) {
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) testBoard[r][c] = type + 1;
  }

  // Count completed lines
  let linesCleared = 0;
  for (let r = 0; r < ROWS; r++) {
    if (testBoard[r].every((c) => c !== 0)) linesCleared++;
  }

  // Calculate aggregate height and holes
  let aggregateHeight = 0;
  let holes = 0;
  let bumpiness = 0;
  const colHeights: number[] = [];

  for (let c = 0; c < COLS; c++) {
    let h = 0;
    for (let r = 0; r < ROWS; r++) {
      if (testBoard[r][c] !== 0) {
        h = ROWS - r;
        break;
      }
    }
    colHeights.push(h);
    aggregateHeight += h;

    // Count holes in this column
    let foundBlock = false;
    for (let r = 0; r < ROWS; r++) {
      if (testBoard[r][c] !== 0) foundBlock = true;
      else if (foundBlock) holes++;
    }
  }

  for (let c = 0; c < COLS - 1; c++) {
    bumpiness += Math.abs(colHeights[c] - colHeights[c + 1]);
  }

  return linesCleared * 100 - aggregateHeight * 0.5 - holes * 3 - bumpiness * 0.2;
}

function findBestMove(board: number[][], type: number): { rotation: number; x: number } {
  let bestScore = -Infinity;
  let bestMove = { rotation: 0, x: 3 };

  for (let rot = 0; rot < 4; rot++) {
    for (let x = -2; x < COLS + 2; x++) {
      // Check if this position is reachable
      if (collides(board, type, rot, x, 0) && collides(board, type, rot, x, 1)) continue;
      const score = evaluatePosition(board, type, rot, x);
      if (score > bestScore) {
        bestScore = score;
        bestMove = { rotation: rot, x };
      }
    }
  }

  return bestMove;
}

// ── Component ───────────────────────────────────────────────────────────────
export function TetrisBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const gameRef = useRef<GameState | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("tetris_best");
    if (stored) setBestScore(parseInt(stored, 10));
  }, []);

  const updateBest = useCallback(
    (newScore: number) => {
      if (newScore > bestScore) {
        setBestScore(newScore);
        localStorage.setItem("tetris_best", String(newScore));
      }
    },
    [bestScore]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ── Init game state ───────────────────────────────────────────────
    let bag = shuffleBag();
    let firstType: number;
    [firstType, bag] = drawFromBag(bag);
    let nextType: number;
    [nextType, bag] = drawFromBag(bag);

    const g: GameState = {
      board: createBoard(),
      current: { type: firstType, rotation: 0, x: 3, y: 0 },
      next: nextType,
      bag,
      score: 0,
      level: 1,
      lines: 0,
      dropTimer: 0,
      running: true,
      gameOver: false,
      gameOverTimer: 0,
      clearRows: [],
      clearTimer: 0,
      lastKeyTime: 0,
      dasKey: "",
      dasTimer: 0,
      dasInterval: 0,
      aiTarget: null,
      aiMoveTimer: 0,
    };
    gameRef.current = g;

    // ── Canvas sizing ─────────────────────────────────────────────────
    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // ── Spawn a new piece ─────────────────────────────────────────────
    function spawnPiece() {
      const type = g.next;
      let nextT: number;
      [nextT, g.bag] = drawFromBag(g.bag);
      g.next = nextT;
      g.current = { type, rotation: 0, x: 3, y: 0 };
      g.aiTarget = null;

      if (collides(g.board, type, 0, 3, 0)) {
        g.gameOver = true;
        g.gameOverTimer = 0;
        updateBest(g.score);
        setGameOver(true);
      }
    }

    // ── Lock piece and check lines ────────────────────────────────────
    function lockPiece() {
      const cells = getCells(g.current.type, g.current.rotation, g.current.x, g.current.y);
      for (const [r, c] of cells) {
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
          g.board[r][c] = g.current.type + 1;
        }
      }

      // Check for completed lines
      const fullRows: number[] = [];
      for (let r = 0; r < ROWS; r++) {
        if (g.board[r].every((c) => c !== 0)) fullRows.push(r);
      }

      if (fullRows.length > 0) {
        g.clearRows = fullRows;
        g.clearTimer = 12;

        // Update score
        const pts = LINE_SCORES[fullRows.length] * (g.level + 1);
        g.score += pts;
        g.lines += fullRows.length;
        const newLevel = Math.min(15, Math.floor(g.lines / 10) + 1);
        if (newLevel > g.level) g.level = newLevel;

        setScore(g.score);
        setLevel(g.level);
        updateBest(g.score);
      } else {
        spawnPiece();
      }
    }

    // ── Clear animation complete ──────────────────────────────────────
    function finishClear() {
      // Remove cleared rows top-down
      for (const row of g.clearRows.sort((a, b) => a - b)) {
        g.board.splice(row, 1);
        g.board.unshift(new Array(COLS).fill(0));
      }
      g.clearRows = [];
      g.clearTimer = 0;
      spawnPiece();
    }

    // ── Move piece ────────────────────────────────────────────────────
    function movePiece(dx: number, dy: number): boolean {
      if (!collides(g.board, g.current.type, g.current.rotation, g.current.x + dx, g.current.y + dy)) {
        g.current.x += dx;
        g.current.y += dy;
        return true;
      }
      return false;
    }

    function hardDrop() {
      let dropped = 0;
      while (!collides(g.board, g.current.type, g.current.rotation, g.current.x, g.current.y + 1)) {
        g.current.y++;
        dropped++;
      }
      g.score += dropped * 2;
      setScore(g.score);
      lockPiece();
      g.dropTimer = 0;
    }

    // ── Restart ───────────────────────────────────────────────────────
    function restart() {
      g.board = createBoard();
      g.bag = shuffleBag();
      let t: number;
      [t, g.bag] = drawFromBag(g.bag);
      let nt: number;
      [nt, g.bag] = drawFromBag(g.bag);
      g.current = { type: t, rotation: 0, x: 3, y: 0 };
      g.next = nt;
      g.score = 0;
      g.level = 1;
      g.lines = 0;
      g.dropTimer = 0;
      g.gameOver = false;
      g.gameOverTimer = 0;
      g.clearRows = [];
      g.clearTimer = 0;
      g.aiTarget = null;
      g.aiMoveTimer = 0;
      setScore(0);
      setLevel(1);
      setGameOver(false);
    }

    // ── Keyboard ──────────────────────────────────────────────────────
    function onKeyDown(e: KeyboardEvent) {
      if (g.gameOver) {
        if (e.code === "Space") {
          e.preventDefault();
          restart();
        }
        return;
      }
      if (g.clearTimer > 0) return;

      const gameKeys = ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "Space"];
      if (!gameKeys.includes(e.code)) return;
      e.preventDefault();
      g.lastKeyTime = Date.now();

      switch (e.code) {
        case "ArrowLeft":
          movePiece(-1, 0);
          if (g.dasKey !== "ArrowLeft") {
            g.dasKey = "ArrowLeft";
            g.dasTimer = 10; // ~170ms at 60fps
            g.dasInterval = 0;
          }
          break;
        case "ArrowRight":
          movePiece(1, 0);
          if (g.dasKey !== "ArrowRight") {
            g.dasKey = "ArrowRight";
            g.dasTimer = 10;
            g.dasInterval = 0;
          }
          break;
        case "ArrowDown":
          if (movePiece(0, 1)) {
            g.score += 1;
            setScore(g.score);
          }
          g.dropTimer = 0;
          break;
        case "ArrowUp": {
          const rotated = tryRotate(g.board, g.current);
          if (rotated) g.current = rotated;
          break;
        }
        case "Space":
          hardDrop();
          break;
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      if (e.code === g.dasKey) {
        g.dasKey = "";
        g.dasTimer = 0;
        g.dasInterval = 0;
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    // ── Game loop ─────────────────────────────────────────────────────
    let animId: number;

    function update() {
      if (g.gameOver) {
        g.gameOverTimer = Math.min(g.gameOverTimer + 1, 30);
        // Auto-restart in AI mode after showing game over briefly
        const isAI = Date.now() - g.lastKeyTime > 3000;
        if (isAI && g.gameOverTimer >= 30) {
          restart();
        }
        return;
      }

      // Line clear animation
      if (g.clearTimer > 0) {
        g.clearTimer--;
        if (g.clearTimer === 0) finishClear();
        return;
      }

      // AI auto-play when idle for 3 seconds
      const isAI = Date.now() - g.lastKeyTime > 3000;
      if (isAI) {
        if (!g.aiTarget) {
          g.aiTarget = findBestMove(g.board, g.current.type);
          g.aiMoveTimer = 0;
        }

        g.aiMoveTimer++;
        if (g.aiMoveTimer % 3 === 0) {
          // Rotate toward target
          if (g.current.rotation !== g.aiTarget.rotation) {
            const rotated = tryRotate(g.board, g.current);
            if (rotated) g.current = rotated;
          } else if (g.current.x < g.aiTarget.x) {
            movePiece(1, 0);
          } else if (g.current.x > g.aiTarget.x) {
            movePiece(-1, 0);
          } else {
            // Positioned correctly — hard drop
            hardDrop();
          }
        }
      }

      // DAS (Delayed Auto Shift) for held keys
      if (g.dasKey && !isAI) {
        if (g.dasTimer > 0) {
          g.dasTimer--;
        } else {
          g.dasInterval++;
          if (g.dasInterval % 3 === 0) {
            const dx = g.dasKey === "ArrowLeft" ? -1 : 1;
            movePiece(dx, 0);
          }
        }
      }

      // Gravity
      g.dropTimer++;
      const interval = getDropInterval(g.level);
      if (g.dropTimer >= interval) {
        g.dropTimer = 0;
        if (!movePiece(0, 1)) {
          lockPiece();
        }
      }
    }

    function render() {
      if (!ctx || !canvas) return;
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // ── Grid sizing ───────────────────────────────────────────────
      const cellSize = Math.floor(W / COLS);
      const gridW = cellSize * COLS;
      const gridH = cellSize * ROWS;
      const gridX = Math.floor((W - gridW) / 2);
      const gridY = H - gridH; // anchor to bottom — pieces emerge from above

      // ── Giant background score ────────────────────────────────────
      ctx.save();
      ctx.font = `bold ${Math.min(W * 0.5, 400)}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = `rgba(${STONE}, 0.035)`;
      ctx.fillText(String(g.score), W / 2, H / 2);
      ctx.restore();

      // No grid border or grid lines — clean abstract look

      // ── Helper: draw rounded rect (gaps & radius scale with cell size) ──
      const gap = Math.max(2, Math.floor(cellSize * 0.04));
      const rad = Math.max(4, Math.floor(cellSize * 0.08));
      function drawCell(x: number, y: number, size: number, alpha: number) {
        ctx.fillStyle = `rgba(${STONE}, ${alpha})`;
        ctx.beginPath();
        const s = size - gap * 2;
        const cx = x + gap;
        const cy = y + gap;
        ctx.moveTo(cx + rad, cy);
        ctx.arcTo(cx + s, cy, cx + s, cy + s, rad);
        ctx.arcTo(cx + s, cy + s, cx, cy + s, rad);
        ctx.arcTo(cx, cy + s, cx, cy, rad);
        ctx.arcTo(cx, cy, cx + s, cy, rad);
        ctx.fill();
      }

      // ── Draw locked board cells ───────────────────────────────────
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const val = g.board[r][c];
          if (val === 0) continue;

          const isClearRow = g.clearRows.includes(r);
          const alpha = isClearRow
            ? 0.08 + Math.sin(g.clearTimer * 0.8) * 0.06
            : PIECE_ALPHA[val - 1];

          drawCell(gridX + c * cellSize, gridY + r * cellSize, cellSize, alpha);
        }
      }

      // ── Ghost piece (very subtle fill, no outline) ────────────────
      if (!g.gameOver && g.clearTimer === 0) {
        const ghostY = getGhostY(g.board, g.current);
        if (ghostY !== g.current.y) {
          const ghostCells = getCells(g.current.type, g.current.rotation, g.current.x, ghostY);
          for (const [r, c] of ghostCells) {
            if (r < 0) continue;
            drawCell(gridX + c * cellSize, gridY + r * cellSize, cellSize, 0.04);
          }
        }

        // ── Current piece ─────────────────────────────────────────────
        const currentCells = getCells(g.current.type, g.current.rotation, g.current.x, g.current.y);
        const activeAlpha = PIECE_ALPHA[g.current.type] + PIECE_ACTIVE_BOOST;
        for (const [r, c] of currentCells) {
          if (r < 0) continue;
          drawCell(gridX + c * cellSize, gridY + r * cellSize, cellSize, activeAlpha);
        }
      }

      // ── Next piece preview (floating inside top-right of grid) ──
      const previewCellSize = Math.floor(cellSize * 0.4);
      const previewX = W - previewCellSize * 5;
      const previewY = Math.max(32, gridY + cellSize);

      const nextCells = TETROMINOES[g.next][0];
      for (const [r, c] of nextCells) {
        drawCell(previewX + c * previewCellSize, previewY + r * previewCellSize, previewCellSize, PIECE_ALPHA[g.next] * 0.6);
      }

      // ── Game over overlay ─────────────────────────────────────────
      if (g.gameOver) {
        const fadeAlpha = Math.min(1, g.gameOverTimer / 30);

        // Gentle fade over visible area
        ctx.fillStyle = `rgba(250, 250, 249, ${0.6 * fadeAlpha})`;
        ctx.fillRect(0, 0, W, H);

        ctx.save();
        ctx.font = `300 24px Inter, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.letterSpacing = "0.15em";
        ctx.fillStyle = `rgba(${STONE}, ${0.25 * fadeAlpha})`;
        ctx.fillText("GAME OVER", W / 2, H / 2 - 10);

        ctx.font = `400 11px Inter, system-ui, sans-serif`;
        ctx.fillStyle = `rgba(${STONE}, ${0.15 * fadeAlpha})`;
        ctx.fillText("SPACE to restart", W / 2, H / 2 + 16);
        ctx.restore();
      }
    }

    function loop() {
      update();
      render();
      if (g.running) {
        animId = requestAnimationFrame(loop);
      }
    }

    animId = requestAnimationFrame(loop);

    return () => {
      g.running = false;
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [updateBest]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0"
      />
      {/* Best score indicator */}
      <div className="fixed bottom-4 right-4 z-10 text-xs font-sans text-stone-400 select-none">
        {bestScore > 0 && `★ ${bestScore}`}
      </div>
    </>
  );
}
