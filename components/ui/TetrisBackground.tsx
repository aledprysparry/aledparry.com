"use client";

import { useRef, useEffect, useState, useCallback } from "react";

// ── Tetromino definitions (4 rotation states each) ──────────────────────────
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

// Piece opacities — visible enough to play, subtle enough for background
const PIECE_ALPHA = [0.14, 0.17, 0.15, 0.13, 0.18, 0.12, 0.11];
const PIECE_ACTIVE_BOOST = 0.06;
// Warm stone tone
const STONE = "120, 113, 108";

const COLS = 10;
const ROWS = 20;
const LINE_SCORES = [0, 40, 100, 300, 1200];

interface Piece { type: number; rotation: number; x: number; y: number; }
interface ScorePopup { text: string; timer: number; x: number; y: number; }

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
  targetCol: number;
  popup: ScorePopup | null;
  pressing: boolean;
  // Cached grid dimensions (updated in render, used in input handlers)
  gridX: number;
  gridCellSize: number;
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
  return [bag.pop()!, bag];
}

function getCells(type: number, rotation: number, x: number, y: number): [number, number][] {
  return TETROMINOES[type][rotation].map(([r, c]) => [y + r, x + c]);
}

function collides(board: number[][], type: number, rotation: number, x: number, y: number): boolean {
  for (const [r, c] of getCells(type, rotation, x, y)) {
    if (c < 0 || c >= COLS || r >= ROWS) return true;
    if (r >= 0 && board[r][c] !== 0) return true;
  }
  return false;
}

function tryRotate(board: number[][], piece: Piece): Piece | null {
  const newRot = (piece.rotation + 1) % 4;
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
  while (!collides(board, piece.type, piece.rotation, piece.x, y + 1)) y++;
  return y;
}

function getDropInterval(level: number): number {
  return Math.max(3, 45 - (level - 1) * 4);
}

