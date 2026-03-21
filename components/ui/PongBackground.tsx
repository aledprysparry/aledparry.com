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
    const AI_SPEED = 2.5;

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

    let animId: number;

    function draw() {
      if (!ctx || !canvas) return;
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // Score as giant background text
      ctx.save();
      ctx.font = `bold ${Math.min(W * 0.5, 400)}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(0, 0, 0, 0.02)";
      ctx.fillText(String(g.playerScore), W / 2, H / 2);
      ctx.restore();

      // Player paddle (bottom) — follows mouse X
      g.paddleX += (g.mouseX - g.paddleX - PADDLE_W / 2) * 0.1;
      g.paddleX = Math.max(0, Math.min(W - PADDLE_W, g.paddleX));

      ctx.fillStyle = "rgba(100, 116, 139, 0.15)";
      ctx.fillRect(g.paddleX, H - 24 - PADDLE_H, PADDLE_W, PADDLE_H);

      // AI paddle (top) — follows ball X
      const aiTarget = g.ballX - PADDLE_W / 2;
      if (g.aiPaddleX < aiTarget - 5) g.aiPaddleX += AI_SPEED;
      else if (g.aiPaddleX > aiTarget + 5) g.aiPaddleX -= AI_SPEED;
      g.aiPaddleX = Math.max(0, Math.min(W - PADDLE_W, g.aiPaddleX));

      ctx.fillStyle = "rgba(100, 116, 139, 0.1)";
      ctx.fillRect(g.aiPaddleX, 24, PADDLE_W, PADDLE_H);

      // Ball movement
      g.ballX += g.ballVX;
      g.ballY += g.ballVY;

      // Left/right wall bounce
      if (g.ballX <= BALL_R || g.ballX >= W - BALL_R) {
        g.ballVX = -g.ballVX;
        g.ballX = Math.max(BALL_R, Math.min(W - BALL_R, g.ballX));
      }

      // Player paddle collision (bottom)
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

      // Clamp ball speed
      const speed = Math.sqrt(g.ballVX * g.ballVX + g.ballVY * g.ballVY);
      const maxSpeed = 12;
      if (speed > maxSpeed) {
        g.ballVX = (g.ballVX / speed) * maxSpeed;
        g.ballVY = (g.ballVY / speed) * maxSpeed;
      }

      // Ball goes off top — player scores
      if (g.ballY < -BALL_R) {
        g.playerScore++;
        setScore(g.playerScore);
        updateBest(g.playerScore);
        resetBall(W, H, 1);
      }

      // Ball goes off bottom — AI scores, reset player score
      if (g.ballY > H + BALL_R) {
        updateBest(g.playerScore);
        g.playerScore = 0;
        setScore(0);
        resetBall(W, H, -1);
      }

      // Draw ball
      ctx.beginPath();
      ctx.arc(g.ballX, g.ballY, BALL_R, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(100, 116, 139, 0.2)";
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
      <div className="fixed bottom-4 right-4 z-10 text-xs font-sans text-stone-300 select-none">
        {bestScore > 0 && `Best: ${bestScore}`}
      </div>
    </>
  );
}
