import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RotateCcw,
  Palette,
  ShieldCheck,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Clock,
  Sparkles,
  Zap,
  Lock,
  Unlock,
  AlertTriangle,
  X,
} from 'lucide-react';

export interface MazeRecaptchaProps {
  onSuccess: (token: string) => void;
  onInstantLogin?: () => void;
  autoEnterDelay?: number; // milliseconds before auto-entering site, or 0 to disable
  compact?: boolean;
  actionButtonText?: string;
  isGoogleAction?: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface ColorTheme {
  name: string;
  bgColor: string;
  borderColor: string;
  wallColor: string;
  pathColor: string;
  playerColor: string;
  startColor: string;
  startBorderColor: string;
  endColor: string;
  endBorderColor: string;
}

const COLOR_THEMES: ColorTheme[] = [
  {
    name: 'Azul Ciano',
    bgColor: '#1e232a',
    borderColor: '#61dafb',
    wallColor: '#61dafb',
    pathColor: '#121519',
    playerColor: '#e0b0ff',
    startColor: '#4CAF50',
    startBorderColor: '#388E3C',
    endColor: '#f44336',
    endBorderColor: '#D32F2F',
  },
  {
    name: 'Verde Floresta',
    bgColor: '#1a2923',
    borderColor: '#6cc091',
    wallColor: '#6cc091',
    pathColor: '#101c16',
    playerColor: '#d1f0c4',
    startColor: '#A5D6A7',
    startBorderColor: '#66BB6A',
    endColor: '#FF8A65',
    endBorderColor: '#FF5722',
  },
  {
    name: 'Roxo Noturno',
    bgColor: '#2a1f3d',
    borderColor: '#b37dd9',
    wallColor: '#b37dd9',
    pathColor: '#1b1328',
    playerColor: '#f3e5f5',
    startColor: '#81C784',
    startBorderColor: '#4CAF50',
    endColor: '#EF9A9A',
    endBorderColor: '#E57373',
  },
  {
    name: 'Laranja Crepúsculo',
    bgColor: '#33231a',
    borderColor: '#ffa726',
    wallColor: '#ffa726',
    pathColor: '#20150e',
    playerColor: '#ffe0b2',
    startColor: '#FFD54F',
    startBorderColor: '#FFC107',
    endColor: '#FF7043',
    endBorderColor: '#F4511E',
  },
];

export const MazeRecaptcha: React.FC<MazeRecaptchaProps> = ({
  onSuccess,
  onInstantLogin,
  autoEnterDelay = 0,
  compact = false,
  actionButtonText = 'Entrar com a Conta Google',
  isGoogleAction = true,
}) => {
  // Configuração de tempo mínimo de segurança anti-robô
  const MIN_REQUIRED_SECONDS = 15;

  // Grid settings: 11 rows x 17 columns (odd numbers required for DFS)
  const rows = compact ? 9 : 11;
  const cols = compact ? 15 : 17;

  const [maze, setMaze] = useState<number[][]>([]);
  const [numRows, setNumRows] = useState(rows);
  const [numCols, setNumCols] = useState(cols);
  const [playerPos, setPlayerPos] = useState<Point>({ x: 1, y: 1 });
  const [startPos, setStartPos] = useState<Point>({ x: 1, y: 1 });
  const [endPos, setEndPos] = useState<Point>({ x: 1, y: 1 });
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);

  const [gameActive, setGameActive] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [movesCount, setMovesCount] = useState(0);
  const [autoEnterCountdown, setAutoEnterCountdown] = useState<number | null>(null);
  const [blockedNotice, setBlockedNotice] = useState<string | null>(null);

  // References
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<Point>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastMoveTimeRef = useRef(0);

  const currentTheme = COLOR_THEMES[currentThemeIndex];

