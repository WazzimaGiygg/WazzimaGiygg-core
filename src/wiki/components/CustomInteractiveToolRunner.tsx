import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Play,
  RotateCcw,
  Copy,
  Check,
  History,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Puzzle,
  Sparkles,
  Info,
} from 'lucide-react';
import { CustomToolConfig, AppTheme } from '../types';

interface CustomInteractiveToolRunnerProps {
  tool: CustomToolConfig;
  theme?: AppTheme;
  onNavigateToExtensions?: () => void;
}

export const CustomInteractiveToolRunner: React.FC<CustomInteractiveToolRunnerProps> = ({
  tool,
  onNavigateToExtensions,
}) => {
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [history, setHistory] = useState<{ query: string; result: string; timestamp: string }[]>([]);

  // Inicializa valores padrão
  useEffect(() => {
    const defaults: Record<string, any> = {};
    if (tool.inputs) {
      for (const input of tool.inputs) {
        defaults[input.id] = input.defaultValue !== undefined
          ? input.defaultValue
          : input.type === 'number'
          ? 0
          : '';
      }
    }
    setFormValues(defaults);
    setResult(null);
    setError(null);
  }, [tool]);

  const handleInputChange = (id: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleExecuteCalculation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (!tool.calculationFormula) {
      setResult('Ferramenta executada com sucesso.');
      return;
    }

    try {
      // Cria escopo com valores numéricos ou strings
      const sanitizedInputs: Record<string, any> = {};
      for (const [k, v] of Object.entries(formValues)) {
        sanitizedInputs[k] = !isNaN(Number(v)) && typeof v !== 'boolean' && String(v).trim() !== ''
          ? Number(v)
          : v;
      }

      // Executa fórmula no sandbox de função
      const evaluator = new Function(
        'inputs',
        `with (inputs) { return ${tool.calculationFormula}; }`
      );
      const output = evaluator(sanitizedInputs);

      let formattedOutput = '';
      if (typeof output === 'number') {
        formattedOutput = Number.isInteger(output)
          ? output.toString()
          : Number(output.toFixed(4)).toString();
      } else {
        formattedOutput = String(output ?? '');
      }

      setResult(formattedOutput);

      // Adiciona ao histórico de cálculo
      const summary = Object.entries(sanitizedInputs)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');

      setHistory((prev) => [
        {
          query: summary,
          result: `${formattedOutput} ${tool.unitSuffix || ''}`.trim(),
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev.slice(0, 9),
      ]);
    } catch (err: any) {
      console.error('[CustomTool] Erro de cálculo:', err);
      setError(`Erro na fórmula: ${err?.message || 'Falha de sintaxe ou execução.'}`);
    }
  };

  const handleCopyResult = () => {
    if (!result) return;
    const fullText = `${result} ${tool.unitSuffix || ''}`.trim();
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    const defaults: Record<string, any> = {};
    if (tool.inputs) {
      for (const input of tool.inputs) {
        defaults[input.id] = input.defaultValue !== undefined ? input.defaultValue : '';
      }
    }
    setFormValues(defaults);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner da Ferramenta de Extensão */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-2xl shadow-inner shrink-0">
              {tool.icon ? <span>{tool.icon}</span> : <Wrench size={26} />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                  <Puzzle size={10} />
                  <span>Extensão Ferramenta</span>
                </span>
                {tool.badge && (
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
                    {tool.badge}
                  </span>
                )}
              </div>
              <h2 className="text-xl md:text-2xl font-bold font-serif-heading text-slate-900 dark:text-white">
                {tool.title || tool.toolId}
              </h2>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                {tool.description || 'Módulo utilitário interativo adicionado pela extensão.'}
              </p>
            </div>
          </div>

          {onNavigateToExtensions && (
            <button
              onClick={onNavigateToExtensions}
              className="px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs font-semibold flex items-center gap-1.5 self-start md:self-auto transition"
            >
              <Puzzle size={13} />
              <span>Gerenciar Extensão</span>
            </button>
          )}
        </div>

        {/* Formulário Interativo com Inputs & Fórmula */}
        {tool.inputs && tool.inputs.length > 0 && (
          <form onSubmit={handleExecuteCalculation} className="mt-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tool.inputs.map((input: any) => (
                <div key={input.id} className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>{input.label}</span>
                    <span className="font-mono text-[10px] text-slate-400">({input.id})</span>
                  </label>

                  {input.type === 'select' ? (
                    <select
                      value={formValues[input.id] ?? ''}
                      onChange={(e) => handleInputChange(input.id, e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-hidden transition"
                    >
                      {input.options?.map((opt: any, idx: number) => (
                        <option key={idx} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={input.type === 'number' ? 'number' : 'text'}
                      step="any"
                      value={formValues[input.id] ?? ''}
                      placeholder={input.placeholder || `Informe ${input.label.toLowerCase()}`}
                      onChange={(e) =>
                        handleInputChange(
                          input.id,
                          input.type === 'number' ? e.target.value : e.target.value
                        )
                      }
                      className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-hidden transition font-mono"
                    />
                  )}

                  {input.helpText && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">{input.helpText}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-2 shadow-xs transition active:scale-98 cursor-pointer"
              >
                <Play size={14} className="fill-current" />
                <span>Calcular / Executar</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl font-medium text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Limpar</span>
              </button>
            </div>
          </form>
        )}

        {/* Exibição de Erro */}
        {error && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Cartão de Resultado */}
        {result !== null && (
          <div className="mt-6 p-5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-300 mb-1">
                {tool.resultLabel || 'Resultado Calculado'}
              </div>
              <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white flex items-baseline gap-2">
                <span>{result}</span>
                {tool.unitSuffix && (
                  <span className="text-sm font-sans font-medium text-slate-500 dark:text-slate-400">
                    {tool.unitSuffix}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleCopyResult}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-cyan-100 dark:hover:bg-slate-700 border border-cyan-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copied ? 'Copiado!' : 'Copiar Resultado'}</span>
            </button>
          </div>
        )}

        {/* Widget HTML Customizado se fornecido */}
        {tool.htmlWidget && (
          <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] font-mono font-bold uppercase text-slate-400 mb-2 flex items-center gap-1">
              <Sparkles size={12} />
              <span>Widget HTML5 Interativo</span>
            </div>
            <div
              className="wiki-custom-tool-widget font-sans text-xs"
              dangerouslySetInnerHTML={{ __html: tool.htmlWidget }}
            />
          </div>
        )}
      </div>

      {/* Histórico Recente de Cálculos */}
      {history.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <History size={14} />
            <span>Histórico Desta Sessão</span>
          </div>
          <div className="space-y-2">
            {history.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono"
              >
                <div className="text-slate-600 dark:text-slate-400 truncate max-w-md">
                  {item.query}
                </div>
                <div className="font-bold text-cyan-600 dark:text-cyan-400 shrink-0">
                  {item.result}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
