/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Página de Jogos Online do Portal WazzimaGiygg
 */

import React, { useState } from 'react';
import { Gamepad2 } from 'lucide-react';
import SnakeGame from './SnakeGame';

type OnlineGameId = 'cobrinha';

interface GameCatalogItem {
  id: OnlineGameId;
  title: string;
  genre: string;
  controlsSummary: string;
  description: string;
}

const ONLINE_GAMES_CATALOG: GameCatalogItem[] = [
  {
    id: 'cobrinha',
    title: 'Jogo da Cobrinha',
    genre: 'Arcade Clássico',
    controlsSummary: 'Teclas WASD · Setas (Cursores) · Toque',
    description:
      'Guie a cobrinha pela arena para coletar frutas, evitar colisões e ajustar a dificuldade em tempo real adicionando ou removendo velocidade, paredes sólidas e obstáculos.',
  },
];

export default function OnlineGamesView() {
  const [selectedGameId, setSelectedGameId] = useState<OnlineGameId>('cobrinha');
  const activeGame =
    ONLINE_GAMES_CATALOG.find((g) => g.id === selectedGameId) || ONLINE_GAMES_CATALOG[0];

  return (
    <div className="space-y-8">
      {/* Cabeçalho da Página Jogos Online */}
      <header className="bg-white dark:bg-[#1A1A18] border-2 border-[#141414] dark:border-[#3E3D38] shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] p-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-mono text-stone-600 dark:text-stone-400">
              <Gamepad2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Jogos Online WazzimaGiygg</span>
              <span aria-hidden="true">·</span>
              <span>Execução direta no navegador sem anúncios</span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#141414] dark:text-stone-100 leading-tight">
              {activeGame.title}
            </h2>
            <p className="font-serif text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
              {activeGame.description}
            </p>
          </div>

          {/* Seletor de Jogos do Catálogo */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {ONLINE_GAMES_CATALOG.map((game) => {
              const isSelected = game.id === selectedGameId;
              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => setSelectedGameId(game.id)}
                  className={`px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider border whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#141414] dark:bg-stone-100 text-white dark:text-stone-950 border-[#141414] dark:border-stone-100'
                      : 'bg-[#F8F7F4] dark:bg-[#242320] text-stone-800 dark:text-stone-200 border-stone-400 dark:border-[#3E3D38] hover:bg-stone-200 dark:hover:bg-[#32302B]'
                  }`}
                >
                  {game.title}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-stone-200 dark:border-[#2E2D28] flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-stone-600 dark:text-stone-400">
          <span>{activeGame.genre}</span>
          <span aria-hidden="true">·</span>
          <span>{activeGame.controlsSummary}</span>
          <span aria-hidden="true">·</span>
          <span>1º título disponível no acervo</span>
        </div>
      </header>

      {/* Área Ativa do Jogo Selecionado */}
      {selectedGameId === 'cobrinha' && <SnakeGame />}
    </div>
  );
}
