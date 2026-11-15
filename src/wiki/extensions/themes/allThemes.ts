import { HookRegistry, WikiExtension } from '../../core/Extension';
import { ExtensionCategory } from '../../types';

export interface ThemeExtensionDef {
  id: string;
  className: string;
  name: string;
  description: string;
  author: string;
  version: string;
}

export const THEMES_METADATA: ThemeExtensionDef[] = [
  {
    id: 'win95',
    className: 'Win95ThemeExtension',
    name: 'Tema Clássico Windows 95',
    description: 'Interface retrô inspirada no Windows 95 com barra cinza biselada, botão Iniciar, janelas clássicas e inicialização com som nostálgico.',
    author: 'Microsoft / WikiZero Retro Labs',
    version: '1.95.0',
  },
  {
    id: 'win31',
    className: 'Win31ThemeExtension',
    name: 'Tema Retrô Windows 3.1 (1992)',
    description: 'Interface histórica baseada no Program Manager do Windows 3.1 com barras azuis marinho, botões e paleta clássica de 16 cores.',
    author: 'Microsoft / WikiZero Retro Labs',
    version: '1.31.0',
  },
  {
    id: 'winxp',
    className: 'WinXpThemeExtension',
    name: 'Tema Windows XP (Luna Blue)',
    description: 'Interface icônica do Windows XP com barra de tarefas azul Luna, botão verde Iniciar, relevos arredondados e inicialização clássica.',
    author: 'Microsoft / WikiZero Retro Labs',
    version: '2.0.1',
  },
  {
    id: 'win7',
    className: 'Win7ThemeExtension',
    name: 'Tema Windows 7 (Aero Glass)',
    description: 'Interface translúcida estilo Aero Glass com reflexos de luz, cantos arredondados e animação de inicialização das quatro esferas convergentes.',
    author: 'Microsoft / WikiZero Retro Labs',
    version: '2.7.0',
  },
  {
    id: 'win10',
    className: 'Win10ThemeExtension',
    name: 'Tema Windows 10 (Fluent Dark)',
    description: 'Interface moderna minimalista do Windows 10 em modo escuro com tipografia Segoe UI, logo angular e spinner circular.',
    author: 'Microsoft / WikiZero Retro Labs',
    version: '3.10.0',
  },
  {
    id: 'win1',
    className: 'Win1ThemeExtension',
    name: 'Tema Histórico Windows 1.0 (1985)',
    description: 'Visual pioneiro preto e branco de 1985 com janelas lado a lado (tiling), barra superior MS-DOS Executive e paleta pura.',
    author: 'Microsoft / WikiZero Retro Labs',
    version: '1.0.1',
  },
  {
    id: 'google',
    className: 'GoogleThemeExtension',
    name: 'Tema Google Material Design',
    description: 'Visual moderno limpo inspirado no Google Workspace e Material You com as 4 cores características (Azul, Vermelho, Amarelo, Verde).',
    author: 'Google Material / WikiZero',
    version: '3.0.5',
  },
  {
    id: 'wikidiota',
    className: 'WikidiotaThemeExtension',
    name: 'Tema Wikidiota (Wikipedia Vector)',
    description: 'Visual satírico inspirado na Wikipedia clássica (Vector 2010) com abas superiores, avisos de verificabilidade e tipografia serifada.',
    author: 'Wikiomite Foundation / Wikidiota',
    version: '1.0.0',
  },
  {
    id: 'genshin',
    className: 'GenshinThemeExtension',
    name: 'Tema Genshin Impact (Teyvat Archives)',
    description: 'Visual celestial de Genshin Impact com tons de Primogem, dourado celestial (#d3bc8e), azul noturno (#121524) e fontes elegantes.',
    author: 'HoYoverse / Teyvat Archives',
    version: '4.8.0',
  },
  {
    id: 'android15',
    className: 'Android15ThemeExtension',
    name: 'Tema Android 1.5 Cupcake',
    description: 'Visual retrô do primeiro Android comercial com verde robótico (#A4C639), widgets arredondados e menus chanfrados.',
    author: 'Google OHA / WikiZero',
    version: '1.5.0',
  },
  {
    id: 'stardew',
    className: 'StardewValleyThemeExtension',
    name: 'Tema Stardew Valley (Pelican Town)',
    description: 'Interface rústica e acolhedora em madeira de carvalho, ouro velho e pergaminho inspirada na vila Pelican Town de Stardew Valley.',
    author: 'ConcernedApe / WikiZero',
    version: '1.6.0',
  },
  {
    id: 'repo',
    className: 'RepoTerminalThemeExtension',
    name: 'Tema R.E.P.O. Semiwork Terminal',
    description: 'Interface distópica industrial de ficção científica com tons âmbar (#f59e0b), faixas de perigo zebradas e fontes monoespaçadas CRT.',
    author: 'Semiwork / R.E.P.O. Archives',
    version: '1.0.4',
  },
  {
    id: 'minecraft',
    className: 'MinecraftThemeExtension',
    name: 'Tema Minecraft Mojang',
    description: 'Interface pixelada com pedra musgosa, barras de experiência verde-esmeralda (#55ff55), terra batida e estilo blocky.',
    author: 'Mojang Studios / WikiZero',
    version: '1.21.0',
  },
  {
    id: 'roblox',
    className: 'RobloxThemeExtension',
    name: 'Tema Roblox Blox Studio',
    description: 'Interface lúdica moderna com o verde característico (#00b06f), tipografia Roblox Sans e cartões cinza-escuro com badges poligonais.',
    author: 'Roblox Corporation / WikiZero',
    version: '2.0.0',
  },
  {
    id: 'nokia3310',
    className: 'Nokia3310ThemeExtension',
    name: 'Tema Nokia 3310 (Monocromático)',
    description: 'Visual nostálgico da tela verde monocromática de cristal líquido do indestrutível Nokia 3310 com pixel-art de Snake II.',
    author: 'Nokia Networks / WikiZero',
    version: '3.3.10',
  },
  {
    id: 'halflife',
    className: 'HalfLifeThemeExtension',
    name: 'Tema Half-Life Lambda Terminal',
    description: 'Interface do laboratório Black Mesa com o icônico símbolo Lambda λ, laranja radioativo (#ff9900), radiação e computadores HEV.',
    author: 'Valve Corporation / Black Mesa',
    version: '1.9.98',
  },
];

