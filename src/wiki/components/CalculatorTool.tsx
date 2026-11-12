import React, { useState, useEffect } from 'react';
import {
  Calculator,
  History,
  Copy,
  Check,
  Trash2,
} from 'lucide-react';
import { AppTheme } from '../types';

export interface CalculationHistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: string;
}

export interface CalculatorToolProps {
  theme?: AppTheme;
  standalone?: boolean;
}

export const CalculatorTool: React.FC<CalculatorToolProps> = () => {
  const [display, setDisplay] = useState<string>('0');
  const [expression, setExpression] = useState<string>('');
  const [history, setHistory] = useState<CalculationHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('wikizero_calc_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isScientific, setIsScientific] = useState<boolean>(false);
  const [memory, setMemory] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('wikizero_calc_history', JSON.stringify(history.slice(0, 30)));
    } catch {}
  }, [history]);

  // Manipulação de cliques e botões
  const handleDigit = (digit: string) => {
    if (display === '0' || display === 'Erro') {
      setDisplay(digit);
    } else {
      setDisplay(display + digit);
    }
  };

  const handleDecimal = () => {
    if (display === 'Erro') {
      setDisplay('0.');
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOperator = (op: string) => {
    if (display === 'Erro') return;
    setExpression(`${display} ${op} `);
    setDisplay('0');
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
  };

  const handleBackspace = () => {
    if (display === 'Erro' || display.length <= 1) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const handleToggleSign = () => {
    if (display === '0' || display === 'Erro') return;
    if (display.startsWith('-')) {
      setDisplay(display.slice(1));
    } else {
      setDisplay('-' + display);
    }
  };

  const handlePercentage = () => {
    if (display === 'Erro') return;
    const num = parseFloat(display);
    if (!isNaN(num)) {
      setDisplay((num / 100).toString());
    }
  };

  const handleCalculate = () => {
    if (!expression && display === '0') return;
    try {
      const fullExpr = expression ? `${expression} ${display}` : display;
      // Substituição segura de operadores visuais
      const sanitized = fullExpr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/\^/g, '**');

      // Avaliação com Function segura para aritmética
      // eslint-disable-next-line no-new-func
      const calcResult = Function(`'use strict'; return (${sanitized})`)();

      if (typeof calcResult === 'number' && !isNaN(calcResult) && isFinite(calcResult)) {
        // Formata resultado limitando casas decimais
        const formattedResult = Number.isInteger(calcResult)
          ? calcResult.toString()
          : parseFloat(calcResult.toFixed(8)).toString();

        const newItem: CalculationHistoryItem = {
          id: Date.now().toString(),
          expression: fullExpr,
          result: formattedResult,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };

        setHistory((prev) => [newItem, ...prev]);
        setDisplay(formattedResult);
        setExpression('');
      } else {
        setDisplay('Erro');
      }
    } catch {
      setDisplay('Erro');
    }
  };

  // Funções científicas
  const handleScientificOp = (fn: string) => {
    const num = parseFloat(display);
    if (isNaN(num)) return;
    let res = 0;
    switch (fn) {
      case 'sqrt':
        if (num < 0) {
          setDisplay('Erro');
          return;
        }
        res = Math.sqrt(num);
        break;
      case 'sqr':
        res = Math.pow(num, 2);
        break;
      case 'cube':
        res = Math.pow(num, 3);
        break;
      case 'sin':
        res = Math.sin((num * Math.PI) / 180);
        break;
      case 'cos':
        res = Math.cos((num * Math.PI) / 180);
        break;
      case 'tan':
        res = Math.tan((num * Math.PI) / 180);
        break;
      case 'log':
        if (num <= 0) {
          setDisplay('Erro');
          return;
        }
        res = Math.log10(num);
        break;
      case 'ln':
        if (num <= 0) {
          setDisplay('Erro');
          return;
        }
        res = Math.log(num);
        break;
      case 'pi':
        res = Math.PI;
        break;
      case 'e':
        res = Math.E;
        break;
      case 'inv':
        if (num === 0) {
          setDisplay('Erro');
          return;
        }
        res = 1 / num;
        break;
      default:
        return;
    }
    const formatted = parseFloat(res.toFixed(8)).toString();
    setDisplay(formatted);
  };

  // Funções de memória
  const handleMemory = (op: 'MC' | 'MR' | 'M+' | 'M-') => {
    const num = parseFloat(display) || 0;
    switch (op) {
      case 'MC':
        setMemory(0);
        break;
      case 'MR':
        setDisplay(memory.toString());
        break;
      case 'M+':
        setMemory((prev) => prev + num);
        break;
      case 'M-':
        setMemory((prev) => prev - num);
        break;
    }
  };

  const handleCopyResult = () => {
    navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Suporte a teclado físico na calculadora
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se estiver focando em inputs de texto
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === '.' || e.key === ',') {
        handleDecimal();
      } else if (e.key === '+') {
        handleOperator('+');
      } else if (e.key === '-') {
        handleOperator('−');
      } else if (e.key === '*' || e.key === 'x') {
        handleOperator('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleCalculate();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      } else if (e.key === '%') {
        handlePercentage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Corpo da Calculadora */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calculator className="text-blue-600 dark:text-blue-400" size={20} />
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base font-serif-heading">
                Calculadora Multiuso
              </h3>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider">
                Extensão de Ferramenta (WikiCalculatorTool)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsScientific(!isScientific)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                isScientific
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {isScientific ? 'Modo Científico Ativo' : 'Científica'}
            </button>
            <button
              onClick={handleCopyResult}
              title="Copiar resultado"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Visor */}
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 mb-5 text-right font-mono select-all overflow-hidden">
          <div className="text-xs text-slate-400 dark:text-slate-500 h-5 truncate tracking-wider">
            {expression || '\u00A0'}
          </div>
          <div className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate mt-1">
            {display}
          </div>
          {memory !== 0 && (
            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1">
              M = {memory}
            </div>
          )}
        </div>

        {/* Barra de Memória */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {(['MC', 'MR', 'M+', 'M-'] as const).map((mOp) => (
            <button
              key={mOp}
              onClick={() => handleMemory(mOp)}
              className="py-1.5 text-xs font-mono font-semibold rounded-lg bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            >
              {mOp}
            </button>
          ))}
        </div>

        {/* Botões Científicos Opcionais */}
        {isScientific && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-3 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40 animate-in fade-in duration-200">
            {[
              { label: '√x', op: 'sqrt' },
              { label: 'x²', op: 'sqr' },
              { label: 'x³', op: 'cube' },
              { label: '1/x', op: 'inv' },
              { label: 'sin', op: 'sin' },
              { label: 'cos', op: 'cos' },
              { label: 'tan', op: 'tan' },
              { label: 'log₁₀', op: 'log' },
              { label: 'ln', op: 'ln' },
              { label: 'π', op: 'pi' },
              { label: 'e', op: 'e' },
              { label: '(', op: 'parenL', disabled: true },
            ].map((btn) => (
              <button
                key={btn.label}
                disabled={btn.disabled}
                onClick={() => handleScientificOp(btn.op)}
                className="py-2 text-xs font-mono font-bold rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 shadow-xs transition disabled:opacity-40"
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* Grade de Teclas Principal */}
        <div className="grid grid-cols-4 gap-2.5">
          {/* Linha 1 */}
          <button
            onClick={handleClear}
            className="py-3.5 text-sm font-bold rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/80 transition"
          >
            AC
          </button>
          <button
            onClick={handleBackspace}
            className="py-3.5 text-sm font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Apagar último dígito (Backspace)"
          >
            ⌫
          </button>
          <button
            onClick={handlePercentage}
            className="py-3.5 text-sm font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            %
          </button>
          <button
            onClick={() => handleOperator('÷')}
            className="py-3.5 text-lg font-bold rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition"
          >
            ÷
          </button>

          {/* Linha 2 */}
          <button
            onClick={() => handleDigit('7')}
            className="py-3.5 text-lg font-bold rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition shadow-xs"
          >
            7
          </button>
          <button
            onClick={() => handleDigit('8')}
            className="py-3.5 text-lg font-bold rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition shadow-xs"
          >
            8
          </button>
          <button
            onClick={() => handleDigit('9')}
            className="py-3.5 text-lg font-bold rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition shadow-xs"
          >
            9
          </button>
          <button
            onClick={() => handleOperator('×')}
            className="py-3.5 text-lg font-bold rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition"
          >
            ×
          </button>

          {/* Linha 3 */}
          <button
            onClick={() => handleDigit('4')}
            className="py-3.5 text-lg font-bold rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition shadow-xs"
          >
            4
          </button>
          <button
            onClick={() => handleDigit('5')}
            className="py-3.5 text-lg font-bold rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition shadow-xs"
          >
            5
          </button>
          <button
            onClick={() => handleDigit('6')}
            className="py-3.5 text-lg font-bold rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition shadow-xs"
          >
            6
          </button>
          <button
            onClick={() => handleOperator('−')}
            className="py-3.5 text-lg font-bold rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition"
          >
            −
          </button>

          {/* Linha 4 */}
          <button
            onClick={() => handleDigit('1')}
            className="py-3.5 text-lg font-bold rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition shadow-xs"
          >
            1
          </button>
          <button
            onClick={() => handleDigit('2')}
            className="py-3.5 text-lg font-bold rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition shadow-xs"
          >
            2
          </button>
          <button
            onClick={() => handleDigit('3')}
            className="py-3.5 text-lg font-bold rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition shadow-xs"
          >
            3
          </button>
          <button
            onClick={() => handleOperator('+')}
            className="py-3.5 text-lg font-bold rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition"
          >
            +
          </button>

          {/* Linha 5 */}
          <button
            onClick={handleToggleSign}
            className="py-3.5 text-sm font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            ±
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="py-3.5 text-lg font-bold rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition shadow-xs"
          >
            0
          </button>
          <button
            onClick={handleDecimal}
            className="py-3.5 text-lg font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            ,
          </button>
          <button
            onClick={handleCalculate}
            className="py-3.5 text-lg font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition active:scale-98"
          >
            =
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Dica: Use o teclado numérico do seu computador diretamente.</span>
          <span className="font-mono">Enter: = | Esc: AC</span>
        </div>
      </div>

      {/* Painel Lateral de Histórico */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col h-[460px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 text-sm">
            <History size={16} className="text-blue-500" />
            <span>Histórico de Contas</span>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => setHistory([])}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              title="Limpar Histórico"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-1">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
              <Calculator size={32} className="opacity-20 mb-2" />
              <p>Nenhuma conta recente realizada.</p>
              <p className="text-[10px] text-slate-400 mt-1">Os cálculos feitos na calculadora aparecerão aqui.</p>
            </div>
          ) : (
            history.map((item) => (
              <button
                key={item.id}
                onClick={() => setDisplay(item.result)}
                className="w-full text-right p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 bg-slate-50/50 dark:bg-slate-800/40 transition group"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>{item.timestamp}</span>
                  <span className="group-hover:text-blue-500 transition font-sans">Usar</span>
                </div>
                <div className="font-mono text-xs text-slate-500 dark:text-slate-400 truncate">
                  {item.expression} =
                </div>
                <div className="font-mono font-bold text-sm text-slate-800 dark:text-slate-100">
                  {item.result}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
