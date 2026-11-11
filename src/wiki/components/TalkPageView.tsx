import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  PlusCircle,
  CheckCircle2,
  Clock,
  User,
  Send,
  ThumbsUp,
  AlertCircle,
  HelpCircle,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { WikiArticle, UserProfile, TalkThread, TalkReply } from '../types';
import { StorageService } from '../services/storageService';
import { formatInline } from '../utils/wikitextParser';

interface TalkPageViewProps {
  article: WikiArticle;
  user: UserProfile | null;
  onNavigateToArticle?: (articleId: string) => void;
}

export const TalkPageView: React.FC<TalkPageViewProps> = ({ article, user }) => {
  const [threads, setThreads] = useState<TalkThread[]>([]);
  const [showNewThreadModal, setShowNewThreadModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [replyingToThreadId, setReplyingToThreadId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadThreads();
    const unsub = StorageService.subscribeToTalkThreads(article.id, (threads) => {
      if (threads && threads.length > 0) {
        setThreads(threads);
        const map: Record<string, boolean> = {};
        threads.forEach((t) => (map[t.id] = true));
        setExpandedThreads((prev) => ({ ...map, ...prev }));
      }
    });
    return () => unsub();
  }, [article.id]);

  const loadThreads = async () => {
    const list = await StorageService.fetchTalkThreads(article.id);
    setThreads(list);
    // Expand all by default
    const map: Record<string, boolean> = {};
    list.forEach((t) => (map[t.id] = true));
    setExpandedThreads(map);
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    if (!user || user.isGuest) {
      alert('Somente usuários cadastrados e logados podem abrir tópicos de discussão na WikiWorldWeb.');
      return;
    }
    if (user.isBanned) {
      alert('Sua conta está suspensa. Usuários bloqueados não podem abrir tópicos de discussão.');
      return;
    }

    try {
      await StorageService.addTalkThread(article.id, newTitle.trim(), newContent.trim(), user);
      setNewTitle('');
      setNewContent('');
      setShowNewThreadModal(false);
      await loadThreads();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar tópico de discussão.');
    }
  };

  const handleSendReply = async (threadId: string) => {
    if (!replyContent.trim()) return;

    if (!user || user.isGuest) {
      alert('Somente usuários cadastrados e logados podem responder em discussões.');
      return;
    }
    if (user.isBanned) {
      alert('Sua conta está suspensa. Usuários bloqueados não podem responder em discussões.');
      return;
    }

    try {
      await StorageService.addTalkReply(threadId, replyContent.trim(), user);
      setReplyContent('');
      setReplyingToThreadId(null);
      await loadThreads();
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar resposta.');
    }
  };

  const handleStatusChange = async (threadId: string, status: TalkThread['status']) => {
    await StorageService.updateTalkThreadStatus(threadId, status);
    await loadThreads();
  };

  const toggleExpand = (threadId: string) => {
    setExpandedThreads((prev) => ({ ...prev, [threadId]: !prev[threadId] }));
  };

  const getStatusBadge = (status: TalkThread['status']) => {
    switch (status) {
      case 'resolvido':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
            <CheckCircle2 size={11} /> Resolvido
          </span>
        );
      case 'consenso':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800 flex items-center gap-1">
            ✨ Consenso Atingido
          </span>
        );
      case 'em_discussao':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
            <Clock size={11} /> Em Discussão
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center gap-1">
            <AlertCircle size={11} /> Em Aberto
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in select-none">
      {/* MediaWiki Talk Page Notice Header */}
      <div className="p-4 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-xs text-slate-700 dark:text-slate-300 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-200 font-serif-heading text-sm">
            <MessageSquare size={16} className="text-blue-600 dark:text-blue-400" />
            <span>Discussão: {article.titulo}</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Esta é a página de discussão para debater melhorias, propostas e verificabilidade de fontes no artigo <strong>{article.titulo}</strong>. Mantenha as discussões corteses e assine suas mensagens.
          </p>
        </div>

        <button
          onClick={() => setShowNewThreadModal(true)}
          className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs flex-shrink-0"
        >
          <PlusCircle size={13} />
          Novo Tópico
        </button>
      </div>

      {/* New Thread Modal / Form */}
      {showNewThreadModal && (
        <form
          onSubmit={handleCreateThread}
          className="p-4 rounded-lg bg-white dark:bg-slate-900 border-2 border-blue-500/50 shadow-md space-y-3 animate-in zoom-in-95"
        >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
              <PlusCircle size={13} className="text-blue-600" />
              Adicionar Novo Tópico de Discussão
            </h4>
            <button
              type="button"
              onClick={() => setShowNewThreadModal(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
            >
              Cancelar
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Título do Tópico (Ex: == Atualização de Fontes ==)
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Assunto ou proposta..."
              className="w-full text-xs px-3 py-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Mensagem
            </label>
            <textarea
              required
              rows={3}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Descreva a sugestão ou correção para o artigo..."
              className="w-full text-xs px-3 py-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400 font-mono">
              Assinatura automática: {user?.displayName || 'Colaborador'} • {new Date().toLocaleDateString('pt-BR')}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowNewThreadModal(false)}
                className="px-3 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              >
                Descartar
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
              >
                <Send size={12} /> Publicar Tópico
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Threads List */}
      {threads.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
          <MessageSquare size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Nenhuma discussão iniciada neste artigo
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Seja o primeiro a propor uma melhoria, correção de dados ou inclusão de referências bibliográficas.
          </p>
          <button
            onClick={() => setShowNewThreadModal(true)}
            className="mt-3 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center gap-1 shadow-xs"
          >
            <PlusCircle size={12} /> Iniciar Primeiro Tópico
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {threads.map((thread) => {
            const isExpanded = expandedThreads[thread.id] ?? true;

            return (
              <div
                key={thread.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs"
              >
                {/* Thread Header */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      onClick={() => toggleExpand(thread.id)}
                      className="text-slate-600 dark:text-slate-300 hover:text-blue-600 font-bold text-sm flex items-center gap-1.5"
                    >
                      <span>== {thread.titulo} ==</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {getStatusBadge(thread.status)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Status Toggle Menu */}
                    <select
                      value={thread.status}
                      onChange={(e) => handleStatusChange(thread.id, e.target.value as any)}
                      className="text-[11px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-0.5 text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="aberto">Em Aberto</option>
                      <option value="em_discussao">Em Discussão</option>
                      <option value="resolvido">Resolvido</option>
                      <option value="consenso">Consenso Atingido</option>
                    </select>
                  </div>
                </div>

                {/* Thread Body & Replies */}
                {isExpanded && (
                  <div className="p-4 space-y-4">
                    {/* Initial Post */}
                    <div className="space-y-2 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-wiki-body">
                      <p className="whitespace-pre-wrap">{thread.conteudo}</p>

                      <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/80 font-mono">
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-blue-500" />
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {thread.autor}
                          </span>
                          <span className="uppercase text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {thread.autorRole || 'editor'}
                          </span>
                        </div>
                        <span title={new Date(thread.data).toLocaleString('pt-BR')}>
                          {new Date(thread.data).toLocaleDateString('pt-BR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Replies List */}
                    {thread.respostas && thread.respostas.length > 0 && (
                      <div className="pl-4 sm:pl-6 space-y-3 border-l-2 border-blue-200 dark:border-blue-900/60 mt-3">
                        {thread.respostas.map((reply) => (
                          <div
                            key={reply.id}
                            className="p-3 rounded-lg bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5"
                          >
                            <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                              {reply.conteudo}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  ↳ {reply.autor}
                                </span>
                                <span className="uppercase text-[9px] px-1 py-0.2 rounded bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                                  {reply.autorRole || 'colaborador'}
                                </span>
                              </div>
                              <span>
                                {new Date(reply.data).toLocaleDateString('pt-BR', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply Input */}
                    {replyingToThreadId === thread.id ? (
                      <div className="pl-4 sm:pl-6 mt-3 space-y-2 border-l-2 border-blue-400 dark:border-blue-600 animate-in fade-in">
                        <textarea
                          rows={2}
                          autoFocus
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Escreva sua resposta para este tópico (assinado como você)..."
                          className="w-full text-xs px-3 py-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingToThreadId(null);
                              setReplyContent('');
                            }}
                            className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendReply(thread.id)}
                            className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                          >
                            <Send size={11} /> Responder
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-1 flex items-center justify-end">
                        <button
                          onClick={() => {
                            setReplyingToThreadId(thread.id);
                            setReplyContent('');
                          }}
                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <MessageSquare size={12} /> Responder a este tópico
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
