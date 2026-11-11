import React, { useState } from 'react';
import { PlusCircle, X, Layers, Tag, Sparkles, Bot } from 'lucide-react';
import { WikiPage, UserProfile } from '../types';
import { GeminiChatbotDrawer } from './GeminiChatbotDrawer';

interface CreatePageModalProps {
  isOpen: boolean;
  user: UserProfile | null;
  onClose: () => void;
  onCreate: (pageData: Omit<WikiPage, 'criadoEm' | 'articleCount'>) => Promise<void>;
}

export const CreatePageModal: React.FC<CreatePageModalProps> = ({
  isOpen,
  user,
  onClose,
  onCreate,
}) => {
  const [uid, setUid] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('Geral');
  const [icon, setIcon] = useState('📄');
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGeminiChat, setShowGeminiChat] = useState(false);

  if (!isOpen) return null;

  const handleApplyFromGemini = (colData: {
    titulo: string;
    uid: string;
    descricao: string;
    categoria: string;
    icon: string;
    tags: string[];
  }) => {
    if (colData.titulo) setTitulo(colData.titulo);
    if (colData.uid) setUid(slugify(colData.uid));
    if (colData.descricao) setDescricao(colData.descricao);
    if (colData.categoria) setCategoria(colData.categoria);
    if (colData.icon) setIcon(colData.icon);
    if (colData.tags && colData.tags.length > 0) {
      setTagsInput(colData.tags.join(', '));
    }
  };

  const handleTituloChange = (val: string) => {
    setTitulo(val);
    if (!uid || uid === slugify(titulo)) {
      setUid(slugify(val));
    }
  };

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/(^_|_$)+/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid.trim() || !titulo.trim() || !descricao.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await onCreate({
        uid: uid.trim(),
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        categoria: categoria.trim(),
        autor: user?.displayName || 'Colaborador WikiWorldWeb',
        icon,
        tags,
        status: 'ativo',
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao criar coleção.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded shadow-xl overflow-hidden animate-in zoom-in-95 text-xs">
        <div className="bg-[#1e293b] p-3 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <PlusCircle size={16} className="text-blue-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider font-mono">
              Criar Nova Coleção / Tópico
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-0.5"
          >
            <X size={16} />
          </button>
        </div>

        {/* Banner de Auxílio do Chatbot Gemini AI Studio */}
        <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/20 px-4 py-2 border-b border-blue-200/40 dark:border-blue-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-blue-700 dark:text-blue-300">
            <Sparkles size={14} className="text-amber-400 animate-pulse shrink-0" />
            <span>Precisa de sugestões ou estruturação temática?</span>
          </div>
          <button
            type="button"
            onClick={() => setShowGeminiChat(true)}
            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium flex items-center gap-1 transition shadow-xs cursor-pointer"
          >
            <Bot size={12} />
            <span>Chatbot Gemini</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-0.5 font-mono">
              Título da Coleção *
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => handleTituloChange(e.target.value)}
              placeholder="Ex: Metropolitano de São Paulo"
              required
              className="w-full px-2.5 py-1 rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-0.5 font-mono">
                UID (Slug Firestore) *
              </label>
              <input
                type="text"
                value={uid}
                onChange={(e) => setUid(slugify(e.target.value))}
                placeholder="ex: metro_sp"
                required
                className="w-full px-2.5 py-1 font-mono text-xs rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-blue-600 dark:text-blue-400 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-0.5 font-mono">
                Ícone / Emoji
              </label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="Ex: 🚇, 📚, ⚡"
                className="w-full px-2.5 py-1 rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-center focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-0.5 font-mono">
              Categoria *
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-2.5 py-1 rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500"
            >
              <option value="Transporte & Infraestrutura">Transporte & Infraestrutura</option>
              <option value="Cultura & Tecnologia">Cultura & Tecnologia</option>
              <option value="Tecnologia">Tecnologia</option>
              <option value="Direito & Legislação">Direito & Legislação</option>
              <option value="Ciência">Ciência</option>
              <option value="História">História</option>
              <option value="Geral">Geral</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-0.5 font-mono">
              Descrição / Resumo *
            </label>
            <textarea
              rows={2}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o escopo desta coleção..."
              required
              className="w-full px-2.5 py-1 rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-0.5 font-mono">
              Tags (vírgula)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Ex: São Paulo, Trens, Linhas"
              className="w-full px-2.5 py-1 text-xs rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-1.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3.5 py-1 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition disabled:opacity-50"
            >
              {isSubmitting ? 'Criando...' : 'Criar Coleção'}
            </button>
          </div>
        </form>
      </div>

      {/* Assistente Chatbot Gemini em Modo Coleção */}
      <GeminiChatbotDrawer
        isOpen={showGeminiChat}
        onClose={() => setShowGeminiChat(false)}
        currentUser={user}
        contextMode="collection"
        currentCollection={{
          titulo,
          uid,
          descricao,
          categoria,
        }}
        onApplyToCollection={handleApplyFromGemini}
      />
    </div>
  );
};
