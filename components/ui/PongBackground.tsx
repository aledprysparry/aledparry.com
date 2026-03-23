"use client";

import { useRef, useEffect, useState, useCallback } from "react";

export function PongBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
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

    function getSpeedMultiplier(lvl: number): number {
      return 1 + (lvl - 1) * 0.08;
    }

    function getAISpeed(lvl: number): number {
      return 2.2 + (lvl - 1) * 0.25;
    }

    // Get bounding rects of text/UI elements for collision
    function getPageObstacles(): DOMRect[] {
      const selectors = "h1, h2, a.bg-stone-900";
      const els = document.querySelectorAll(selectors);
      const rects: DOMRect[] = [];
      els.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 20 && r.height > 10 && r.top > 40 && r.bottom < window.innerHeight - 40) {
          rects.push(r);
        }
      });
      return rects;
    }

    // Cooldown set to prevent ball getting stuck inside an obstacle
    const recentHits = new Set<number>();

    function bounceOffRect(rect: DOMRect, idx: number): boolean {
      if (recentHits.has(idx)) return false;

      const bx = g.ballX, by = g.ballY, r = BALL_R;
      const padded = 4; // extra padding so ball doesn't clip inside

      // Is ball overlapping the rect?
      if (
        bx + r < rect.left - padded ||
        bx - r > rect.right + padded ||
        by + r < rect.top - padded ||
        by - r > rect.bottom + padded
      ) {
        return false;
      }

      // Find penetration depths from each side
      const fromLeft = (bx + r) - rect.left;
      const fromRight = rect.right - (bx - r);
      const fromTop = (by + r) - rect.top;
      const fromBottom = rect.bottom - (by - r);

      const minX = Math.min(fromLeft, fromRight);
      const minY = Math.min(fromTop, fromBottom);

      if (minX < minY) {
        g.ballVX = -g.ballVX;
        g.ballX += fromLeft < fromRight ? -(minX + 5) : (minX + 5);
      } else {
        g.ballVY = -g.ballVY;
        g.ballY += fromTop < fromBottom ? -(minY + 5) : (minY + 5);
      }

      // Cooldown: ignore this obstacle for 20 frames
      recentHits.add(idx);
      setTimeout(() => recentHits.delete(idx), 333);

      return true;
    }

    function addScore(pts = 1) {
      g.playerScore += pts;
      setScore(g.playerScore);
      updateBest(g.playerScore);

      // Level up every 10 points
      const newLevel = Math.floor(g.playerScore / 10) + 1;
      if (newLevel > g.level) {
        g.level = newLevel;
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

      // Refresh obstacle cache every 60 frames
      if (obstacleTick++ % 60 === 0) {
        obstacleCache = getPageObstacles();
      }

      // Score as giant background text (the only score display)
      ctx.save();
      ctx.font = `bold ${Math.min(W * 0.5, 400)}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(0, 0, 0, 0.03)";
      ctx.fillText(String(g.playerScore), W / 2, H / 2);
      ctx.restore();

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

      // Ball bounces off page headings and buttons (with cooldown)
      for (let i = 0; i < obstacleCache.length; i++) {
        if (bounceOffRect(obstacleCache[i], i)) {
          // Brief highlight flash
          ctx.save();
          ctx.globalAlpha = 0.12;
          ctx.fillStyle = "#78716c";
          const r = obstacleCache[i];
          ctx.fillRect(r.left, r.top, r.width, r.height);
          ctx.restore();
          break;
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
        addScore(10);
        resetBall(W, H, 1);
      }

      // Ball goes off bottom — game over, reset
      if (g.ballY > H + BALL_R) {
        updateBest(g.playerScore);
        g.playerScore = 0;
        g.level = 1;
        setScore(0);
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
