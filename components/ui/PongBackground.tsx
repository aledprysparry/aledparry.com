"use client";

import { useRef, useEffect, useState, useCallback } from "react";

export function PongBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const gameRef = useRef({
    ballX: 0,
    ballY: 0,
    ballVX: 3,
    ballVY: 2,
    paddleY: 0,
    aiPaddleY: 0,
    playerScore: 0,
    aiScore: 0,
    mouseY: 0,
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
    const PADDLE_H = 80;
    const PADDLE_W = 8;
    const BALL_R = 5;
    const AI_SPEED = 2.5;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      g.ballX = canvas!.width / 2;
      g.ballY = canvas!.height / 2;
      g.paddleY = canvas!.height / 2 - PADDLE_H / 2;
      g.aiPaddleY = canvas!.height / 2 - PADDLE_H / 2;
    }
    resize();
    window.addEventListener("resize", resize);

    function onMouseMove(e: MouseEvent) {
      g.mouseY = e.clientY;
    }
    function onTouchMove(e: TouchEvent) {
      g.mouseY = e.touches[0].clientY;
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    let animId: number;

    function draw() {
      if (!ctx || !canvas) return;
      const W = canvas.width;
      const H = canvas.height;

      // Clear
      ctx.clearRect(0, 0, W, H);

      // Score as giant background text
      const totalScore = g.playerScore;
      ctx.save();
      ctx.font = `bold ${Math.min(W * 0.5, 400)}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(0, 0, 0, 0.02)";
      ctx.fillText(String(totalScore), W / 2, H / 2);
      ctx.restore();

      // Dashed center line
      ctx.setLineDash([8, 12]);
      ctx.strokeStyle = "rgba(0, 0, 0, 0.04)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(W / 2, H);
      ctx.stroke();
      ctx.setLineDash([]);

      // Player paddle (right side)
      g.paddleY += (g.mouseY - g.paddleY - PADDLE_H / 2) * 0.1;
      g.paddleY = Math.max(0, Math.min(H - PADDLE_H, g.paddleY));

      ctx.fillStyle = "rgba(100, 116, 139, 0.15)";
      ctx.fillRect(W - 24 - PADDLE_W, g.paddleY, PADDLE_W, PADDLE_H);

      // AI paddle (left side)
      const aiTarget = g.ballY - PADDLE_H / 2;
      if (g.aiPaddleY < aiTarget - 5) g.aiPaddleY += AI_SPEED;
      else if (g.aiPaddleY > aiTarget + 5) g.aiPaddleY -= AI_SPEED;
      g.aiPaddleY = Math.max(0, Math.min(H - PADDLE_H, g.aiPaddleY));

      ctx.fillStyle = "rgba(100, 116, 139, 0.1)";
      ctx.fillRect(24, g.aiPaddleY, PADDLE_W, PADDLE_H);

      // Ball
      g.ballX += g.ballVX;
      g.ballY += g.ballVY;

      // Top/bottom bounce
      if (g.ballY <= BALL_R || g.ballY >= H - BALL_R) {
        g.ballVY = -g.ballVY;
        g.ballY = Math.max(BALL_R, Math.min(H - BALL_R, g.ballY));
      }

      // Player paddle collision (right)
      if (
        g.ballX + BALL_R >= W - 24 - PADDLE_W &&
        g.ballX - BALL_R <= W - 24 &&
        g.ballY >= g.paddleY &&
        g.ballY <= g.paddleY + PADDLE_H &&
        g.ballVX > 0
      ) {
        g.ballVX = -g.ballVX * 1.02;
        g.ballVY += (g.ballY - (g.paddleY + PADDLE_H / 2)) * 0.05;
        g.ballX = W - 24 - PADDLE_W - BALL_R;
      }

      // AI paddle collision (left)
      if (
        g.ballX - BALL_R <= 24 + PADDLE_W &&
        g.ballX + BALL_R >= 24 &&
        g.ballY >= g.aiPaddleY &&
        g.ballY <= g.aiPaddleY + PADDLE_H &&
        g.ballVX < 0
      ) {
        g.ballVX = -g.ballVX * 1.02;
        g.ballVY += (g.ballY - (g.aiPaddleY + PADDLE_H / 2)) * 0.05;
        g.ballX = 24 + PADDLE_W + BALL_R;
      }

      // Clamp ball speed
      const speed = Math.sqrt(g.ballVX * g.ballVX + g.ballVY * g.ballVY);
      const maxSpeed = 12;
      if (speed > maxSpeed) {
        g.ballVX = (g.ballVX / speed) * maxSpeed;
        g.ballVY = (g.ballVY / speed) * maxSpeed;
      }

      // Score — ball goes off screen
      if (g.ballX < -BALL_R) {
        // Player scores
        g.playerScore++;
        setScore(g.playerScore);
        updateBest(g.playerScore);
        resetBall(W, H, 1);
      }
      if (g.ballX > W + BALL_R) {
        // AI scores — reset player score
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
      g.ballVX = 3 * dir;
      g.ballVY = (Math.random() - 0.5) * 4;
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
