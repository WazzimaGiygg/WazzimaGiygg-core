/**
 * @file config.ts
 * @description Configurações e utilitários da extensão nativa GeminiApiKeyExtension (Requisito 3.05.3.ag).
 * Permite gerenciar a variável de ambiente GEMINI_API_KEY para uso do Gemini no Wiki-Site.
 */

export interface GeminiApiKeySettings {
  /** Indica se o uso do Gemini está ativado no Wiki-Site */
  enableGemini: boolean;
  /** Nome canônico da variável de ambiente no servidor Node.js/Express */
  envVariableName: string;
  /** Modelo padrão do Gemini selecionado para a enciclopédia */
  defaultModel: string;
  /** Temperatura para equilíbrio entre precisão factual e fluidez enciclopédica (0.0 a 1.0) */
  temperature: number;
  /** Ativa o Chatbot Assistente Enciclopédico oficial */
  enableChatbotAssistant: boolean;
  /** Ativa o Gemini Notebook (pesquisa e síntese de artigos) */
  enableGeminiNotebook: boolean;
  /** Ativa o Gerador de Artigos e Seções em Wikitext */
  enableArticleGenerator: boolean;
  /** Ativa visão computacional para transcrição e análise de documentos e imagens */
  enableVisionAnalysis: boolean;
  /** Isenção de limite de cota diária para Administradores e Burocratas */
  quotaExemptionAdmins: boolean;
}

export const DEFAULT_GEMINI_API_KEY_SETTINGS: GeminiApiKeySettings = {
  enableGemini: true,
  envVariableName: 'GEMINI_API_KEY',
  defaultModel: 'gemini-3.8-flash',
  temperature: 0.7,
  enableChatbotAssistant: true,
  enableGeminiNotebook: true,
  enableArticleGenerator: true,
  enableVisionAnalysis: true,
  quotaExemptionAdmins: true,
};

export interface GeminiModelOption {
  id: string;
  name: string;
  category: 'text' | 'reasoning' | 'image' | 'audio';
  description: string;
  isRecommended?: boolean;
}

export const RECOMMENDED_GEMINI_MODELS: GeminiModelOption[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash (Padrão Recomendado)',
    category: 'text',
    description: 'Modelo de alta velocidade e excelente fidelidade factual para artigos, resumos e assistência.',
    isRecommended: true,
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest',
    category: 'text',
    description: 'Versão mais recente estável da família Gemini Flash.',
  },
  {
    id: 'gemini-4-argon',
    name: 'Gemini 4 Argon (Raciocínio Avançado)',
    category: 'reasoning',
    description: 'Para tarefas complexas de raciocínio lógico, sínteses acadêmicas e auditoria cruzada.',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    category: 'text',
    description: 'Ultra-econômico e veloz para consultas rápidas de vocabulário e ortografia.',
  },
  {
    id: 'gemini-3.1-flash-lite-image',
    name: 'Gemini 3.1 Flash Lite Image',
    category: 'image',
    description: 'Geração e edição visual de infográficos e imagens explicativas.',
  },
  {
    id: 'gemini-3.8-flash-lite-tts',
    name: 'Gemini 3.8 Flash Lite TTS',
    category: 'audio',
    description: 'Leitura em voz alta de verbetes e acessibilidade para deficientes visuais.',
  },
  {
    id: 'gemini-3.5-transcribe',
    name: 'Gemini 3.5 Transcribe',
    category: 'audio',
    description: 'Transcrição de áudio, palestras e entrevistas para redação enciclopédica.',
  },
];

export interface GeminiKeyStatusResponse {
  status: string;
  hasApiKey: boolean;
  variableName: string;
  defaultModel: string;
  appletId: string;
  provider: string;
  maskedKey?: string | null;
  serverSideProxy: boolean;
  recommendedModels?: string[];
}

export interface GeminiTestPingResponse {
  success: boolean;
  variable: string;
  model?: string;
  latencyMs?: number;
  reply?: string;
  timestamp?: string;
  error?: string;
}

/**
 * Consulta o status da variável GEMINI_API_KEY no servidor
 */
export async function fetchGeminiKeyStatus(): Promise<GeminiKeyStatusResponse> {
  try {
    const res = await fetch('/api/gemini/status');
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return {
      status: data.status || 'ok',
      hasApiKey: !!data.hasApiKey,
      variableName: data.variableName || 'GEMINI_API_KEY',
      defaultModel: data.defaultModel || 'gemini-3.8-flash',
      appletId: data.appletId || '0a14dc90-3ab3-47bc-8306-ca5bc2953699',
      provider: data.provider || 'Google AI Studio & Gemini API',
      maskedKey: data.maskedKey || null,
      serverSideProxy: true,
      recommendedModels: data.recommendedModels || ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-4-argon'],
    };
  } catch (err: any) {
    return {
      status: 'error',
      hasApiKey: false,
      variableName: 'GEMINI_API_KEY',
      defaultModel: 'gemini-3.8-flash',
      appletId: '0a14dc90-3ab3-47bc-8306-ca5bc2953699',
      provider: 'Google AI Studio & Gemini API',
      maskedKey: null,
      serverSideProxy: true,
    };
  }
}

import { getFirebaseIdTokenSafe } from '../../services/firebase';

/**
 * Executa teste de conectividade e ping via GEMINI_API_KEY no servidor
 */
export async function testGeminiKeyPing(prompt?: string): Promise<GeminiTestPingResponse> {
  try {
    const idToken = await getFirebaseIdTokenSafe();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }

    const res = await fetch('/api/gemini/test-ping', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt: prompt || 'Responda em uma frase curta confirmando que a variável GEMINI_API_KEY está ativa e funcionando no servidor da Wiki.',
        idToken: idToken || undefined,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Erro HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      variable: 'GEMINI_API_KEY',
      error: err?.message || 'Falha na comunicação com a API do Gemini.',
    };
  }
}