function createThemeClass(meta: ThemeExtensionDef) {
  return class implements WikiExtension {
    getName(): string {
      return meta.className;
    }

    getVersion(): string {
      return meta.version;
    }

    getDescription(): string {
      return meta.description;
    }

    getAuthor(): string {
      return meta.author;
    }

    getCategory(): ExtensionCategory {
      return 'theme';
    }

    isCore(): boolean {
      return true;
    }

    getWebsite(): string {
      return 'https://wazzimagiygg.com/';
    }

    onRegister(hooks: HookRegistry): void {
      hooks.addFilter<boolean>(
        `theme:${meta.id}_available`,
        () => true,
        10,
        this.getName()
      );

      hooks.addFilter<string[]>(
        'theme:supported_themes',
        (themes: string[] = []) => {
          if (!themes.includes(meta.id)) {
            return [...themes, meta.id];
          }
          return themes;
        },
        10,
        this.getName()
      );
    }

    onUnregister(hooks: HookRegistry): void {
      hooks.removeAllHooksForExtension(this.getName());
      hooks.addFilter<boolean>(
        `theme:${meta.id}_available`,
        () => false,
        10,
        this.getName()
      );
    }
  };
}

export const Win95ThemeExtension = createThemeClass(THEMES_METADATA[0]);
export const Win31ThemeExtension = createThemeClass(THEMES_METADATA[1]);
export const WinXpThemeExtension = createThemeClass(THEMES_METADATA[2]);
export const Win7ThemeExtension = createThemeClass(THEMES_METADATA[3]);
export const Win10ThemeExtension = createThemeClass(THEMES_METADATA[4]);
export const Win1ThemeExtension = createThemeClass(THEMES_METADATA[5]);
export const GoogleThemeExtension = createThemeClass(THEMES_METADATA[6]);
export const WikidiotaThemeExtension = createThemeClass(THEMES_METADATA[7]);
export const GenshinThemeExtension = createThemeClass(THEMES_METADATA[8]);
export const Android15ThemeExtension = createThemeClass(THEMES_METADATA[9]);
export const StardewValleyThemeExtension = createThemeClass(THEMES_METADATA[10]);
export const RepoTerminalThemeExtension = createThemeClass(THEMES_METADATA[11]);
export const MinecraftThemeExtension = createThemeClass(THEMES_METADATA[12]);
export const RobloxThemeExtension = createThemeClass(THEMES_METADATA[13]);
export const Nokia3310ThemeExtension = createThemeClass(THEMES_METADATA[14]);
export const HalfLifeThemeExtension = createThemeClass(THEMES_METADATA[15]);
