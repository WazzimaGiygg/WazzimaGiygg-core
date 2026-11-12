import React, { useState, useEffect, useRef } from 'react';
import { Check, ShieldCheck, AlertCircle, Gamepad2 } from 'lucide-react';
import { MazeRecaptcha } from './MazeRecaptcha';

interface RecaptchaWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  isVerified: boolean;
  setIsVerified: (verified: boolean) => void;
  error?: string | null;
}

export const RecaptchaWidget: React.FC<RecaptchaWidgetProps> = ({
  onVerify,
  onExpire,
  isVerified,
  setIsVerified,
  error,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Expiration timer (2 minutes as in standard reCAPTCHA)
  useEffect(() => {
    if (isVerified) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setIsVerified(false);
        setToken(null);
        if (onExpire) onExpire();
      }, 120000); // 2 minutes
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isVerified, setIsVerified, onExpire]);

  const handleCheckboxClick = () => {
    if (isVerified || isVerifying) return;
    // Always open the maze challenge to let the user play and solve!
    setShowChallenge(true);
  };

  const handleMazeSuccess = (generatedToken: string) => {
    setShowChallenge(false);
    setIsVerifying(false);
    setToken(generatedToken);
    setIsVerified(true);
    onVerify(generatedToken);
  };

  return (
    <div className="flex flex-col items-center select-none">
      {/* reCAPTCHA v2 Box (Dimension: ~302px x ~76px) */}
      <div
        className={`w-full max-w-[320px] bg-slate-50 dark:bg-slate-800/90 border rounded-sm p-3 flex items-center justify-between shadow-xs transition ${
          error && !isVerified
            ? 'border-red-500 ring-2 ring-red-400/20'
            : isVerified
            ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400'
        }`}
      >
        {/* Left: Checkbox + Label */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCheckboxClick}
            disabled={isVerified || isVerifying}
            className={`w-7 h-7 rounded-[2px] flex items-center justify-center transition border ${
              isVerified
                ? 'bg-emerald-600 border-emerald-600 text-white cursor-default'
                : isVerifying
                ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 cursor-wait'
                : 'bg-white dark:bg-slate-900 border-slate-400 dark:border-slate-600 hover:border-blue-500 cursor-pointer shadow-inner'
            }`}
            aria-label="Verificação reCAPTCHA Desafio do Labirinto"
          >
            {isVerified ? (
              <Check size={18} className="stroke-[3] animate-in zoom-in-50 duration-200" />
            ) : isVerifying ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Gamepad2 size={13} className="text-slate-400" />
            )}
          </button>

          <div>
            <label
              onClick={handleCheckboxClick}
              className={`text-xs font-medium cursor-pointer transition ${
                isVerified
                  ? 'text-emerald-700 dark:text-emerald-300 font-semibold'
                  : 'text-slate-800 dark:text-slate-200 hover:text-blue-600'
              }`}
            >
              {isVerified ? 'Labirinto Concluído ✓' : 'Resolver Desafio do Labirinto'}
            </label>
            {isVerified && token && (
              <span className="block text-[9px] font-mono text-slate-400 truncate max-w-[140px]">
                Token: {token.substring(0, 16)}...
              </span>
            )}
          </div>
        </div>

        {/* Right: Google reCAPTCHA Badge */}
        <div className="flex flex-col items-center justify-center text-right pl-2 border-l border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-1">
            <svg
              className="w-8 h-8"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M44 24C44 35.0457 35.0457 44 24 44C12.9543 44 4 35.0457 4 24C4 12.9543 12.9543 4 24 4"
                stroke="#4285F4"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M24 4C30.6274 4 36.4274 7.22183 40 12.2"
                stroke="#34A853"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M4 24C4 18.4772 6.23858 13.4772 9.85786 9.85786"
                stroke="#FBBC05"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M24 16L32 24L24 32"
                stroke="#EA4335"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 tracking-tight leading-none mt-0.5">
            reCAPTCHA
          </span>
          <div className="text-[8px] text-slate-400 dark:text-slate-500 mt-0.5 space-x-1 font-sans">
            <button
              type="button"
              onClick={() => setShowChallenge(true)}
              className="hover:underline hover:text-blue-600 text-blue-500"
            >
              Labirinto
            </button>
            <span>•</span>
            <span className="text-slate-400">v2 Maze</span>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && !isVerified && (
        <div className="w-full max-w-[320px] mt-1.5 text-left flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400 animate-in fade-in">
          <AlertCircle size={12} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success hint */}
      {isVerified && (
        <div className="w-full max-w-[320px] mt-1 text-right text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-end gap-1">
          <ShieldCheck size={11} />
          <span>Humano verificado com sucesso</span>
        </div>
      )}

      {/* Maze Challenge Modal */}
      {showChallenge && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Gamepad2 size={18} className="text-blue-400" />
                <h4 className="text-sm font-bold text-white">Desafio do Labirinto</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowChallenge(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-slate-800 cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-3">
              Guie o ponto do início até o final para verificar que é humano e liberar o acesso.
            </p>

            <MazeRecaptcha
              onSuccess={handleMazeSuccess}
              compact={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};
