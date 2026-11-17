/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tutorial Interativo de Uso do Infobox do NotMediaWiki
 * Explica sintaxe, parâmetros, cores, links, {{Userbox}}, prévia Parsoid ao vivo
 * e modelos prontos para aplicar em verbetes ou na página pessoal do usuário.
 */

import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Code,
  Copy,
  Check,
  Sparkles,
  UserCheck,
  Edit3,
  Layers,
  Info,
  CheckCircle,
  Link2,
  Image as ImageIcon,
  Palette
} from 'lucide-react';
import { parseWikitextToHtml } from '../../data/notMediaWikiData';
import {
  INFOBOX_TUTORIAL_TEMPLATES,
  InfoboxTutorialTemplate,
  buildUserInfoboxWikitext,
  resolveUserDisplayName,
  buildPersonalUserPageSlug
} from '../../config/userInfobox';

interface NotMediaWikiInfoboxTutorialProps {
  currentUser?: any;
  personalPageSlug?: string | null;
  contributionsCount?: number;
  onInsertIntoEditor: (wikitext: string, suggestedTitle?: string) => void;
  onApplyToPersonalPage?: (infoboxWikitext: string) => void;
  showToast: (msg: string, isError?: boolean) => void;
}

export default function NotMediaWikiInfoboxTutorial({
  currentUser,
  personalPageSlug,
  contributionsCount = 0,
  onInsertIntoEditor,
  onApplyToPersonalPage,
  showToast,
}: NotMediaWikiInfoboxTutorialProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<InfoboxTutorialTemplate['id']>('usuario');
  const [sandboxWikitext, setSandboxWikitext] = useState<string>(() => {
    if (currentUser?.uid) {
      return buildUserInfoboxWikitext(currentUser, { contributionsCount, pagesCreated: 1 });
    }
    return INFOBOX_TUTORIAL_TEMPLATES[0].wikitext;
  });
  const [sandboxTitle, setSandboxTitle] = useState<string>('Pré-visualização do Infobox');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const personalizedUserTemplate = useMemo(() => {
    if (!currentUser?.uid) return INFOBOX_TUTORIAL_TEMPLATES[0].wikitext;
    return buildUserInfoboxWikitext(currentUser, { contributionsCount, pagesCreated: 1 });
  }, [currentUser, contributionsCount]);

  const activeTemplate = useMemo(() => {
    const found = INFOBOX_TUTORIAL_TEMPLATES.find((t) => t.id === selectedTemplateId) || INFOBOX_TUTORIAL_TEMPLATES[0];
    if (found.id === 'usuario' && currentUser?.uid) {
      return {
        ...found,
        wikitext: personalizedUserTemplate,
      };
    }
    return found;
  }, [selectedTemplateId, currentUser, personalizedUserTemplate]);

  const compiledPreview = useMemo(() => {
    return parseWikitextToHtml(sandboxWikitext, sandboxTitle);
  }, [sandboxWikitext, sandboxTitle]);

  const handleSelectTemplate = (tpl: InfoboxTutorialTemplate) => {
    setSelectedTemplateId(tpl.id);
    const code = tpl.id === 'usuario' && currentUser?.uid ? personalizedUserTemplate : tpl.wikitext;
    setSandboxWikitext(code);
    if (tpl.id === 'usuario' && currentUser?.uid) {
      setSandboxTitle(personalPageSlug || buildPersonalUserPageSlug(resolveUserDisplayName(currentUser), currentUser.uid));
    } else {
      setSandboxTitle(tpl.label);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      showToast('Código Wikitexto do Infobox copiado!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast('Não foi possível copiar automaticamente.', true);
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Intro Banner */}
      <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b-2 border-[#141414] pb-4 mb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="bg-amber-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                Ajuda:Infobox • Namespace 12
              </span>
              <span className="bg-stone-900 text-amber-300 font-mono text-[10px] font-bold px-2 py-0.5 uppercase">
                Parsoid AST Compatível
              </span>
            </div>
            <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-stone-950 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-amber-700 shrink-0" />
              <span>Tutorial Oficial: Como Usar o Infobox no NotMediaWiki</span>
            </h3>
            <p className="text-xs font-mono text-stone-600 mt-1 max-w-3xl">
              O <strong>Infobox</strong> é o quadro estruturado exibido no canto superior direito de páginas de usuários (Namespace 2) e artigos enciclopédicos (Namespace 0). Ele identifica contas e resume metadados críticos sem expor dados sensíveis.
            </p>
          </div>

          {currentUser?.uid && (
            <div className="bg-amber-50 border-2 border-amber-700 p-3 font-mono text-[11px] shrink-0 max-w-xs">
              <div className="font-bold text-amber-950 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-amber-700" />
                <span>Sua Identificação Ativa</span>
              </div>
              <p className="text-stone-700 mt-1">
                Conta: <strong>{resolveUserDisplayName(currentUser)}</strong>
              </p>
              <p className="text-stone-600 truncate">
                Página: <strong>{personalPageSlug || buildPersonalUserPageSlug(resolveUserDisplayName(currentUser), currentUser.uid)}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Step-by-step Anatomy Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3.5 bg-[#FAF9F5] border-2 border-[#141414]">
            <div className="flex items-center gap-1.5 font-bold text-stone-950 uppercase text-[11px] mb-1.5">
              <span className="bg-[#141414] text-amber-300 px-1.5 py-0.5 text-[10px]">1</span>
              <span>Abertura e Fechamento</span>
            </div>
            <p className="text-[11px] text-stone-700 font-serif leading-relaxed mb-2">
              Todo Infobox inicia com <code className="bg-stone-200 px-1 font-mono">{'{{Infobox Tipo'}</code> e termina em uma nova linha com <code className="bg-stone-200 px-1 font-mono">{'}}'}</code>.
            </p>
            <code className="block bg-stone-900 text-amber-300 p-2 text-[10px] leading-snug">
              {'{{Infobox Usuário\n| nome = ...\n}}'}
            </code>
          </div>

          <div className="p-3.5 bg-[#FAF9F5] border-2 border-[#141414]">
            <div className="flex items-center gap-1.5 font-bold text-stone-950 uppercase text-[11px] mb-1.5">
              <span className="bg-[#141414] text-amber-300 px-1.5 py-0.5 text-[10px]">2</span>
              <span>Cabeçalho, Subtítulo &amp; Cor</span>
            </div>
            <p className="text-[11px] text-stone-700 font-serif leading-relaxed mb-2">
              Use <code className="bg-stone-200 px-1 font-mono">nome</code>, <code className="bg-stone-200 px-1 font-mono">subtítulo</code> e <code className="bg-stone-200 px-1 font-mono">cor</code> (<Palette className="w-3 h-3 inline" /> amber, blue, emerald, red, indigo, slate).
            </p>
            <code className="block bg-stone-900 text-emerald-300 p-2 text-[10px] leading-snug">
              {'| nome = Maria Silva\n| cor = amber'}
            </code>
          </div>

          <div className="p-3.5 bg-[#FAF9F5] border-2 border-[#141414]">
            <div className="flex items-center gap-1.5 font-bold text-stone-950 uppercase text-[11px] mb-1.5">
              <span className="bg-[#141414] text-amber-300 px-1.5 py-0.5 text-[10px]">3</span>
              <span>Avatar &amp; Legenda</span>
            </div>
            <p className="text-[11px] text-stone-700 font-serif leading-relaxed mb-2">
              Exiba foto pública ou brasão com <code className="bg-stone-200 px-1 font-mono">imagem</code> (<ImageIcon className="w-3 h-3 inline" /> URL https) e descrição em <code className="bg-stone-200 px-1 font-mono">legenda</code>.
            </p>
            <code className="block bg-stone-900 text-sky-300 p-2 text-[10px] leading-snug">
              {'| imagem = https://...\n| legenda = Foto oficial'}
            </code>
          </div>

          <div className="p-3.5 bg-[#FAF9F5] border-2 border-[#141414]">
            <div className="flex items-center gap-1.5 font-bold text-stone-950 uppercase text-[11px] mb-1.5">
              <span className="bg-[#141414] text-amber-300 px-1.5 py-0.5 text-[10px]">4</span>
              <span>Links &amp; Userboxes</span>
            </div>
            <p className="text-[11px] text-stone-700 font-serif leading-relaxed mb-2">
              Campos aceitam <Link2 className="w-3 h-3 inline" /> links internos <code className="bg-stone-200 px-1 font-mono">{'[[Página|Rótulo]]'}</code>, externos <code className="bg-stone-200 px-1 font-mono">[https://... Site]</code> e selos <code className="bg-stone-200 px-1 font-mono">{'{{Userbox|🌐|Texto}}'}</code>.
            </p>
            <code className="block bg-stone-900 text-amber-200 p-2 text-[10px] leading-snug">
              {'{{Userbox|🛡️|LGPD OK}}'}
            </code>
          </div>
        </div>
      </div>

      {/* Interactive Template Selector + Live Parsoid Sandbox */}
      <div className="bg-white border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#141414] pb-4">
          <div>
            <h4 className="font-editorial text-xl font-bold text-stone-950 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <span>Laboratório Interativo de Infobox (Código + Prévia Parsoid)</span>
            </h4>
            <p className="text-xs font-mono text-stone-600 mt-0.5">
              Escolha um modelo oficial, edite os campos à esquerda e veja o resultado compilado em tempo real à direita.
            </p>
          </div>
        </div>

        {/* Template Picker Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 font-mono text-xs">
          {INFOBOX_TUTORIAL_TEMPLATES.map((tpl) => {
            const isSelected = tpl.id === selectedTemplateId;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tpl)}
                className={`p-3 text-left border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#141414] text-white border-[#141414] shadow-[3px_3px_0px_0px_rgba(217,119,6,1)]'
                    : 'bg-[#FAF9F5] text-stone-900 border-stone-300 hover:border-[#141414]'
                }`}
              >
                <span
                  className={`inline-block text-[9px] font-bold uppercase px-1.5 py-0.5 mb-1.5 ${
                    isSelected ? 'bg-amber-500 text-stone-950' : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {tpl.badge}
                </span>
                <div className="font-bold text-xs">{tpl.label}</div>
                <p className={`text-[10px] mt-1 font-serif leading-snug ${isSelected ? 'text-stone-300' : 'text-stone-600'}`}>
                  {tpl.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Split Editor + Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Wikitext Code Editor */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between font-mono text-xs">
              <label className="font-bold uppercase text-[11px] text-stone-800 flex items-center gap-1.5">
                <Code className="w-4 h-4 text-blue-700" />
                <span>Código Wikitexto ({activeTemplate.label})</span>
              </label>
              <button
                type="button"
                onClick={() => handleCopy(sandboxWikitext, 'sandbox')}
                className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-400 font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer"
              >
                {copiedId === 'sandbox' ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === 'sandbox' ? 'Copiado!' : 'Copiar Código'}</span>
              </button>
            </div>

            <textarea
              rows={15}
              value={sandboxWikitext}
              onChange={(e) => setSandboxWikitext(e.target.value)}
              className="w-full p-3 bg-[#141414] text-amber-100 border-2 border-[#141414] font-mono text-xs leading-relaxed focus:outline-none"
            />

            <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
              <button
                type="button"
                onClick={() =>
                  onInsertIntoEditor(
                    sandboxWikitext +
                      `\n\n== Descrição ==\nEscreva aqui o conteúdo completo usando a sintaxe [[NotMediaWiki]].\n`,
                    selectedTemplateId === 'usuario' && currentUser?.uid
                      ? personalPageSlug || buildPersonalUserPageSlug(resolveUserDisplayName(currentUser), currentUser.uid)
                      : undefined
                  )
                }
                className="px-3.5 py-2 bg-[#141414] hover:bg-stone-800 text-white font-bold uppercase text-[11px] flex items-center gap-1.5 cursor-pointer shadow-[3px_3px_0px_0px_rgba(217,119,6,1)]"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                <span>Inserir no Editor Wikitexto</span>
              </button>

              {onApplyToPersonalPage && currentUser?.uid && (
                <button
                  type="button"
                  onClick={() => onApplyToPersonalPage(sandboxWikitext)}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 border-2 border-[#141414] font-bold uppercase text-[11px] flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Aplicar na Minha Página Pessoal</span>
                </button>
              )}
            </div>
          </div>

          {/* Live Compiled Parsoid Output */}
          <div className="border-2 border-[#141414] bg-[#FAF9F5] p-4 flex flex-col justify-between min-h-[360px]">
            <div>
              <div className="flex items-center justify-between border-b border-stone-300 pb-2 mb-3 font-mono text-[10px] uppercase">
                <span className="font-bold text-stone-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Pré-visualização Parsoid AST em Tempo Real</span>
                </span>
                <span className="text-emerald-700 font-bold">{compiledPreview.parseTimeMs} ms</span>
              </div>

              <div
                className="wiki-article-body flow-root prose prose-stone max-w-none font-serif text-sm text-stone-900 leading-relaxed"
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  const link = target.closest('a[data-wikilink]') as HTMLAnchorElement;
                  if (link) {
                    e.preventDefault();
                    showToast(`Prévia de link interno: [[${link.getAttribute('data-wikilink')}]]`);
                  }
                }}
                dangerouslySetInnerHTML={{
                  __html:
                    compiledPreview.html ||
                    '<p class="text-xs font-mono text-stone-500">Digite um bloco {{Infobox ...}} ao lado para visualizar.</p>',
                }}
              />
            </div>

            <div className="mt-4 pt-2 border-t border-stone-300 font-mono text-[10px] text-stone-600 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>
                Dica: Adicione também <code className="bg-stone-200 px-1">{'{{Userbox|🌐|Seu selo}}'}</code> logo abaixo do Infobox para exibir selos de perfil.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Parameter Reference Table */}
      <div className="bg-[#FAF9F5] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] font-mono text-xs">
        <div className="flex items-center gap-2 font-bold text-stone-950 uppercase text-xs mb-3">
          <Info className="w-4 h-4 text-blue-700" />
          <span>Tabela de Parâmetros Reservados &amp; Campos Livres do Infobox</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-stone-300 bg-white text-[11px]">
            <thead>
              <tr className="bg-[#141414] text-white uppercase text-[10px]">
                <th className="p-2 text-left">Parâmetro</th>
                <th className="p-2 text-left">Função no Renderizador Parsoid</th>
                <th className="p-2 text-left">Exemplo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              <tr>
                <td className="p-2 font-bold text-blue-800">nome / título</td>
                <td className="p-2 font-serif text-stone-700">Define o título principal na faixa superior do Infobox.</td>
                <td className="p-2 text-stone-600">| nome = Ana Beatriz</td>
              </tr>
              <tr>
                <td className="p-2 font-bold text-blue-800">subtítulo</td>
                <td className="p-2 font-serif text-stone-700">Exibe função, cargo ou área logo abaixo do título.</td>
                <td className="p-2 text-stone-600">| subtítulo = Pesquisadora • NotMediaWiki</td>
              </tr>
              <tr>
                <td className="p-2 font-bold text-blue-800">cor / tema</td>
                <td className="p-2 font-serif text-stone-700">Muda a cor do cabeçalho (amber, blue, emerald, red, indigo, slate).</td>
                <td className="p-2 text-stone-600">| cor = emerald</td>
              </tr>
              <tr>
                <td className="p-2 font-bold text-blue-800">imagem &amp; legenda</td>
                <td className="p-2 font-serif text-stone-700">Renderiza avatar ou ilustração (URL http/https) com legenda opcional.</td>
                <td className="p-2 text-stone-600">| imagem = https://.../avatar.png</td>
              </tr>
              <tr>
                <td className="p-2 font-bold text-emerald-800">Qualquer outro campo</td>
                <td className="p-2 font-serif text-stone-700">Vira automaticamente uma linha de tabela; aceita <code className="bg-stone-100 px-1">[[Links]]</code> e <code className="bg-stone-100 px-1">[https://... Link]</code>.</td>
                <td className="p-2 text-stone-600">| Página Pessoal = [[Usuário:Ana|Ana]]</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