// ── Component ───────────────────────────────────────────────────────────────
export function TetrisBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, setScoreState] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [, setGameOverState] = useState(false);
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
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx: CanvasRenderingContext2D = maybeCtx;

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
      targetCol: 3,
      popup: null,
      pressing: false,
      gridX: 0,
      gridCellSize: 40,
    };
    gameRef.current = g;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // ── Game helpers ──────────────────────────────────────────────────
    function spawnPiece() {
      const type = g.next;
      let nextT: number;
      [nextT, g.bag] = drawFromBag(g.bag);
      g.next = nextT;
      g.current = { type, rotation: 0, x: 3, y: 0 };
      if (collides(g.board, type, 0, 3, 0)) {
        g.gameOver = true;
        g.gameOverTimer = 0;
        updateBest(g.score);
        setGameOverState(true);
      }
    }

    function lockPiece() {
      const cells = getCells(g.current.type, g.current.rotation, g.current.x, g.current.y);
      for (const [r, c] of cells) {
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) g.board[r][c] = g.current.type + 1;
      }

      const fullRows: number[] = [];
      for (let r = 0; r < ROWS; r++) {
        if (g.board[r].every((v) => v !== 0)) fullRows.push(r);
      }

      if (fullRows.length > 0) {
        g.clearRows = fullRows;
        g.clearTimer = 14;
        const pts = LINE_SCORES[fullRows.length] * (g.level + 1);
        g.score += pts;
        g.lines += fullRows.length;
        g.level = Math.min(15, Math.floor(g.lines / 10) + 1);

        // Score popup at the cleared area
        const midRow = fullRows[Math.floor(fullRows.length / 2)];
        g.popup = { text: `+${pts}`, timer: 40, x: g.current.x, y: midRow };

        setScoreState(g.score);
        updateBest(g.score);
      } else {
        spawnPiece();
      }
    }

    function finishClear() {
      // Remove from bottom to top so splice indices stay valid
      const sorted = g.clearRows.sort((a, b) => b - a);
      for (const row of sorted) {
        g.board.splice(row, 1);
      }
      // Add empty rows at top to replace removed ones
      for (let i = 0; i < sorted.length; i++) {
        g.board.unshift(new Array(COLS).fill(0));
      }
      g.clearRows = [];
      g.clearTimer = 0;
      spawnPiece();
    }

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
      setScoreState(g.score);
      lockPiece();
      g.dropTimer = 0;
    }

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
      g.popup = null;
      setScoreState(0);
      setGameOverState(false);
    }

    // ── Input: column from screen X ──────────────────────────────────
    function getColFromX(clientX: number) {
      return Math.max(0, Math.min(COLS - 1, Math.floor((clientX - g.gridX) / g.gridCellSize)));
    }

    // Mouse
    function onMouseMove(e: MouseEvent) {
      if (g.gameOver || g.clearTimer > 0) return;
      g.targetCol = getColFromX(e.clientX);
    }
    let lastClickTime = 0;
    function onClick() {
      if (g.gameOver) { restart(); return; }
      if (g.clearTimer > 0) return;
      const now = Date.now();
      if (now - lastClickTime < 300) {
        hardDrop();
        lastClickTime = 0;
      } else {
        lastClickTime = now;
        const rotated = tryRotate(g.board, g.current);
        if (rotated) g.current = rotated;
      }
    }

    // Touch
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    function onTouchStart(e: TouchEvent) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      if (!g.gameOver && g.clearTimer === 0) g.targetCol = getColFromX(e.touches[0].clientX);
    }
    function onTouchMove(e: TouchEvent) {
      if (g.gameOver || g.clearTimer > 0 || e.touches.length === 0) return;
      g.targetCol = getColFromX(e.touches[0].clientX);
    }
    function onTouchEnd(e: TouchEvent) {
      if (g.gameOver) { restart(); return; }
      const dx = Math.abs(e.changedTouches[0].clientX - touchStartX);
      const dy = e.changedTouches[0].clientY - touchStartY;
      const elapsed = Date.now() - touchStartTime;
      if (dy > 60 && Math.abs(dy) > dx * 2) {
        hardDrop();
      } else if (dx < 15 && Math.abs(dy) < 15 && elapsed < 300) {
        const rotated = tryRotate(g.board, g.current);
        if (rotated) g.current = rotated;
      }
    }

    // Keyboard
    function onKeyDown(e: KeyboardEvent) {
      if (g.gameOver) {
        if (e.code === "Space") { e.preventDefault(); restart(); }
        return;
      }
      if (g.clearTimer > 0) return;
      const gameKeys = ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "Space"];
      if (!gameKeys.includes(e.code)) return;
      e.preventDefault();
      switch (e.code) {
        case "ArrowLeft": movePiece(-1, 0); break;
        case "ArrowRight": movePiece(1, 0); break;
        case "ArrowDown":
          if (movePiece(0, 1)) { g.score += 1; setScoreState(g.score); }
          g.dropTimer = 0;
          break;
        case "ArrowUp": {
          const rotated = tryRotate(g.board, g.current);
          if (rotated) g.current = rotated;
          break;
        }
        case "Space": hardDrop(); break;
      }
    }

    // Mouse/touch hold = soft drop (pieces fall faster)
    function onMouseDown() { g.pressing = true; }
    function onMouseUp() { g.pressing = false; }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("click", onClick);
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("keydown", onKeyDown);

    // ── Game loop ────────────────────────────────────────────────────
    let animId: number;

    function update() {
      if (g.gameOver) {
        g.gameOverTimer = Math.min(g.gameOverTimer + 1, 30);
        return;
      }
      if (g.clearTimer > 0) {
        g.clearTimer--;
        if (g.clearTimer === 0) finishClear();
        return;
      }

      // Popup fade
      if (g.popup) {
        g.popup.timer--;
        if (g.popup.timer <= 0) g.popup = null;
      }

      // Snap piece to target column instantly
      while (g.current.x < g.targetCol && movePiece(1, 0)) { /* keep going */ }
      while (g.current.x > g.targetCol && movePiece(-1, 0)) { /* keep going */ }

      // Gravity — pressing (mousedown/hold) makes pieces fall 6x faster
      g.dropTimer++;
      const interval = g.pressing ? Math.max(1, Math.floor(getDropInterval(g.level) / 6)) : getDropInterval(g.level);
      if (g.dropTimer >= interval) {
        g.dropTimer = 0;
        if (g.pressing) { g.score += 1; setScoreState(g.score); }
        if (!movePiece(0, 1)) lockPiece();
      }
    }

    function render() {
      if (!ctx || !canvas) return;
      const dc = ctx;
      const W = canvas.width;
      const H = canvas.height;

      dc.clearRect(0, 0, W, H);

      // ── Grid sizing: fit viewport height, cap at viewport width ───
      const cellSize = Math.floor(Math.min(H * 0.9 / ROWS, W / COLS));
      const gridW = cellSize * COLS;
      const gridH = cellSize * ROWS;
      const gridX = Math.floor((W - gridW) / 2);
      const gridY = H - gridH;

      // Cache for input handlers
      g.gridX = gridX;
      g.gridCellSize = cellSize;

      // ── Giant background score ────────────────────────────────────
      dc.save();
      const digits = String(g.score).length;
      const scoreSize = Math.min(W * 0.8 / (digits * 0.6), H * 0.35, 360);
      dc.font = `bold ${scoreSize}px Inter, system-ui, sans-serif`;
      dc.textAlign = "center";
      dc.textBaseline = "middle";
      dc.fillStyle = `rgba(${STONE}, 0.035)`;
      dc.fillText(String(g.score), W / 2, H / 2);
      dc.restore();

      // ── Helper: draw rounded rect ─────────────────────────────────
      const gap = Math.max(2, Math.floor(cellSize * 0.05));
      const rad = Math.max(3, Math.floor(cellSize * 0.12));
      function drawCell(x: number, y: number, size: number, alpha: number) {
        dc.fillStyle = `rgba(${STONE}, ${alpha})`;
        dc.beginPath();
        const s = size - gap * 2;
        const cx = x + gap;
        const cy = y + gap;
        dc.moveTo(cx + rad, cy);
        dc.arcTo(cx + s, cy, cx + s, cy + s, rad);
        dc.arcTo(cx + s, cy + s, cx, cy + s, rad);
        dc.arcTo(cx, cy + s, cx, cy, rad);
        dc.arcTo(cx, cy, cx + s, cy, rad);
        dc.fill();
      }

      // ── Locked board cells ────────────────────────────────────────
      for (let r = 0; r < ROWS; r++) {
        for (let col = 0; col < COLS; col++) {
          const val = g.board[r][col];
          if (val === 0) continue;
          const isClear = g.clearRows.includes(r);
          const alpha = isClear
            ? 0.2 + Math.sin(g.clearTimer * 0.6) * 0.1
            : PIECE_ALPHA[val - 1];
          drawCell(gridX + col * cellSize, gridY + r * cellSize, cellSize, alpha);
        }
      }

      // ── Ghost piece ───────────────────────────────────────────────
      if (!g.gameOver && g.clearTimer === 0) {
        const ghostY = getGhostY(g.board, g.current);
        if (ghostY !== g.current.y) {
          for (const [r, col] of getCells(g.current.type, g.current.rotation, g.current.x, ghostY)) {
            if (r < 0) continue;
            drawCell(gridX + col * cellSize, gridY + r * cellSize, cellSize, 0.05);
          }
        }

        // ── Current piece ─────────────────────────────────────────────
        const activeAlpha = PIECE_ALPHA[g.current.type] + PIECE_ACTIVE_BOOST;
        for (const [r, col] of getCells(g.current.type, g.current.rotation, g.current.x, g.current.y)) {
          if (r < 0) continue;
          drawCell(gridX + col * cellSize, gridY + r * cellSize, cellSize, activeAlpha);
        }
      }

      // ── Next piece preview (top-right of visible area) ────────────
      const pvSize = Math.floor(cellSize * 0.55);
      const pvX = gridX + gridW + Math.max(12, cellSize * 0.3);
      const pvY = Math.max(gridY + cellSize, 40);

      // Label
      dc.save();
      dc.font = `500 ${Math.max(9, pvSize * 0.4)}px Inter, system-ui, sans-serif`;
      dc.textAlign = "left";
      dc.textBaseline = "bottom";
      dc.fillStyle = `rgba(${STONE}, 0.15)`;
      dc.fillText("NEXT", pvX, pvY - 4);
      dc.restore();

      for (const [r, col] of TETROMINOES[g.next][0]) {
        drawCell(pvX + col * pvSize, pvY + r * pvSize, pvSize, PIECE_ALPHA[g.next] * 0.7);
      }

      // ── Score popup ───────────────────────────────────────────────
      if (g.popup) {
        const alpha = Math.min(1, g.popup.timer / 20) * 0.4;
        const py = gridY + g.popup.y * cellSize - (40 - g.popup.timer) * 1.5;
        dc.save();
        dc.font = `700 ${Math.max(14, cellSize * 0.4)}px Inter, system-ui, sans-serif`;
        dc.textAlign = "center";
        dc.textBaseline = "middle";
        dc.fillStyle = `rgba(${STONE}, ${alpha})`;
        dc.fillText(g.popup.text, gridX + g.popup.x * cellSize + cellSize * 2, py);
        dc.restore();
      }

      // ── Game over overlay ─────────────────────────────────────────
      if (g.gameOver) {
        const fadeAlpha = Math.min(1, g.gameOverTimer / 30);
        dc.fillStyle = `rgba(250, 250, 249, ${0.6 * fadeAlpha})`;
        dc.fillRect(0, 0, W, H);

        dc.save();
        dc.font = `300 ${Math.min(28, cellSize * 0.7)}px Inter, system-ui, sans-serif`;
        dc.textAlign = "center";
        dc.textBaseline = "middle";
        dc.fillStyle = `rgba(${STONE}, ${0.3 * fadeAlpha})`;
        dc.fillText("GAME OVER", W / 2, H / 2 - 14);

        dc.font = `400 ${Math.min(12, cellSize * 0.3)}px Inter, system-ui, sans-serif`;
        dc.fillStyle = `rgba(${STONE}, ${0.2 * fadeAlpha})`;
        dc.fillText("Click or tap to restart", W / 2, H / 2 + 14);
        dc.restore();
      }
    }

    function loop() {
      update();
      render();
      if (g.running) animId = requestAnimationFrame(loop);
    }
    animId = requestAnimationFrame(loop);

    return () => {
      g.running = false;
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("click", onClick);
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [updateBest]);

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 z-0" />
      <div className="fixed bottom-4 right-4 z-10 text-xs font-sans text-stone-400 select-none">
        {bestScore > 0 && `★ ${bestScore}`}
      </div>
    </>
  );
}
