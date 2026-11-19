/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Jogo da Cobrinha (Snake) - Primeiro título da página Jogos Online WZZM
 * Controles: WASD, Setas do Teclado (Cursores), Toque/Swipe e D-Pad na tela.
 * Dificuldade dinâmica ajustável (adicionar ou remover nível, velocidade, paredes e obstáculos).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';

type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface GridPoint {
  x: number;
  y: number;
}

interface DifficultyPreset {
  level: number;
  name: string;
  tickMs: number;
  solidWalls: boolean;
  obstaclesCount: number;
  multiplier: number;
  description: string;
}

const GRID_SIZE = 20;
const HIGH_SCORE_STORAGE_KEY = 'wzzm_snake_highscore_v1';

const DIFFICULTY_LEVELS: DifficultyPreset[] = [
  {
    level: 1,
    name: 'Muito Fácil',
    tickMs: 210,
    solidWalls: false,
    obstaclesCount: 0,
    multiplier: 1,
    description: 'Ritmo calmo, bordas atravessáveis e arena livre.',
  },
  {
    level: 2,
    name: 'Fácil',
    tickMs: 175,
    solidWalls: false,
    obstaclesCount: 0,
    multiplier: 1.2,
    description: 'Velocidade leve e bordas conectadas.',
  },
  {
    level: 3,
    name: 'Médio',
    tickMs: 140,
    solidWalls: true,
    obstaclesCount: 0,
    multiplier: 1.5,
    description: 'Equilíbrio clássico com paredes sólidas.',
  },
  {
    level: 4,
    name: 'Intermediário',
    tickMs: 115,
    solidWalls: true,
    obstaclesCount: 4,
    multiplier: 2,
    description: 'Mais ágil, com paredes sólidas e 4 blocos de obstáculo.',
  },
  {
    level: 5,
    name: 'Difícil',
    tickMs: 95,
    solidWalls: true,
    obstaclesCount: 6,
    multiplier: 2.5,
    description: 'Reflexos rápidos exigidos com 6 obstáculos fixos.',
  },
  {
    level: 6,
    name: 'Muito Difícil',
    tickMs: 80,
    solidWalls: true,
    obstaclesCount: 8,
    multiplier: 3,
    description: 'Alta velocidade com 8 obstáculos estratégicos.',
  },
  {
    level: 7,
    name: 'Especialista',
    tickMs: 68,
    solidWalls: true,
    obstaclesCount: 10,
    multiplier: 3.5,
    description: 'Ritmo intenso e 10 obstáculos na arena.',
  },
  {
    level: 8,
    name: 'Extremo',
    tickMs: 56,
    solidWalls: true,
    obstaclesCount: 12,
    multiplier: 4,
    description: 'Desafio máximo com velocidade extrema e 12 obstáculos.',
  },
];

const INITIAL_SNAKE: GridPoint[] = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];

const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

function pointsEqual(a: GridPoint, b: GridPoint): boolean {
  return a.x === b.x && a.y === b.y;
}

function loadStoredHighScore(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
    const parsed = raw ? Number(raw) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
  } catch {
    return 0;
  }
}

function saveStoredHighScore(score: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(Math.floor(score)));
  } catch {
    // Ignore storage quota errors
  }
}

function generateSafeObstacles(
  count: number,
  occupied: GridPoint[],
  avoidRow?: number
): GridPoint[] {
  if (count <= 0) return [];
  const obstacles: GridPoint[] = [];
  let attempts = 0;
  while (obstacles.length < count && attempts < 400) {
    attempts++;
    const x = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
    const y = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
    // Keep horizontal starting corridor clear around snake head
    if (avoidRow !== undefined && y === avoidRow && x >= 6 && x <= 15) {
      continue;
    }
    const candidate = { x, y };
    const isTaken =
      occupied.some((p) => pointsEqual(p, candidate)) ||
      obstacles.some((o) => pointsEqual(o, candidate));
    if (!isTaken) {
      obstacles.push(candidate);
    }
  }
  return obstacles;
}

function spawnFreeFood(occupied: GridPoint[]): GridPoint {
  const freeCells: GridPoint[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const candidate = { x, y };
      if (!occupied.some((p) => pointsEqual(p, candidate))) {
        freeCells.push(candidate);
      }
    }
  }
  if (freeCells.length === 0) {
    return { x: 0, y: 0 };
  }
  return freeCells[Math.floor(Math.random() * freeCells.length)];
}

