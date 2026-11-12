/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Extensões nativas pré-instaladas no núcleo do WikiZero / WikiWazzimaGiygg.
 */

import { WikiExtension, HookRegistry } from './Extension';

export class ReadingTimeEnhancer implements WikiExtension {
  getName() { return 'reading-time'; }
  getVersion() { return '1.0.0'; }
  onRegister(_hooks: HookRegistry) {}
}

export class MathKatex implements WikiExtension {
  getName() { return 'math-katex'; }
  getVersion() { return '1.0.0'; }
  onRegister(_hooks: HookRegistry) {}
}

export class SyntaxHighlightGeSHi implements WikiExtension {
  getName() { return 'code-highlight'; }
  getVersion() { return '1.0.0'; }
  onRegister(_hooks: HookRegistry) {}
}

export class CiteAcademicFootnotes implements WikiExtension {
  getName() { return 'footnotes-ref'; }
  getVersion() { return '1.0.0'; }
  onRegister(_hooks: HookRegistry) {}
}

export class InfoboxResponsiveStyler implements WikiExtension {
  getName() { return 'infobox-styler'; }
  getVersion() { return '1.0.0'; }
  onRegister(_hooks: HookRegistry) {}
}

export class DisambiguationNotice implements WikiExtension {
  getName() { return 'disambiguation'; }
  getVersion() { return '1.0.0'; }
  onRegister(_hooks: HookRegistry) {}
}

export class EditorialMetricsCollector implements WikiExtension {
  getName() { return 'word-metrics'; }
  getVersion() { return '1.0.0'; }
  onRegister(_hooks: HookRegistry) {}
}

export class QrCodeQuickShare implements WikiExtension {
  getName() { return 'qr-code-share'; }
  getVersion() { return '1.0.0'; }
  onRegister(_hooks: HookRegistry) {}
}

export class Android23GingerbreadTheme implements WikiExtension {
  getName() { return 'android-23-theme'; }
  getVersion() { return '1.0.0'; }
  onRegister(_hooks: HookRegistry) {}
}

export class CalculatorToolExtension implements WikiExtension {
  getName() { return 'tool-calculator'; }
  getVersion() { return '1.0.0'; }
  onRegister(_hooks: HookRegistry) {}
}

export class WorldClockToolExtension implements WikiExtension {
  getName() { return 'tool-world-clock'; }
  getVersion() { return '1.0.0'; }
  onRegister(_hooks: HookRegistry) {}
}

export class WeatherForecastToolExtension implements WikiExtension {
  getName() { return 'tool-weather'; }
  getVersion() { return '1.0.0'; }
  onRegister(_hooks: HookRegistry) {}
}

export class GeminiStudioToolExtension implements WikiExtension {
  getName() { return 'tool-gemini-studio'; }
  getVersion() { return '1.0.0'; }
  onRegister(_hooks: HookRegistry) {}
}
