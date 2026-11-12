import JSZip from 'jszip';

/**
 * Utility to generate and download a complete Google Chrome Extension / Web Store Package (Manifest V3)
 * allowing users to install WikiWorldWeb into Google Chrome on Windows, macOS, Linux, or ChromeOS,
 * or upload directly to the Google Chrome Web Store Developer Dashboard.
 */

// Helper to draw an icon on an offscreen canvas and get PNG blob
async function generatePngBlob(size: number): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Background gradient: Elegant Deep Blue to Indigo
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#2563eb');
    gradient.addColorStop(1, '#1d4ed8');
    ctx.fillStyle = gradient;

    // Rounded rectangle shape
    const radius = Math.floor(size * 0.22);
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();

    // Subtle border
    ctx.lineWidth = Math.max(1, Math.floor(size * 0.04));
    ctx.strokeStyle = '#60a5fa';
    ctx.stroke();

    // Central globe / book symbol
    const center = size / 2;
    const r = size * 0.30;

    // Draw globe circle
    ctx.beginPath();
    ctx.arc(center, center, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1.5, Math.floor(size * 0.06));
    ctx.stroke();

    // Longitude ellipse
    ctx.beginPath();
    ctx.ellipse(center, center, r * 0.45, r, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = Math.max(1, Math.floor(size * 0.04));
    ctx.stroke();

    // Equator line
    ctx.beginPath();
    ctx.moveTo(center - r, center);
    ctx.lineTo(center + r, center);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = Math.max(1, Math.floor(size * 0.04));
    ctx.stroke();
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob || new Blob([]));
    }, 'image/png');
  });
}