export default function SnakeGame() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [difficultyIndex, setDifficultyIndex] = useState<number>(2); // Default: Nível 3 (Médio)
  const [customSolidWalls, setCustomSolidWalls] = useState<boolean>(DIFFICULTY_LEVELS[2].solidWalls);
  const [customObstaclesCount, setCustomObstaclesCount] = useState<number>(
    DIFFICULTY_LEVELS[2].obstaclesCount
  );

  const [score, setScore] = useState<number>(0);
  const [applesEaten, setApplesEaten] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => loadStoredHighScore());
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);
  const [deathReason, setDeathReason] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const currentPreset = DIFFICULTY_LEVELS[difficultyIndex] || DIFFICULTY_LEVELS[2];

  // Live mutable simulation state in refs for crisp tick accuracy
  const snakeRef = useRef<GridPoint[]>([...INITIAL_SNAKE]);
  const directionRef = useRef<Direction>('RIGHT');
  const directionQueueRef = useRef<Direction[]>([]);
  const foodRef = useRef<GridPoint>({ x: 15, y: 10 });
  const obstaclesRef = useRef<GridPoint[]>([]);
  const scoreRef = useRef<number>(0);
  const highScoreRef = useRef<number>(highScore);
  const gameStateRef = useRef<GameState>(gameState);
  const solidWallsRef = useRef<boolean>(customSolidWalls);
  const multiplierRef = useRef<number>(currentPreset.multiplier);
  const soundEnabledRef = useRef<boolean>(soundEnabled);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    solidWallsRef.current = customSolidWalls;
  }, [customSolidWalls]);

  useEffect(() => {
    multiplierRef.current = currentPreset.multiplier;
  }, [currentPreset.multiplier]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    highScoreRef.current = highScore;
  }, [highScore]);

  const playTone = useCallback(
    (freq: number, durationSec: number, type: OscillatorType = 'sine', gainVal = 0.08) => {
      if (!soundEnabledRef.current || typeof window === 'undefined') return;
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + durationSec);
      } catch {
        // Ignore browser audio restriction errors
      }
    },
    []
  );

  const drawArena = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const logicalSize = 480;
    if (canvas.width !== logicalSize * dpr || canvas.height !== logicalSize * dpr) {
      canvas.width = logicalSize * dpr;
      canvas.height = logicalSize * dpr;
    }
    ctx.save();
    ctx.scale(dpr, dpr);

    const cellSize = logicalSize / GRID_SIZE;

    // 1. Arena surface (Deep forest slate)
    ctx.fillStyle = '#0F2419';
    ctx.fillRect(0, 0, logicalSize, logicalSize);

    // 2. Subtle grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 1; i < GRID_SIZE; i++) {
      const pos = i * cellSize;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, logicalSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(logicalSize, pos);
      ctx.stroke();
    }

    // Visual wall border indicator when solid walls are active
    if (solidWallsRef.current) {
      ctx.strokeStyle = 'rgba(220, 38, 38, 0.55)';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, logicalSize - 4, logicalSize - 4);
    } else {
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, logicalSize - 2, logicalSize - 2);
      ctx.setLineDash([]);
    }

    // 3. Draw Obstacles
    for (const obs of obstaclesRef.current) {
      const ox = obs.x * cellSize + 2;
      const oy = obs.y * cellSize + 2;
      const os = cellSize - 4;
      ctx.fillStyle = '#475569';
      ctx.fillRect(ox, oy, os, os);
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ox + 1, oy + 1, os - 2, os - 2);
      // Cross mark inside obstacle
      ctx.beginPath();
      ctx.moveTo(ox + 4, oy + 4);
      ctx.lineTo(ox + os - 4, oy + os - 4);
      ctx.moveTo(ox + os - 4, oy + 4);
      ctx.lineTo(ox + 4, oy + os - 4);
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.stroke();
    }

    // 4. Draw Food (Crisp Apple)
    const food = foodRef.current;
    const fx = food.x * cellSize + cellSize / 2;
    const fy = food.y * cellSize + cellSize / 2;
    const radius = cellSize * 0.36;

    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(fx, fy + 1, radius, 0, Math.PI * 2);
    ctx.fill();

    // Specular highlight & leaf
    ctx.fillStyle = '#FCA5A5';
    ctx.beginPath();
    ctx.arc(fx - radius * 0.3, fy - radius * 0.25, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4ADE80';
    ctx.beginPath();
    ctx.ellipse(fx + 2, fy - radius + 1, 3.5, 2, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // 5. Draw Snake
    const snake = snakeRef.current;
    for (let i = snake.length - 1; i >= 0; i--) {
      const seg = snake[i];
      const pad = i === 0 ? 1.5 : 2.5;
      const sx = seg.x * cellSize + pad;
      const sy = seg.y * cellSize + pad;
      const size = cellSize - pad * 2;

      if (i === 0) {
        ctx.fillStyle = '#34D399';
      } else {
        const shade = Math.max(0.45, 1 - i / (snake.length + 6));
        ctx.fillStyle = `rgba(16, 185, 129, ${shade.toFixed(2)})`;
      }

      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(sx, sy, size, size, i === 0 ? 5 : 4);
      } else {
        ctx.rect(sx, sy, size, size);
      }
      ctx.fill();

      // Head directional eyes
      if (i === 0) {
        ctx.fillStyle = '#06281E';
        const eyeRadius = 2.2;
        const dir = directionRef.current;
        let e1x = sx + size * 0.65;
        let e1y = sy + size * 0.28;
        let e2x = sx + size * 0.65;
        let e2y = sy + size * 0.72;

        if (dir === 'LEFT') {
          e1x = sx + size * 0.35;
          e2x = sx + size * 0.35;
        } else if (dir === 'UP') {
          e1x = sx + size * 0.28;
          e1y = sy + size * 0.35;
          e2x = sx + size * 0.72;
          e2y = sy + size * 0.35;
        } else if (dir === 'DOWN') {
          e1x = sx + size * 0.28;
          e1y = sy + size * 0.65;
          e2x = sx + size * 0.72;
          e2y = sy + size * 0.65;
        }

        ctx.beginPath();
        ctx.arc(e1x, e1y, eyeRadius, 0, Math.PI * 2);
        ctx.arc(e2x, e2y, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }, []);

  const resetBoardForRound = useCallback(
    (obstaclesCountOverride?: number) => {
      const freshSnake = INITIAL_SNAKE.map((p) => ({ ...p }));
      snakeRef.current = freshSnake;
      directionRef.current = 'RIGHT';
      directionQueueRef.current = [];
      const obsCount = obstaclesCountOverride ?? customObstaclesCount;
      const obstacles = generateSafeObstacles(obsCount, freshSnake, 10);
      obstaclesRef.current = obstacles;
      foodRef.current = spawnFreeFood([...freshSnake, ...obstacles]);
      scoreRef.current = 0;
      setScore(0);
      setApplesEaten(0);
      setIsNewRecord(false);
      setDeathReason('');
      drawArena();
    },
    [customObstaclesCount, drawArena]
  );

  // Initial board draw
  useEffect(() => {
    resetBoardForRound(currentPreset.obstaclesCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startNewGame = useCallback(() => {
    resetBoardForRound(customObstaclesCount);
    setGameState('PLAYING');
    playTone(520, 0.09, 'triangle', 0.08);
  }, [customObstaclesCount, playTone, resetBoardForRound]);

  const togglePause = useCallback(() => {
    setGameState((prev) => {
      if (prev === 'PLAYING') {
        playTone(300, 0.07, 'sine', 0.06);
        return 'PAUSED';
      }
      if (prev === 'PAUSED') {
        playTone(440, 0.07, 'sine', 0.06);
        return 'PLAYING';
      }
      return prev;
    });
  }, [playTone]);

  // Apply difficulty preset step (+ or - difficulty level)
  const applyDifficultyLevel = useCallback(
    (nextIndex: number) => {
      const clamped = Math.max(0, Math.min(DIFFICULTY_LEVELS.length - 1, nextIndex));
      const nextPreset = DIFFICULTY_LEVELS[clamped];
      setDifficultyIndex(clamped);
      setCustomSolidWalls(nextPreset.solidWalls);
      setCustomObstaclesCount(nextPreset.obstaclesCount);

      if (gameStateRef.current === 'TITLE_MENU' || gameStateRef.current === 'GAME_OVER') {
        resetBoardForRound(nextPreset.obstaclesCount);
      } else {
        // Dynamically adjust obstacles during live/paused play without colliding with snake head
        const protectedZone = [
          ...snakeRef.current,
          foodRef.current,
          { x: snakeRef.current[0].x + 1, y: snakeRef.current[0].y },
          { x: snakeRef.current[0].x - 1, y: snakeRef.current[0].y },
          { x: snakeRef.current[0].x, y: snakeRef.current[0].y + 1 },
          { x: snakeRef.current[0].x, y: snakeRef.current[0].y - 1 },
        ];
        if (nextPreset.obstaclesCount === 0) {
          obstaclesRef.current = [];
        } else if (nextPreset.obstaclesCount < obstaclesRef.current.length) {
          obstaclesRef.current = obstaclesRef.current.slice(0, nextPreset.obstaclesCount);
        } else if (nextPreset.obstaclesCount > obstaclesRef.current.length) {
          const needed = nextPreset.obstaclesCount - obstaclesRef.current.length;
          const extras = generateSafeObstacles(needed, [...protectedZone, ...obstaclesRef.current]);
          obstaclesRef.current = [...obstaclesRef.current, ...extras];
        }
        drawArena();
      }
      playTone(340 + clamped * 45, 0.06, 'sine', 0.05);
    },
    [drawArena, playTone, resetBoardForRound]
  );

  const handleIncreaseDifficulty = useCallback(() => {
    applyDifficultyLevel(difficultyIndex + 1);
  }, [applyDifficultyLevel, difficultyIndex]);

  const handleDecreaseDifficulty = useCallback(() => {
    applyDifficultyLevel(difficultyIndex - 1);
  }, [applyDifficultyLevel, difficultyIndex]);

  const handleAdjustObstacles = useCallback(
    (delta: number) => {
      setCustomObstaclesCount((prev) => {
        const next = Math.max(0, Math.min(20, prev + delta));
        if (next === 0) {
          obstaclesRef.current = [];
        } else if (next < obstaclesRef.current.length) {
          obstaclesRef.current = obstaclesRef.current.slice(0, next);
        } else if (next > obstaclesRef.current.length) {
          const head = snakeRef.current[0];
          const protectedCells = [
            ...snakeRef.current,
            foodRef.current,
            ...obstaclesRef.current,
            { x: head.x + 1, y: head.y },
            { x: head.x - 1, y: head.y },
            { x: head.x, y: head.y + 1 },
            { x: head.x, y: head.y - 1 },
          ];
          const added = generateSafeObstacles(next - obstaclesRef.current.length, protectedCells);
          obstaclesRef.current = [...obstaclesRef.current, ...added];
        }
        drawArena();
        return next;
      });
    },
    [drawArena]
  );

  const handleToggleWalls = useCallback(() => {
    setCustomSolidWalls((prev) => {
      const next = !prev;
      solidWallsRef.current = next;
      drawArena();
      return next;
    });
  }, [drawArena]);

  const queueDirection = useCallback((nextDir: Direction) => {
    if (gameStateRef.current === 'TITLE_MENU') {
      // Allow starting right away with a movement key (except opposite to initial RIGHT)
      if (nextDir !== 'LEFT') {
        directionRef.current = nextDir;
      }
      startNewGame();
      return;
    }

    if (gameStateRef.current !== 'PLAYING') return;

    const queue = directionQueueRef.current;
    const referenceDir = queue.length > 0 ? queue[queue.length - 1] : directionRef.current;
    if (nextDir === referenceDir || OPPOSITE_DIRECTION[referenceDir] === nextDir) {
      return;
    }
    if (queue.length < 2) {
      queue.push(nextDir);
    }
  }, [startNewGame]);

  // Keyboard listener for WASD + Arrow keys + Pause/Restart
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        target?.isContentEditable
      ) {
        return;
      }

      const key = e.key;
      const lower = key.toLowerCase();

      if (key === 'ArrowUp' || lower === 'w') {
        e.preventDefault();
        queueDirection('UP');
      } else if (key === 'ArrowDown' || lower === 's') {
        e.preventDefault();
        queueDirection('DOWN');
      } else if (key === 'ArrowLeft' || lower === 'a') {
        e.preventDefault();
        queueDirection('LEFT');
      } else if (key === 'ArrowRight' || lower === 'd') {
        e.preventDefault();
        queueDirection('RIGHT');
      } else if (lower === 'p' || key === 'Escape') {
        if (gameStateRef.current === 'PLAYING' || gameStateRef.current === 'PAUSED') {
          e.preventDefault();
          togglePause();
        }
      } else if (key === ' ' || key === 'Enter') {
        if (gameStateRef.current === 'TITLE_MENU' || gameStateRef.current === 'GAME_OVER') {
          e.preventDefault();
          startNewGame();
        } else if (
          key === ' ' &&
          (gameStateRef.current === 'PLAYING' || gameStateRef.current === 'PAUSED')
        ) {
          e.preventDefault();
          togglePause();
        }
      } else if (key === '+' || key === '=') {
        e.preventDefault();
        handleIncreaseDifficulty();
      } else if (key === '-' || key === '_') {
        e.preventDefault();
        handleDecreaseDifficulty();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    handleDecreaseDifficulty,
    handleIncreaseDifficulty,
    queueDirection,
    startNewGame,
    togglePause,
  ]);

  // Main game tick loop (adapts immediately when difficulty speed changes)
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const intervalId = window.setInterval(() => {
      const snake = snakeRef.current;
      const nextQueued = directionQueueRef.current.shift();
      if (nextQueued) {
        directionRef.current = nextQueued;
      }

      const head = snake[0];
      const dir = directionRef.current;
      let nextX = head.x;
      let nextY = head.y;

      if (dir === 'UP') nextY -= 1;
      else if (dir === 'DOWN') nextY += 1;
      else if (dir === 'LEFT') nextX -= 1;
      else if (dir === 'RIGHT') nextX += 1;

      // Wall collision or wrap-around
      if (solidWallsRef.current) {
        if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE) {
          setDeathReason('Colisão com a borda da arena');
          setGameState('GAME_OVER');
          playTone(170, 0.25, 'sawtooth', 0.08);
          return;
        }
      } else {
        nextX = (nextX + GRID_SIZE) % GRID_SIZE;
        nextY = (nextY + GRID_SIZE) % GRID_SIZE;
      }

      const nextHead = { x: nextX, y: nextY };

      // Obstacle collision
      if (obstaclesRef.current.some((obs) => pointsEqual(obs, nextHead))) {
        setDeathReason('Colisão com obstáculo na arena');
        setGameState('GAME_OVER');
        playTone(170, 0.25, 'sawtooth', 0.08);
        return;
      }

      const willEat = pointsEqual(nextHead, foodRef.current);
      const bodyToCheck = willEat ? snake : snake.slice(0, -1);

      // Self collision
      if (bodyToCheck.some((seg) => pointsEqual(seg, nextHead))) {
        setDeathReason('A cobrinha colidiu com o próprio corpo');
        setGameState('GAME_OVER');
        playTone(170, 0.25, 'sawtooth', 0.08);
        return;
      }

      const updatedSnake = [nextHead, ...snake];
      if (!willEat) {
        updatedSnake.pop();
      }
      snakeRef.current = updatedSnake;

      if (willEat) {
        const pointsEarned = Math.round(10 * multiplierRef.current);
        const nextScore = scoreRef.current + pointsEarned;
        scoreRef.current = nextScore;
        setScore(nextScore);
        setApplesEaten((prev) => prev + 1);

        if (nextScore > highScoreRef.current) {
          highScoreRef.current = nextScore;
          setHighScore(nextScore);
          setIsNewRecord(true);
          saveStoredHighScore(nextScore);
        }

        foodRef.current = spawnFreeFood([...updatedSnake, ...obstaclesRef.current]);
        playTone(680, 0.08, 'triangle', 0.09);
      }

      drawArena();
    }, currentPreset.tickMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [currentPreset.tickMs, drawArena, gameState, playTone]);

  const speedMovesPerSec = useMemo(
    () => (1000 / currentPreset.tickMs).toFixed(1),
    [currentPreset.tickMs]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Arena Principal do Jogo da Cobrinha */}
      <div className="lg:col-span-7 bg-white dark:bg-[#1A1A18] border-2 border-[#141414] dark:border-[#3E3D38] shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] p-4 sm:p-6">
        {/* HUD Superior */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-stone-300 dark:border-[#2E2D28]">
          <div className="flex flex-wrap items-center gap-6 font-mono text-xs tabular-nums">
            <div>
              <span className="block text-[10px] uppercase text-stone-500 dark:text-stone-400">
                Pontuação
              </span>
              <span className="text-xl font-bold text-[#141414] dark:text-stone-100">
                {score}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-stone-500 dark:text-stone-400">
                Recorde
              </span>
              <span className="text-xl font-bold text-amber-700 dark:text-amber-400 inline-flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                <span>{highScore}</span>
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-stone-500 dark:text-stone-400">
                Frutas
              </span>
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                {applesEaten}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
              <button
                type="button"
                onClick={togglePause}
                className="px-3 py-2 border border-[#141414] dark:border-[#3E3D38] bg-[#F8F7F4] dark:bg-[#242320] text-[#141414] dark:text-stone-100 font-mono text-xs font-bold uppercase inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer hover:bg-stone-200 dark:hover:bg-[#32302B]"
              >
                {gameState === 'PAUSED' ? (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Continuar</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Pausar</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={startNewGame}
              className="px-3 py-2 border border-[#141414] dark:border-[#3E3D38] bg-[#F8F7F4] dark:bg-[#242320] text-[#141414] dark:text-stone-100 font-mono text-xs font-bold uppercase inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer hover:bg-stone-200 dark:hover:bg-[#32302B]"
              title="Reiniciar partida"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar</span>
            </button>

            <button
              type="button"
              onClick={() => setSoundEnabled((s) => !s)}
              aria-label={soundEnabled ? 'Desativar som' : 'Ativar som'}
              title={soundEnabled ? 'Som ligado' : 'Som desligado'}
              className="p-2 border border-[#141414] dark:border-[#3E3D38] bg-[#F8F7F4] dark:bg-[#242320] text-[#141414] dark:text-stone-100 cursor-pointer hover:bg-stone-200 dark:hover:bg-[#32302B]"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-stone-500" />
              )}
            </button>
          </div>
        </div>

        {/* Canvas do Jogo + Overlays de Estado */}
        <div className="relative mx-auto w-full max-w-[480px] aspect-square border-2 border-[#141414] dark:border-[#3E3D38] bg-[#0F2419] overflow-hidden select-none">
          <canvas
            ref={canvasRef}
            onTouchStart={(e) => {
              const t = e.touches[0];
              if (t) {
                touchStartRef.current = { x: t.clientX, y: t.clientY };
              }
            }}
            onTouchEnd={(e) => {
              if (!touchStartRef.current) return;
              const t = e.changedTouches[0];
              if (!t) return;
              const dx = t.clientX - touchStartRef.current.x;
              const dy = t.clientY - touchStartRef.current.y;
              touchStartRef.current = null;
              if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
              if (Math.abs(dx) > Math.abs(dy)) {
                queueDirection(dx > 0 ? 'RIGHT' : 'LEFT');
              } else {
                queueDirection(dy > 0 ? 'DOWN' : 'UP');
              }
            }}
            className="w-full h-full block touch-none"
          />

          {gameState === 'TITLE_MENU' && (
            <div className="absolute inset-0 bg-[#0A1912]/85 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center text-white">
              <h3 className="font-editorial text-3xl font-bold tracking-tight mb-2">
                Jogo da Cobrinha
              </h3>
              <p className="font-mono text-xs text-stone-300 max-w-xs leading-relaxed mb-5">
                Use as teclas <strong>W A S D</strong> ou as <strong>Setas (Cursores)</strong> para
                guiar a cobrinha e coletar as frutas. Ajuste a dificuldade antes ou durante o jogo.
              </p>
              <div className="font-mono text-[11px] text-emerald-300 mb-5">
                Nível {currentPreset.level} · {currentPreset.name} · {currentPreset.multiplier}x pontos
              </div>
              <button
                type="button"
                onClick={startNewGame}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-wider border-2 border-emerald-300 inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Iniciar Jogo</span>
              </button>
            </div>
          )}

          {gameState === 'PAUSED' && (
            <div className="absolute inset-0 bg-[#0A1912]/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center text-white">
              <h3 className="font-editorial text-3xl font-bold mb-2">Jogo Pausado</h3>
              <p className="font-mono text-xs text-stone-300 mb-5">
                Você pode adicionar ou remover dificuldade no painel ao lado antes de continuar.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePause}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-wider border border-emerald-300 inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>Continuar</span>
                </button>
                <button
                  type="button"
                  onClick={startNewGame}
                  className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-white font-mono text-xs font-bold uppercase tracking-wider border border-stone-500 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Reiniciar
                </button>
              </div>
            </div>
          )}

          {gameState === 'GAME_OVER' && (
            <div className="absolute inset-0 bg-[#140A0A]/88 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center text-white">
              <h3 className="font-editorial text-3xl font-bold text-red-400 mb-1">
                Fim de Jogo
              </h3>
              {deathReason && (
                <p className="font-mono text-xs text-stone-300 mb-4">{deathReason}</p>
              )}

              <div className="grid grid-cols-2 gap-6 font-mono text-xs tabular-nums mb-5 px-6 py-3 bg-black/40 border border-stone-700">
                <div>
                  <span className="block text-[10px] text-stone-400 uppercase">Pontuação</span>
                  <span className="text-2xl font-bold text-white">{score}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-stone-400 uppercase">Recorde</span>
                  <span className="text-2xl font-bold text-amber-400">{highScore}</span>
                </div>
              </div>

              {isNewRecord && (
                <p className="font-mono text-xs font-bold text-amber-300 mb-4">
                  Novo recorde pessoal registrado!
                </p>
              )}

              <button
                type="button"
                onClick={startNewGame}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-wider border-2 border-emerald-300 inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Jogar Novamente</span>
              </button>
            </div>
          )}
        </div>

        {/* D-Pad Tátil para Celular / Mouse */}
        <div className="mt-5 flex flex-col items-center gap-1.5 sm:hidden">
          <button
            type="button"
            onClick={() => queueDirection('UP')}
            aria-label="Mover para cima"
            className="w-12 h-12 flex items-center justify-center border-2 border-[#141414] dark:border-[#3E3D38] bg-[#F8F7F4] dark:bg-[#242320] text-[#141414] dark:text-stone-100 active:bg-emerald-600 active:text-white cursor-pointer"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => queueDirection('LEFT')}
              aria-label="Mover para esquerda"
              className="w-12 h-12 flex items-center justify-center border-2 border-[#141414] dark:border-[#3E3D38] bg-[#F8F7F4] dark:bg-[#242320] text-[#141414] dark:text-stone-100 active:bg-emerald-600 active:text-white cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => queueDirection('DOWN')}
              aria-label="Mover para baixo"
              className="w-12 h-12 flex items-center justify-center border-2 border-[#141414] dark:border-[#3E3D38] bg-[#F8F7F4] dark:bg-[#242320] text-[#141414] dark:text-stone-100 active:bg-emerald-600 active:text-white cursor-pointer"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => queueDirection('RIGHT')}
              aria-label="Mover para direita"
              className="w-12 h-12 flex items-center justify-center border-2 border-[#141414] dark:border-[#3E3D38] bg-[#F8F7F4] dark:bg-[#242320] text-[#141414] dark:text-stone-100 active:bg-emerald-600 active:text-white cursor-pointer"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Painel Lateral: Controle de Dificuldade e Teclado */}
      <aside className="lg:col-span-5 space-y-5">
        {/* Seletor + / - de Dificuldade */}
        <section className="bg-white dark:bg-[#1A1A18] border-2 border-[#141414] dark:border-[#3E3D38] shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] p-5 space-y-5">
          <div>
            <h3 className="font-editorial text-xl font-bold text-[#141414] dark:text-stone-100">
              Ajuste de Dificuldade
            </h3>
            <p className="font-mono text-xs text-stone-600 dark:text-stone-400 mt-1">
              Adicione ou remova dificuldade a qualquer momento usando os botões abaixo ou as teclas{' '}
              <strong>+</strong> e <strong>−</strong>.
            </p>
          </div>

          {/* Stepper Principal: Remover / Adicionar Dificuldade */}
          <div className="p-4 bg-[#F8F7F4] dark:bg-[#121210] border border-stone-300 dark:border-[#3E3D38] space-y-3">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleDecreaseDifficulty}
                disabled={difficultyIndex <= 0}
                className="px-3 py-2.5 bg-white dark:bg-[#242320] hover:bg-stone-200 dark:hover:bg-[#32302B] text-[#141414] dark:text-stone-100 border border-[#141414] dark:border-[#3E3D38] font-mono text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Remover dificuldade (tecla -)"
              >
                <Minus className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                <span>Remover</span>
              </button>

              <div className="text-center font-mono">
                <div className="text-xs font-bold text-[#141414] dark:text-stone-100 tabular-nums">
                  Nível {currentPreset.level} de {DIFFICULTY_LEVELS.length}
                </div>
                <div className="text-sm font-bold text-emerald-800 dark:text-emerald-400">
                  {currentPreset.name}
                </div>
              </div>

              <button
                type="button"
                onClick={handleIncreaseDifficulty}
                disabled={difficultyIndex >= DIFFICULTY_LEVELS.length - 1}
                className="px-3 py-2.5 bg-[#141414] dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-950 border border-[#141414] font-mono text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Adicionar dificuldade (tecla +)"
              >
                <Plus className="w-4 h-4 text-amber-400 dark:text-amber-700" />
                <span>Adicionar</span>
              </button>
            </div>

            {/* Barra de Níveis Clicável */}
            <div className="grid grid-cols-8 gap-1 pt-1" role="group" aria-label="Níveis de dificuldade">
              {DIFFICULTY_LEVELS.map((lvl, idx) => {
                const selected = idx === difficultyIndex;
                return (
                  <button
                    key={lvl.level}
                    type="button"
                    onClick={() => applyDifficultyLevel(idx)}
                    title={`Nível ${lvl.level}: ${lvl.name}`}
                    className={`py-1.5 font-mono text-xs font-bold border transition-colors cursor-pointer tabular-nums ${
                      selected
                        ? 'bg-emerald-700 text-white border-emerald-900'
                        : idx < difficultyIndex
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 border-emerald-400/60 hover:bg-emerald-200'
                          : 'bg-white dark:bg-[#1E1D1A] text-stone-700 dark:text-stone-300 border-stone-300 dark:border-[#3E3D38] hover:bg-stone-100 dark:hover:bg-[#2A2925]'
                    }`}
                  >
                    {lvl.level}
                  </button>
                );
              })}
            </div>

            <p className="font-serif text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
              {currentPreset.description}
            </p>
          </div>

          {/* Modificadores Finos de Regras */}
          <div className="space-y-3 pt-1 border-t border-stone-200 dark:border-[#2E2D28] font-mono text-xs">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="font-bold text-[#141414] dark:text-stone-100 block">
                  Velocidade / Pontuação
                </span>
                <span className="text-[11px] text-stone-600 dark:text-stone-400 tabular-nums">
                  {speedMovesPerSec} mov/s ({currentPreset.tickMs}ms) · {currentPreset.multiplier}x pts
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200 dark:border-[#2E2D28]">
              <div>
                <span className="font-bold text-[#141414] dark:text-stone-100 block">
                  Paredes da Arena
                </span>
                <span className="text-[11px] text-stone-600 dark:text-stone-400">
                  {customSolidWalls ? 'Sólidas (colisão encerra)' : 'Abertas (atravessa bordas)'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleWalls}
                className={`px-3 py-1.5 border font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                  customSolidWalls
                    ? 'bg-red-700 text-white border-red-900'
                    : 'bg-emerald-700 text-white border-emerald-900'
                }`}
              >
                {customSolidWalls ? 'Sólidas' : 'Abertas'}
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200 dark:border-[#2E2D28]">
              <div>
                <span className="font-bold text-[#141414] dark:text-stone-100 block">
                  Obstáculos na Arena
                </span>
                <span className="text-[11px] text-stone-600 dark:text-stone-400 tabular-nums">
                  {customObstaclesCount} {customObstaclesCount === 1 ? 'bloco ativo' : 'blocos ativos'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAdjustObstacles(-2)}
                  disabled={customObstaclesCount <= 0}
                  aria-label="Remover obstáculos"
                  className="px-2.5 py-1.5 border border-[#141414] dark:border-[#3E3D38] bg-[#F8F7F4] dark:bg-[#242320] text-[#141414] dark:text-stone-100 font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  −2
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustObstacles(2)}
                  disabled={customObstaclesCount >= 20}
                  aria-label="Adicionar obstáculos"
                  className="px-2.5 py-1.5 border border-[#141414] dark:border-[#3E3D38] bg-[#F8F7F4] dark:bg-[#242320] text-[#141414] dark:text-stone-100 font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  +2
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Guia de Teclado */}
        <section className="bg-[#FAF9F5] dark:bg-[#161614] border-2 border-[#141414] dark:border-[#3E3D38] p-5 space-y-3">
          <h4 className="font-editorial text-lg font-bold text-[#141414] dark:text-stone-100">
            Controles de Teclado e Toque
          </h4>
          <div className="space-y-2 font-mono text-xs text-stone-700 dark:text-stone-300">
            <div className="flex items-center justify-between gap-2">
              <span>Mover a cobrinha</span>
              <span className="font-bold text-[#141414] dark:text-stone-100">
                W A S D ou Setas (↑ ↓ ← →)
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Pausar / Retomar</span>
              <span className="font-bold text-[#141414] dark:text-stone-100">
                Espaço · P · Esc
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Adicionar / Remover dificuldade</span>
              <span className="font-bold text-[#141414] dark:text-stone-100">
                + / −
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Celular / Tablet</span>
              <span className="font-bold text-[#141414] dark:text-stone-100">
                Deslize na arena ou use os botões
              </span>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
