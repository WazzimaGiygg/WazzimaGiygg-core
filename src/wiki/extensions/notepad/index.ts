// src/extensions/notepad/index.ts
import { HookRegistry, WikiExtension } from '../../core/Extension';

/**
 * Extension: NotepadToolExtension
 * Categoria: tool (Ferramenta)
 * Funcionalidade: Bloco de notas com arquivos .wkwdwz, salvamento local e edição online.
 */
export default class NotepadToolExtension implements WikiExtension {
  getName(): string {
    return 'NotepadToolExtension';
  }

  getVersion(): string {
    return '1.0.0';
  }

  getDescription(): string {
    return 'Bloco de notas com salvamento local em arquivos .wkwdwz e sincronização opcional para edição online, com detecção de conflito e round-trip de volta ao disco.';
  }

  getAuthor(): string {
    return 'WikiZero Notepad';
  }

  getCategory(): 'tool' {
    return 'tool';
  }

  isCore(): boolean {
    return false;
  }

  getWebsite(): string {
    return 'https://github.com/WazzimaGiygg/Wiki-alternative';
  }

  onRegister(hooks: HookRegistry): void {
    // Disponibilidade da ferramenta
    hooks.addFilter<boolean>(
      'tool:notepad_available',
      () => true,
      10,
      this.getName()
    );

    // Registro na lista dinâmica de ferramentas
    hooks.addFilter<string[]>(
      'tools:registered_tools',
      (tools: string[] = []) => {
        if (!tools.includes('notepad')) {
          return [...tools, 'notepad'];
        }
        return tools;
      },
      10,
      this.getName()
    );

    // Registro do formato .wkwdwz como tipo de arquivo suportado
    hooks.addFilter<string[]>(
      'tools:supported_file_extensions',
      (exts: string[] = []) => {
        if (!exts.includes('.wkwdwz')) {
          return [...exts, '.wkwdwz'];
        }
        return exts;
      },
      10,
      this.getName()
    );

    // Ações de ciclo de vida
    hooks.addAction(
      'tool:notepad:opened',
      () => {
        console.info('[NotepadToolExtension] Bloco de notas aberto.');
      },
      10,
      this.getName()
    );

    hooks.addAction(
      'tool:notepad:saved_local',
      (payload?: { filename?: string }) => {
        console.info(
          '[NotepadToolExtension] Arquivo .wkwdwz salvo localmente:',
          payload?.filename ?? '(sem nome)'
        );
      },
      10,
      this.getName()
    );

    hooks.addAction(
      'tool:notepad:uploaded',
      (payload?: { docId?: string }) => {
        console.info(
          '[NotepadToolExtension] Sessão de edição online iniciada:',
          payload?.docId ?? '(sem id)'
        );
      },
      10,
      this.getName()
    );

    hooks.addAction(
      'tool:notepad:downloaded',
      (payload?: { docId?: string }) => {
        console.info(
          '[NotepadToolExtension] Arquivo .wkwdwz baixado após edição online:',
          payload?.docId ?? '(sem id)'
        );
      },
      10,
      this.getName()
    );

    hooks.addAction(
      'tool:notepad:conflict',
      (payload?: { docId?: string }) => {
        console.warn(
          '[NotepadToolExtension] Conflito detectado entre cópia local e remota:',
          payload?.docId ?? '(sem id)'
        );
      },
      10,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeAllHooksForExtension(this.getName());
    console.info('[NotepadToolExtension] Bloco de notas desativado.');
  }
}