export async function downloadChromeWebStorePackage(): Promise<void> {
  const zip = new JSZip();

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-ul5azgclkwy3zltg3iyxlw-842441289091.us-east1.run.app';

  // 1. Manifest V3 for Google Chrome
  const manifestJson = {
    manifest_version: 3,
    name: 'WikiWorldWeb - Enciclopédia Livre',
    short_name: 'WikiWorldWeb',
    version: '1.0.0',
    description: 'Acesse a WikiWorldWeb, a enciclopédia colaborativa livre, rápida e sem anúncios diretamente do Google Chrome.',
    homepage_url: appUrl,
    icons: {
      '16': 'icons/icon-16.png',
      '48': 'icons/icon-48.png',
      '128': 'icons/icon-128.png',
    },
    action: {
      default_popup: 'popup.html',
      default_title: 'WikiWorldWeb - Enciclopédia Livre',
      default_icon: {
        '16': 'icons/icon-16.png',
        '48': 'icons/icon-48.png',
        '128': 'icons/icon-128.png',
      },
    },
    background: {
      service_worker: 'background.js',
    },
    omnibox: {
      keyword: 'wiki',
    },
    commands: {
      _execute_action: {
        suggested_key: {
          default: 'Ctrl+Shift+W',
          mac: 'Command+Shift+W',
        },
        description: 'Abrir atalho da WikiWorldWeb no Google Chrome',
      },
    },
    permissions: ['storage'],
  };

  zip.file('manifest.json', JSON.stringify(manifestJson, null, 2));

  // 2. Background Service Worker
  const backgroundJs = `// Background Service Worker for WikiWorldWeb Chrome Extension
const BASE_URL = "${appUrl}";

// Handle omnibox direct keyword search (e.g. typing "wiki termo" in Chrome address bar)
chrome.omnibox.onInputEntered.addListener((text, disposition) => {
  const query = encodeURIComponent(text.trim());
  const searchUrl = text.trim() ? \`\${BASE_URL}/?uid=search&q=\${query}\` : BASE_URL;

  if (disposition === 'currentTab') {
    chrome.tabs.update({ url: searchUrl });
  } else {
    chrome.tabs.create({ url: searchUrl });
  }
});

// Set default omnibox suggestion
chrome.omnibox.setDefaultSuggestion({
  description: "Pesquisar na WikiWorldWeb por: %s"
});

// Installation event
chrome.runtime.onInstalled.addListener((details) => {
  console.log("WikiWorldWeb para Google Chrome instalada com sucesso!", details);
});
`;
  zip.file('background.js', backgroundJs);

  // 3. Popup HTML
  const popupHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>WikiWorldWeb</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { width: 340px; background: #f8fafc; color: #0f172a; padding: 14px; }
    .header { display: flex; items-center; justify-content: space-between; margin-bottom: 12px; }
    .title-box { display: flex; align-items: center; gap: 8px; }
    .logo { width: 28px; height: 28px; border-radius: 6px; background: #2563eb; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; font-size: 14px; }
    .title { font-size: 14px; font-weight: 700; color: #1e293b; }
    .tag { font-size: 9px; font-weight: 700; background: #dbeafe; color: #1d4ed8; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
    
    .search-bar { display: flex; gap: 6px; margin-bottom: 12px; }
    .search-input { flex: 1; padding: 8px 10px; font-size: 12px; border: 1px solid #cbd5e1; border-radius: 6px; outline: none; }
    .search-input:focus { border-color: #2563eb; ring: 2px solid #93c5fd; }
    .search-btn { padding: 8px 12px; background: #2563eb; color: #fff; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .search-btn:hover { background: #1d4ed8; }

    .grid-links { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
    .card-link { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; text-decoration: none; color: #334155; font-size: 11px; font-weight: 600; transition: all 0.15s ease; cursor: pointer; }
    .card-link:hover { border-color: #93c5fd; background: #eff6ff; color: #1d4ed8; }
    .card-icon { font-size: 14px; }

    .open-full-btn { display: block; width: 100%; text-align: center; padding: 9px; background: #0f172a; color: #ffffff; font-size: 12px; font-weight: 600; border-radius: 8px; text-decoration: none; transition: background 0.15s; }
    .open-full-btn:hover { background: #1e293b; }
    .footer-note { margin-top: 10px; text-align: center; font-size: 10px; color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title-box">
      <div class="logo">W</div>
      <div>
        <div class="title">WikiWorldWeb</div>
        <div style="font-size: 10px; color: #64748b;">Enciclopédia Livre</div>
      </div>
    </div>
    <span class="tag">Chrome</span>
  </div>

  <form id="search-form" class="search-bar">
    <input type="text" id="query" class="search-input" placeholder="Pesquisar artigos e tópicos..." autofocus required>
    <button type="submit" class="search-btn">Buscar</button>
  </form>

  <div class="grid-links">
    <a href="${appUrl}/?uid=Special:Weather" target="_blank" class="card-link">
      <span class="card-icon">🌤️</span>
      <span>Tempo Global</span>
    </a>
    <a href="${appUrl}/?uid=Special:Scholar" target="_blank" class="card-link">
      <span class="card-icon">🎓</span>
      <span>Google Acadêmico</span>
    </a>
    <a href="${appUrl}/?view=notebook" target="_blank" class="card-link">
      <span class="card-icon">🧠</span>
      <span>Caderno IA</span>
    </a>
    <a href="${appUrl}/?uid=Special:RecentChanges" target="_blank" class="card-link">
      <span class="card-icon">⚡</span>
      <span>Recentes</span>
    </a>
  </div>

  <a href="${appUrl}" target="_blank" class="open-full-btn">
    🌐 Abrir WikiWorldWeb Completa
  </a>

  <div class="footer-note">
    Dica: Digite <strong>wiki [espaço]</strong> na barra do Chrome para pesquisar direto!
  </div>

  <script src="popup.js"></script>
</body>
</html>
`;
  zip.file('popup.html', popupHtml);

  // 4. Popup JS
  const popupJs = `const BASE_URL = "${appUrl}";

document.getElementById('search-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('query');
  const val = input.value.trim();
  if (val) {
    chrome.tabs.create({ url: \`\${BASE_URL}/?uid=search&q=\${encodeURIComponent(val)}\` });
    window.close();
  }
});
`;
  zip.file('popup.js', popupJs);

  // 5. Icons in various sizes
  const iconsFolder = zip.folder('icons');
  if (iconsFolder) {
    const [blob16, blob48, blob128] = await Promise.all([
      generatePngBlob(16),
      generatePngBlob(48),
      generatePngBlob(128),
    ]);

    iconsFolder.file('icon-16.png', blob16);
    iconsFolder.file('icon-48.png', blob48);
    iconsFolder.file('icon-128.png', blob128);
  }

  // 6. Installation & Chrome Web Store Instructions
  const readmeText = `================================================================================
WIKIWORLDWEB - PACOTE OFICIAL PARA GOOGLE CHROME & CHROME WEB STORE
================================================================================

Este pacote contém todos os arquivos em padrão Manifest V3 homologados pelo
Google Chrome para ser instalado no seu computador ou publicado na Chrome Web Store.

--------------------------------------------------------------------------------
MÉTODO 1: INSTALAR AGORA NO GOOGLE CHROME (Computador / PC / Mac / Linux / Chromebook)
--------------------------------------------------------------------------------
1. Extraia o conteúdo deste arquivo .zip em uma pasta no seu computador.
2. Abra o Google Chrome e digite na barra de endereços:
   chrome://extensions
3. No canto superior direito da tela de extensões, ative a chave:
   [x] "Modo do desenvolvedor" (Developer mode).
4. Clique no botão que surgirá no canto superior esquerdo:
   "Carregar sem compactação" (Load unpacked).
5. Selecione a pasta descompactada que contém este arquivo 'manifest.json'.
6. Pronto! O ícone da WikiWorldWeb aparecerá na barra de ferramentas do Chrome.
   Você pode fixá-lo clicando no ícone de quebra-cabeça do Chrome.

Recursos ativados no Google Chrome:
- Pesquisa rápida instantânea pelo popup.
- Omnibox: digite 'wiki' + [Espaço] na barra de navegação do Chrome para buscar verbetes.
- Atalho global de teclado: Ctrl+Shift+W (ou Command+Shift+W no Mac).
- Links diretos para Previsão do Tempo, Google Acadêmico e Caderno IA.

--------------------------------------------------------------------------------
MÉTODO 2: INSTALAÇÃO COMO PWA DESKTOP DIRETO NO CHROME
--------------------------------------------------------------------------------
Se você prefere o aplicativo como janela nativa independente do Chrome (sem barras):
1. Abra a página da WikiWorldWeb no Google Chrome: ${appUrl}
2. Na barra de endereços do Chrome, clique no ícone de computador/instalação (lado direito).
3. Ou clique nos 3 pontinhos do Chrome (⋮) -> "Salvar e compartilhar" -> "Instalar WikiWorldWeb".
4. O app será adicionado à área de trabalho, menu Iniciar (Windows) ou Launchpad (macOS).

--------------------------------------------------------------------------------
MÉTODO 3: PUBLICAR NA GOOGLE CHROME WEB STORE
--------------------------------------------------------------------------------
Caso você queira disponibilizar publicamente para outros usuários na Chrome Web Store:
1. Acesse o Chrome Developer Dashboard: https://chrome.google.com/webstore/devconsole
2. Faça login com sua conta do Google de desenvolvedor.
3. Clique em "Adicionar novo item" (Add new item).
4. Envie diretamente este arquivo .zip original.
5. Preencha a descrição, screenshots e selecione a categoria "Educação / Referência".
6. Clique em "Enviar para publicação".

WikiWorldWeb - A Enciclopédia Livre, Rápida e Sem Anúncios.
`;
  zip.file('INSTRUCOES_INSTALACAO_CHROME.txt', readmeText);

  // Generate ZIP Blob and trigger browser download
  const content = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = 'wikiworldweb-chrome-app-extension.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}
