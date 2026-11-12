import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Trash2, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[WikiZero ErrorBoundary] Uncaught render error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetLocalState = () => {
    try {
      // Clear volatile theme or boot flags that might cause rendering glitches
      const keysToClear = [
        'wikizero_theme_v3',
        'wikizero_device_mode',
        'wikizero_last_view',
        'wikizero_boot_seen',
      ];
      keysToClear.forEach((key) => localStorage.removeItem(key));
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 dark:bg-red-950/60 rounded-xl text-red-600 dark:text-red-400">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Ops! Algo inesperado aconteceu no WikiZero
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  O aplicativo encontrou uma falha de renderização e acionou a barreira de proteção.
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="bg-slate-100 dark:bg-slate-900/80 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-xs font-mono overflow-auto max-h-48 text-red-700 dark:text-red-400">
                <div className="flex items-center gap-1.5 font-bold mb-1 text-slate-700 dark:text-slate-300">
                  <Bug className="w-3.5 h-3.5" /> Erro técnico detectado:
                </div>
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition"
              >
                <RefreshCw className="w-4 h-4" /> Recarregar Página
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-medium rounded-lg transition"
              >
                <Home className="w-4 h-4" /> Página Inicial
              </button>
              <button
                type="button"
                onClick={this.handleResetLocalState}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium rounded-lg text-xs transition"
                title="Limpar preferências locais e reiniciar"
              >
                <Trash2 className="w-4 h-4" /> Resetar Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
