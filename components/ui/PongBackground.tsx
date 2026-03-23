"use client";

import { useRef, useEffect, useState, useCallback } from "react";

export function PongBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [level, setLevel] = useState(1);
  const gameRef = useRef({
    ballX: 0,
    ballY: 0,
    ballVX: 2,
    ballVY: 3,
    paddleX: 0,
    aiPaddleX: 0,
    playerScore: 0,
    level: 1,
    mouseX: 0,
    running: true,
    levelUpTimer: 0,
    lastHitElement: "",
  });

  useEffect(() => {
    const stored = localStorage.getItem("pong_best");
    if (stored) setBestScore(parseInt(stored, 10));
  }, []);

  const updateBest = useCallback(
    (newScore: number) => {
      if (newScore > bestScore) {
        setBestScore(newScore);
        localStorage.setItem("pong_best", String(newScore));
      }
    },
    [bestScore]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const g = gameRef.current;
    const PADDLE_W = 80;
    const PADDLE_H = 8;
    const BALL_R = 5;

    const LEVEL_THRESHOLDS = [0, 5, 12, 20, 30, 42, 55, 70, 88, 108];

    function getLevelForScore(s: number): number {
      for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (s >= LEVEL_THRESHOLDS[i]) return i + 1;
      }
      return 1;
    }

    function getSpeedMultiplier(lvl: number): number {
      return 1 + (lvl - 1) * 0.08;
    }

    function getAISpeed(lvl: number): number {
      return 2.2 + (lvl - 1) * 0.25;
    }

    // Get bounding rects of text/UI elements on the page for collision
    function getPageObstacles(): DOMRect[] {
      const selectors = "h1, h2, p, a.bg-stone-900, .text-accent";
      const els = document.querySelectorAll(selectors);
      const rects: DOMRect[] = [];
      els.forEach((el) => {
        const r = el.getBoundingClientRect();
        // Only include elements that are visible and reasonably sized
        if (r.width > 20 && r.height > 10 && r.top > 40 && r.bottom < window.innerHeight - 40) {
          rects.push(r);
        }
      });
      return rects;
    }

    // Bounce ball off a rect, returns true if collision happened
    function bounceOffRect(rect: DOMRect): boolean {
      const bx = g.ballX, by = g.ballY, r = BALL_R;
      // Find closest point on rect to ball
      const cx = Math.max(rect.left, Math.min(bx, rect.right));
      const cy = Math.max(rect.top, Math.min(by, rect.bottom));
      const dx = bx - cx, dy = by - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < r + 2) {
        // Determine which side was hit
        const overlapL = rect.left - (bx - r);
        const overlapR = (bx + r) - rect.right;
        const overlapT = rect.top - (by - r);
        const overlapB = (by + r) - rect.bottom;

        const horizontal = Math.max(overlapL, overlapR);
        const vertical = Math.max(overlapT, overlapB);

        if (horizontal > vertical) {
          g.ballVX = -g.ballVX;
          g.ballX += g.ballVX > 0 ? 3 : -3;
        } else {
          g.ballVY = -g.ballVY;
          g.ballY += g.ballVY > 0 ? 3 : -3;
        }
        return true;
      }
      return false;
    }

    function addScore() {
      g.playerScore++;
      setScore(g.playerScore);
      updateBest(g.playerScore);

      const newLevel = getLevelForScore(g.playerScore);
      if (newLevel > g.level) {
        g.level = newLevel;
        g.levelUpTimer = 90;
        setLevel(newLevel);
      }
    }

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      g.ballX = canvas!.width / 2;
      g.ballY = canvas!.height / 2;
      g.paddleX = canvas!.width / 2 - PADDLE_W / 2;
      g.aiPaddleX = canvas!.width / 2 - PADDLE_W / 2;
    }
    resize();
    window.addEventListener("resize", resize);

    function onMouseMove(e: MouseEvent) {
      g.mouseX = e.clientX;
    }
    function onTouchMove(e: TouchEvent) {
      g.mouseX = e.touches[0].clientX;
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    g.running = true;
    let animId: number;
    let obstacleCache: DOMRect[] = [];
    let obstacleTick = 0;

    function draw() {
      if (!ctx || !canvas) return;
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      const speedMul = getSpeedMultiplier(g.level);
      const aiSpeed = getAISpeed(g.level);

      // Refresh obstacle cache every 30 frames
      if (obstacleTick++ % 30 === 0) {
        obstacleCache = getPageObstacles();
      }

      // Score as giant background text
      ctx.save();
      ctx.font = `bold ${Math.min(W * 0.5, 400)}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(0, 0, 0, 0.03)";
      ctx.fillText(String(g.playerScore), W / 2, H / 2);
      ctx.restore();

      // Level display (top-left)
      ctx.save();
      ctx.font = "600 13px Inter, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(120, 113, 108, 0.35)";
      ctx.fillText(`Level ${g.level}`, 16, 12);
      ctx.restore();

      // Score display (top-right)
      ctx.save();
      ctx.font = "700 16px Inter, system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(87, 83, 78, 0.45)";
      ctx.fillText(String(g.playerScore), W - 16, 10);
      ctx.restore();

      // Level-up text (fades out)
      if (g.levelUpTimer > 0) {
        g.levelUpTimer--;
        const alpha = Math.min(1, g.levelUpTimer / 40) * 0.55;
        ctx.save();
        ctx.font = `bold ${Math.min(W * 0.08, 48)}px Inter, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = `rgba(87, 83, 78, ${alpha})`;
        ctx.fillText(`Level ${g.level}!`, W / 2, H / 2 - 60);
        ctx.restore();
      }

      // Player paddle (bottom) — follows mouse X
      g.paddleX += (g.mouseX - g.paddleX - PADDLE_W / 2) * 0.1;
      g.paddleX = Math.max(0, Math.min(W - PADDLE_W, g.paddleX));

      ctx.fillStyle = "rgba(68, 64, 60, 0.35)";
      ctx.fillRect(g.paddleX, H - 24 - PADDLE_H, PADDLE_W, PADDLE_H);

      // AI paddle (top) — imperfect tracking
      const aiError = Math.sin(Date.now() * 0.002) * 30;
      const aiTarget = g.ballX - PADDLE_W / 2 + aiError;
      const aiReact = g.ballVY < 0 ? aiSpeed : aiSpeed * 0.3;
      if (g.aiPaddleX < aiTarget - 8) g.aiPaddleX += aiReact;
      else if (g.aiPaddleX > aiTarget + 8) g.aiPaddleX -= aiReact;
      g.aiPaddleX = Math.max(0, Math.min(W - PADDLE_W, g.aiPaddleX));

      ctx.fillStyle = "rgba(68, 64, 60, 0.28)";
      ctx.fillRect(g.aiPaddleX, 24, PADDLE_W, PADDLE_H);

      // Ball movement
      g.ballX += g.ballVX * speedMul;
      g.ballY += g.ballVY * speedMul;

      // Left/right wall bounce
      if (g.ballX <= BALL_R || g.ballX >= W - BALL_R) {
        g.ballVX = -g.ballVX;
        g.ballX = Math.max(BALL_R, Math.min(W - BALL_R, g.ballX));
      }

      // Player paddle collision (bottom) — SCORE ON HIT
      if (
        g.ballY + BALL_R >= H - 24 - PADDLE_H &&
        g.ballY - BALL_R <= H - 24 &&
        g.ballX >= g.paddleX &&
        g.ballX <= g.paddleX + PADDLE_W &&
        g.ballVY > 0
      ) {
        g.ballVY = -g.ballVY * 1.02;
        g.ballVX += (g.ballX - (g.paddleX + PADDLE_W / 2)) * 0.05;
        g.ballY = H - 24 - PADDLE_H - BALL_R;
        addScore();
      }

      // AI paddle collision (top)
      if (
        g.ballY - BALL_R <= 24 + PADDLE_H &&
        g.ballY + BALL_R >= 24 &&
        g.ballX >= g.aiPaddleX &&
        g.ballX <= g.aiPaddleX + PADDLE_W &&
        g.ballVY < 0
      ) {
        g.ballVY = -g.ballVY * 1.02;
        g.ballVX += (g.ballX - (g.aiPaddleX + PADDLE_W / 2)) * 0.05;
        g.ballY = 24 + PADDLE_H + BALL_R;
      }

      // Ball bounces off page text/UI elements
      for (const rect of obstacleCache) {
        if (bounceOffRect(rect)) {
          // Brief highlight flash on the canvas where collision happened
          ctx.save();
          ctx.globalAlpha = 0.15;
          ctx.fillStyle = "#78716c";
          ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
          ctx.restore();
          break; // one collision per frame
        }
      }

      // Clamp ball speed
      const speed = Math.sqrt(g.ballVX * g.ballVX + g.ballVY * g.ballVY);
      const maxSpeed = 12;
      if (speed > maxSpeed) {
        g.ballVX = (g.ballVX / speed) * maxSpeed;
        g.ballVY = (g.ballVY / speed) * maxSpeed;
      }

      // Ball goes off top — AI missed! 10 bonus points
      if (g.ballY < -BALL_R) {
        for (let i = 0; i < 10; i++) addScore();
        resetBall(W, H, 1);
      }

      // Ball goes off bottom — game over, reset
      if (g.ballY > H + BALL_R) {
        updateBest(g.playerScore);
        g.playerScore = 0;
        g.level = 1;
        g.levelUpTimer = 0;
        setScore(0);
        setLevel(1);
        resetBall(W, H, -1);
      }

      // Draw ball
      ctx.beginPath();
      ctx.arc(g.ballX, g.ballY, BALL_R, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(68, 64, 60, 0.4)";
      ctx.fill();

      if (g.running) {
        animId = requestAnimationFrame(draw);
      }
    }

    function resetBall(W: number, H: number, dir: number) {
      g.ballX = W / 2;
      g.ballY = H / 2;
      g.ballVY = 3 * dir;
      g.ballVX = (Math.random() - 0.5) * 4;
    }

    animId = requestAnimationFrame(draw);

    return () => {
      g.running = false;
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [updateBest]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 pointer-events-auto"
        style={{ cursor: "none" }}
      />
      {/* Best score indicator */}
      <div className="fixed bottom-4 right-4 z-10 text-xs font-sans text-stone-400 select-none">
        {bestScore > 0 && `Best: ${bestScore}`}
      </div>
    </>
  );
}