  // Sound effects via Web Audio API
  const playSound = useCallback((type: 'move' | 'win' | 'bump') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'move') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(580, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'win') {
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
        osc.frequency.setValueAtTime(1046.5, now + 0.3); // C6
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'bump') {
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      }
    } catch {
      // Audio not supported or blocked, ignore
    }
  }, []);

  // DFS Maze Generation based on user's code
  const generateMazeGrid = useCallback((r: number, c: number) => {
    const actualRows = r % 2 === 0 ? r + 1 : r;
    const actualCols = c % 2 === 0 ? c + 1 : c;

    const newMaze = Array(actualRows)
      .fill(0)
      .map(() => Array(actualCols).fill(1));

    const startRow = 1;
    const startCol = 1;
    const stack: [number, number][] = [[startRow, startCol]];
    newMaze[startRow][startCol] = 0;

    while (stack.length > 0) {
      const [currentRow, currentCol] = stack[stack.length - 1];
      const neighbors: [number, number][] = [];

      // Cima
      if (currentRow - 2 > 0 && newMaze[currentRow - 2][currentCol] === 1) {
        neighbors.push([currentRow - 2, currentCol]);
      }
      // Baixo
      if (currentRow + 2 < actualRows - 1 && newMaze[currentRow + 2][currentCol] === 1) {
        neighbors.push([currentRow + 2, currentCol]);
      }
      // Esquerda
      if (currentCol - 2 > 0 && newMaze[currentRow][currentCol - 2] === 1) {
        neighbors.push([currentRow, currentCol - 2]);
      }
      // Direita
      if (currentCol + 2 < actualCols - 1 && newMaze[currentRow][currentCol + 2] === 1) {
        neighbors.push([currentRow, currentCol + 2]);
      }

      if (neighbors.length > 0) {
        const [nextRow, nextCol] = neighbors[Math.floor(Math.random() * neighbors.length)];
        newMaze[nextRow][nextCol] = 0;
        newMaze[currentRow + (nextRow - currentRow) / 2][currentCol + (nextCol - currentCol) / 2] = 0;
        stack.push([nextRow, nextCol]);
      } else {
        stack.pop();
      }
    }

    const sPos: Point = { x: 1, y: 1 };
    newMaze[sPos.y][sPos.x] = 0;

    // Pick an end position far from start
    let ePos: Point = { x: actualCols - 2, y: actualRows - 2 };
    let foundEnd = false;
    let attempts = 0;

    while (!foundEnd && attempts < 100) {
      attempts++;
      const randY = Math.floor(Math.random() * (actualRows - 2)) + 1;
      const randX = Math.floor(Math.random() * (actualCols - 2)) + 1;
      const dist = Math.abs(randY - sPos.y) + Math.abs(randX - sPos.x);

      if (newMaze[randY][randX] === 0 && dist >= (actualRows + actualCols) / 2.5) {
        ePos = { x: randX, y: randY };
        foundEnd = true;
      }
    }

    newMaze[ePos.y][ePos.x] = 0;

    return {
      mazeData: newMaze,
      rows: actualRows,
      cols: actualCols,
      start: sPos,
      end: ePos,
    };
  }, []);

  // Initialize or restart game
  const initGame = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    const generated = generateMazeGrid(rows, cols);
    setMaze(generated.mazeData);
    setNumRows(generated.rows);
    setNumCols(generated.cols);
    setStartPos(generated.start);
    setEndPos(generated.end);
    setPlayerPos(generated.start);

    setElapsedSeconds(0);
    setMovesCount(0);
    setHasWon(false);
    setAutoEnterCountdown(null);
    setGameActive(true);

    // Start timer
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, [generateMazeGrid, rows, cols]);

  useEffect(() => {
    initGame();
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [initGame]);

  // Handle movements
  const movePlayer = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      if (!gameActive || hasWon) return;

      let newX = playerPos.x;
      let newY = playerPos.y;

      switch (direction) {
        case 'up':
          newY--;
          break;
        case 'down':
          newY++;
          break;
        case 'left':
          newX--;
          break;
        case 'right':
          newX++;
          break;
      }

      // Check boundary and wall collision
      if (
        newX >= 0 &&
        newX < numCols &&
        newY >= 0 &&
        newY < numRows &&
        maze[newY] &&
        maze[newY][newX] === 0
      ) {
        setPlayerPos({ x: newX, y: newY });
        setMovesCount((m) => m + 1);
        playSound('move');

        // Check victory!
        if (newX === endPos.x && newY === endPos.y) {
          // Bloqueio de segurança estrito: se concluído em menos de 15 segundos, bloqueia por comportamento automatizado/bot
          if (elapsedSeconds < MIN_REQUIRED_SECONDS) {
            playSound('bump');
            const secondsSpent = elapsedSeconds;
            setBlockedNotice(
              `⚠️ Bloqueio de Segurança Anti-Robô: O labirinto foi completado em apenas ${secondsSpent}s! Para assegurar a resolução por um operador humano autêntico e repelir scripts automatizados, o teste exige no mínimo ${MIN_REQUIRED_SECONDS} segundos. O labirinto foi reiniciado.`
            );
            // Reinicia o labirinto e o cronômetro para exigir um teste humano completo
            initGame();
            return;
          }

          setBlockedNotice(null);
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          setGameActive(false);
          setHasWon(true);
          playSound('win');

          const token = `maze_recaptcha_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
          onSuccess(token);

          // Handle direct site entry countdown if supported
          if (onInstantLogin && autoEnterDelay > 0) {
            let count = Math.ceil(autoEnterDelay / 1000);
            setAutoEnterCountdown(count);

            countdownIntervalRef.current = setInterval(() => {
              count--;
              if (count <= 0) {
                if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                onInstantLogin();
              } else {
                setAutoEnterCountdown(count);
              }
            }, 1000);
          }
        }
      } else {
        playSound('bump');
      }
    },
    [gameActive, hasWon, playerPos, numCols, numRows, maze, endPos, onSuccess, onInstantLogin, autoEnterDelay, playSound]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameActive || hasWon) return;

      let handled = false;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          movePlayer('up');
          handled = true;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          movePlayer('down');
          handled = true;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          movePlayer('left');
          handled = true;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          movePlayer('right');
          handled = true;
          break;
      }

      if (handled) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameActive, hasWon, movePlayer]);

  // Touch and Swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!gameActive || hasWon) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    isDraggingRef.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!gameActive || hasWon || !isDraggingRef.current) return;
    isDraggingRef.current = false;

    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;
    const threshold = 15;

    const now = Date.now();
    if (now - lastMoveTimeRef.current < 90) return;
    lastMoveTimeRef.current = now;

    if (Math.abs(diffX) < threshold && Math.abs(diffY) < threshold) return;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      movePlayer(diffX > 0 ? 'right' : 'left');
    } else {
      movePlayer(diffY > 0 ? 'down' : 'up');
    }
  };

  // Mouse drag handler for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!gameActive || hasWon) return;
    touchStartRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = true;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!gameActive || hasWon || !isDraggingRef.current) return;
    isDraggingRef.current = false;

    const diffX = e.clientX - touchStartRef.current.x;
    const diffY = e.clientY - touchStartRef.current.y;
    const threshold = 18;

    if (Math.abs(diffX) < threshold && Math.abs(diffY) < threshold) return;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      movePlayer(diffX > 0 ? 'right' : 'left');
    } else {
      movePlayer(diffY > 0 ? 'down' : 'up');
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
  };

  const cycleTheme = () => {
    setCurrentThemeIndex((prev) => (prev + 1) % COLOR_THEMES.length);
  };

  return (
    <div className="w-full flex flex-col items-center select-none font-sans">
      {/* Header Info Panel */}
      <div className="w-full max-w-md flex items-center justify-between px-3 py-2 bg-slate-900 text-white rounded-t-xl border border-slate-700 text-xs shadow-md">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-400" />
          <span className="font-bold tracking-wide text-slate-200">
            reCAPTCHA Labirinto
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className={`flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded border transition-colors ${
              elapsedSeconds < MIN_REQUIRED_SECONDS
                ? 'text-amber-300 bg-amber-950/40 border-amber-400/30'
                : 'text-emerald-300 bg-emerald-950/40 border-emerald-400/30 font-bold'
            }`}
            title={
              elapsedSeconds < MIN_REQUIRED_SECONDS
                ? `Regra Anti-Robô: faltam ${MIN_REQUIRED_SECONDS - elapsedSeconds}s para autorizar a validação humana`
                : 'Tempo mínimo de 15s alcançado! Você já pode alcançar o ponto final (F).'
            }
          >
            <Clock size={12} />
            <span>{formatTime(elapsedSeconds)}</span>
            <span className="text-[10px] opacity-70">/ {MIN_REQUIRED_SECONDS}s</span>
            {elapsedSeconds < MIN_REQUIRED_SECONDS ? (
              <Lock size={11} className="text-amber-400" />
            ) : (
              <Unlock size={11} className="text-emerald-400" />
            )}
          </div>

          <button
            type="button"
            onClick={cycleTheme}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title={`Tema atual: ${currentTheme.name}. Clique para alternar.`}
          >
            <Palette size={14} />
          </button>

          <button
            type="button"
            onClick={() => {
              setBlockedNotice(null);
              initGame();
            }}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Reiniciar labirinto"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Aviso de Bloqueio se concluído em menos de 15 segundos */}
      {blockedNotice && (
        <div className="w-full max-w-md my-1 p-2.5 rounded-md bg-rose-950/95 border border-rose-500/70 text-rose-100 text-xs flex items-start gap-2 shadow-lg animate-in fade-in slide-in-from-top-1">
          <AlertTriangle size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-[11px] leading-tight text-rose-200">
              {blockedNotice}
            </p>
            <p className="text-[10px] text-rose-300/80 mt-1">
              💡 <strong>Dica de Segurança:</strong> Percorra o caminho com calma para que o cronômetro ultrapasse <strong>15 segundos</strong> antes de atingir o ponto final <strong>F</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setBlockedNotice(null)}
            className="text-rose-400 hover:text-white p-1 rounded hover:bg-rose-900/60 cursor-pointer"
            aria-label="Fechar aviso"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Main Maze Canvas / Grid Board */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        style={{
          backgroundColor: currentTheme.bgColor,
          borderColor: currentTheme.borderColor,
        }}
        className="relative w-full max-w-md border-2 p-2 sm:p-3 overflow-hidden shadow-inner flex flex-col items-center justify-center transition-colors duration-300"
      >
        {/* Dynamic Maze Grid */}
        <div
          className="relative inline-grid rounded overflow-hidden shadow-lg border border-black/50"
          style={{
            gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))`,
            backgroundColor: currentTheme.pathColor,
            width: '100%',
            maxWidth: '360px',
            aspectRatio: `${numCols} / ${numRows}`,
          }}
        >
          {maze.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              const isStart = rIdx === startPos.y && cIdx === startPos.x;
              const isEnd = rIdx === endPos.y && cIdx === endPos.x;
              const isPlayer = rIdx === playerPos.y && cIdx === playerPos.x;

              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className="relative flex items-center justify-center transition-colors duration-200"
                  style={{
                    backgroundColor:
                      cell === 1 ? currentTheme.wallColor : currentTheme.pathColor,
                  }}
                >
                  {/* Start Point Marker */}
                  {isStart && (
                    <div
                      style={{
                        backgroundColor: currentTheme.startColor,
                        borderColor: currentTheme.startBorderColor,
                      }}
                      className="w-[85%] h-[85%] rounded-full border flex items-center justify-center text-[7px] sm:text-[8px] font-bold text-white shadow-xs z-10 leading-none select-none pointer-events-none"
                    >
                      I
                    </div>
                  )}

                  {/* End Point Marker */}
                  {isEnd && (
                    <div
                      style={{
                        backgroundColor: currentTheme.endColor,
                        borderColor: currentTheme.endBorderColor,
                      }}
                      className="w-[85%] h-[85%] rounded-full border flex items-center justify-center text-[7px] sm:text-[8px] font-bold text-white shadow-xs z-10 leading-none animate-pulse select-none pointer-events-none"
                    >
                      F
                    </div>
                  )}

                  {/* Player Dot */}
                  {isPlayer && (
                    <div
                      style={{
                        backgroundColor: currentTheme.playerColor,
                        boxShadow: `0 0 8px ${currentTheme.playerColor}`,
                      }}
                      className="w-[90%] h-[90%] rounded-full border-2 border-white shadow-md z-20 transition-transform scale-105 duration-75"
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Legend / Status bar */}
        <div className="w-full flex items-center justify-between text-[10px] text-slate-300 mt-2 px-1">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block border"
              style={{
                backgroundColor: currentTheme.startColor,
                borderColor: currentTheme.startBorderColor,
              }}
            />
            <span>Início (Verde)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block border"
              style={{
                backgroundColor: currentTheme.playerColor,
                borderColor: '#ffffff',
              }}
            />
            <span className="font-semibold text-white">Você (Roxo)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block border"
              style={{
                backgroundColor: currentTheme.endColor,
                borderColor: currentTheme.endBorderColor,
              }}
            />
            <span>Fim (Vermelho)</span>
          </div>
        </div>

        {/* Anti-Bot Security Status Bar */}
        <div className="w-full mt-2 px-2.5 py-1.5 rounded-lg bg-black/60 border border-slate-700/80 flex items-center justify-between text-[10px] shadow-xs">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={13} className={elapsedSeconds >= MIN_REQUIRED_SECONDS ? 'text-emerald-400' : 'text-amber-400'} />
            <span className="text-slate-300 font-medium">Anti-Robô:</span>
            <span className="font-mono text-slate-100 font-semibold">Mínimo 15 segundos</span>
          </div>

          {elapsedSeconds < MIN_REQUIRED_SECONDS ? (
            <span className="text-amber-300 font-mono font-medium flex items-center gap-1">
              <Lock size={10} />
              Aguarde {MIN_REQUIRED_SECONDS - elapsedSeconds}s para validar
            </span>
          ) : (
            <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
              <Unlock size={10} />
              Tempo validado ({elapsedSeconds}s) ✓
            </span>
          )}
        </div>

        {/* Victory Overlay Modal */}
        {hasWon && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center text-white z-30 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mb-2 animate-bounce">
              <CheckCircle2 size={28} />
            </div>

            <h4 className="text-base font-bold text-white mb-0.5 flex items-center gap-1.5">
              <Sparkles size={16} className="text-amber-400" />
              <span>Desafio Concluído • Google Liberado!</span>
            </h4>

            <p className="text-xs text-slate-300 max-w-xs mb-3">
              Você provou ser humano em <strong>{formatTime(elapsedSeconds)}</strong> com{' '}
              <strong>{movesCount}</strong> movimentos (tempo de segurança anti-robô de no mínimo 15 segundos cumprido com sucesso!). O acesso com a Conta Google foi desbloqueado!
            </p>

            {onInstantLogin ? (
              <div className="space-y-2 w-full max-w-xs">
                <button
                  type="button"
                  onClick={onInstantLogin}
                  className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2.5 shadow-xl transition active:scale-98 cursor-pointer border border-slate-200"
                >
                  {isGoogleAction ? (
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27A7.19 7.19 0 0 1 4.9 12c0-.79.14-1.57.38-2.27V6.58H1.25A11.96 11.96 0 0 0 0 12c0 1.92.45 3.74 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                  ) : (
                    <Unlock size={14} className="text-emerald-600" />
                  )}
                  <span>
                    {actionButtonText}{' '}
                    {autoEnterCountdown !== null ? `(${autoEnterCountdown}s)` : ''}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={initGame}
                  className="text-[11px] text-slate-400 hover:text-white underline block mx-auto pt-1 cursor-pointer"
                >
                  Jogar outro labirinto
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-700/60">
                <ShieldCheck size={14} />
                <span>reCAPTCHA Validado • Conta Google Desbloqueada!</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interactive Directional Controls (Touch D-Pad & Key Hints) */}
      <div className="w-full max-w-md bg-slate-900 text-slate-200 p-3 rounded-b-xl border border-t-0 border-slate-700 flex flex-col items-center gap-2">
        <div className="text-[11px] text-slate-400 text-center">
          💡 Use as <strong>setas do teclado</strong>, <strong>WASD</strong>,{' '}
          <strong>arraste na tela</strong> ou os botões direcionais abaixo:
        </div>

        {/* D-Pad controls */}
        <div className="grid grid-cols-3 gap-1.5 w-36">
          <div />
          <button
            type="button"
            onClick={() => movePlayer('up')}
            disabled={!gameActive || hasWon}
            aria-label="Mover para cima"
            className="p-2 bg-slate-800 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg flex items-center justify-center border border-slate-700 shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <ArrowUp size={16} />
          </button>
          <div />

          <button
            type="button"
            onClick={() => movePlayer('left')}
            disabled={!gameActive || hasWon}
            aria-label="Mover para esquerda"
            className="p-2 bg-slate-800 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg flex items-center justify-center border border-slate-700 shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>

          <button
            type="button"
            onClick={() => movePlayer('down')}
            disabled={!gameActive || hasWon}
            aria-label="Mover para baixo"
            className="p-2 bg-slate-800 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg flex items-center justify-center border border-slate-700 shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <ArrowDown size={16} />
          </button>

          <button
            type="button"
            onClick={() => movePlayer('right')}
            disabled={!gameActive || hasWon}
            aria-label="Mover para direita"
            className="p-2 bg-slate-800 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg flex items-center justify-center border border-slate-700 shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
