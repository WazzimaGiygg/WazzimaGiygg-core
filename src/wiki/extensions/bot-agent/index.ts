/**
 * @file src/extensions/bot-agent/index.ts
 * @description Extensão oficial de Agente de Bots & Gerenciamento de Bots Users da WikiZero.
 * Atende aos requisitos:
 * - 4.1.1.8T.1: Agente de BOTS dentro do Wiki-Site
 * - 4.1.1.PN.1: Ativação/desativação de bots e gerenciamento de bots users
 * - 4.1.1.18C.1: Ferramenta auto-carregada por padrão para verificação automática de abusos de usuários
 */

import { HookRegistry, WikiExtension } from '../../core/Extension';
import { BotAgentService } from '../../services/botAgentService';
import { WikiArticle, UserProfile } from '../../types';

export default class BotAgentExtension implements WikiExtension {
  getName(): string {
    return 'BotAgentExtension';
  }

  getVersion(): string {
    return '1.0.0';
  }

  getDescription(): string {
    return 'Agente de Bots e Gerenciador de Robôs da WikiZero: verificação automática de citações (Gemini), proteção anti-vandalismo, auditoria de qualidade, auto-categorização, detecção de links quebrados e conformidade estrita com a LGPD.';
  }

  getAuthor(): string {
    return 'Equipe de Engenharia & Governança WikiZero';
  }

  getCategory(): 'security' {
    return 'security';
  }

  isCore(): boolean {
    return true; // Auto-carregado por padrão (4.1.1.18C.1)
  }

  getWebsite(): string {
    return 'https://wikizero.wazzimagiygg.com';
  }

  onRegister(hooks: HookRegistry): void {
    // 1. Sinaliza a presença do Agente de Bots no barramento de extensões
    hooks.addFilter<boolean>(
      'bots:agent_available',
      () => true,
      10,
      this.getName()
    );

    // 2. Registra o ID da ferramenta de gerenciamento de bots nas ferramentas ativas
    hooks.addFilter<string[]>(
      'tools:registered_tools',
      (tools: string[] = []) => {
        if (!tools.includes('bot-agent')) {
          return [...tools, 'bot-agent'];
        }
        return tools;
      },
      10,
      this.getName()
    );

    // 3. Hook de Interceptação Antes de Salvar Artigo (Anti-Vandalismo & LGPD)
    hooks.addFilter<{
      article: Partial<WikiArticle>;
      user?: UserProfile | null;
      canSave: boolean;
      rejectionReason?: string;
    }>(
      'article:before_save_intercept',
      (payload) => {
        const result = BotAgentService.processArticleOnSave(
          payload.article,
          null,
          payload.user
        );

        return {
          article: result.sanitizedArticle,
          user: payload.user,
          canSave: result.canSave,
          rejectionReason: result.rejectionReason,
        };
      },
      5,
      this.getName()
    );

    // 4. Hook de Auditoria Pós-Salvamento (Categorização, Citações e Sentinela de Usuário)
    hooks.addAction(
      'article:saved',
      (article: WikiArticle, user?: UserProfile | null) => {
        BotAgentService.processArticleOnSave(article, null, user);
      },
      10,
      this.getName()
    );
  }
}
