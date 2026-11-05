/**
 * Código-fonte original de view-source:https://wazzimagiygg.com/admin/ferramentasadministrativas.html
 */
export const FERRAMENTAS_ADMINISTRATIVAS_SOURCE = `<!DOCTYPE html><html lang="pt-BR"><head>  <meta charset="UTF-8" />  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>  <title>Menu de Ferramentas Administrativas</title>  <style>    /* RESET SIMPLES */    * {      margin: 0;      padding: 0;      box-sizing: border-box;    }    body {      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;      background: linear-gradient(135deg, #f8f9fa, #e9ecef);      min-height: 100vh;      padding: 2rem;      color: #212529;    }    h1 {      text-align: center;      margin-bottom: 2.5rem;      font-size: 2.2rem;      color: #2c3e50;      letter-spacing: 0.5px;      text-shadow: 0 2px 4px rgba(0,0,0,0.08);    }    /* GRID FLEXÍVEL */    .link-grid {      display: grid;      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));      gap: 1.5rem;      max-width: 1200px;      margin: 0 auto;    }    /* CARD DE LINK */    .link-card {      background: #ffffff;      border-radius: 14px;      padding: 1.2rem 1.5rem;      text-decoration: none;      color: inherit;      display: flex;      align-items: center;      justify-content: space-between;      gap: 1rem;      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.06);      transition: all 0.25s ease;      border: 1px solid #e0e0e0;      position: relative;      overflow: hidden;    }    /* EFEITO HOVER MODERNO */    .link-card::before {      content: "";      position: absolute;      top: 0;      left: -100%;      width: 100%;      height: 100%;      background: linear-gradient(120deg, rgba(0,123,255,0.15), rgba(0,123,255,0.05));      transition: all 0.4s ease;    }    .link-card:hover::before {      left: 0;    }    .link-card:hover {      transform: translateY(-5px);      box-shadow: 0 10px 18px rgba(0, 0, 0, 0.12);      border-color: #ced4da;    }    .link-label {      font-weight: 600;      font-size: 1rem;      flex: 1;      color: #212529;    }    .arrow {      font-size: 1.4rem;      color: #0d6efd;      transition: transform 0.25s ease;    }    .link-card:hover .arrow {      transform: translateX(6px);    }    /* RESPONSIVIDADE */    @media (max-width: 600px) {      body {        padding: 1rem;      }      h1 {        font-size: 1.6rem;      }    }  </style></head><body>  <div id="painel">    <h1>Painel Administrativo</h1>    <div class="link-grid">      <a href="admintools/cadastrarprofessor.html" class="link-card">        <span class="link-label">Cadastrar Professor</span>        <span class="arrow">➔</span>      </a>      <a href="detalhes_cliente/" class="link-card">        <span class="link-label">Procurar informações sobre Cliente</span>        <span class="arrow">➔</span>      </a>      <a href="https://wazzimagiygg.com/admin/admintools/estatisticas/visualizadorgeral/" class="link-card">        <span class="link-label">Administrar armazenamento Firebase</span>        <span class="arrow">➔</span>      </a>      <a href="administrarcustos/" class="link-card">        <span class="link-label">Configurações de Custos</span>        <span class="arrow">➔</span>      </a>      <a href="listadecustosavancada/" class="link-card">        <span class="link-label">Procura de Custos avançado</span>        <span class="arrow">➔</span>      </a>      <a href="gerenciarusuarios/" class="link-card">        <span class="link-label">Página Gerenciadora de Usuários</span>        <span class="arrow">➔</span>      </a>      <a href="htmlcreator/" class="link-card">        <span class="link-label">Adicionar HTML Flutuante</span>        <span class="arrow">➔</span>      </a>        <a href="redirecionador/" class="link-card">        <span class="link-label">Criar redirecionador</span>        <span class="arrow">➔</span>      </a>            </a>        <a href="dados/relatoriosadmin/" class="link-card">        <span class="link-label">Relatórios Administrativos</span>        <span class="arrow">➔</span>      </a>                  </a>        <a href="wiki/pages/" class="link-card">        <span class="link-label">Administrar Wiki Zero</span>        <span class="arrow">➔</span>      </a>            </a>        <a href="checkuser/notificacao/" class="link-card">        <span class="link-label">Inserir Notificação para Usuário</span>        <span class="arrow">➔</span>      </a>            </a>        <a href="https://wazzimagiygg.com/admin/buscadelistadepaginas/" class="link-card">        <span class="link-label">Busca de Lista de Páginas</span>        <span class="arrow">➔</span>      </a>                  </a>        <a href="https://wazzimagiygg.com/admin/admintools/solicitacaodeexlusao/" class="link-card">        <span class="link-label">Solicitação de exclusão de dados</span>        <span class="arrow">➔</span>      </a>                        </a>        <a href="https://wazzimagiygg.com/admin/admintools/gerenciartickets/" class="link-card">        <span class="link-label">Gerenciamento de Tickets</span>        <span class="arrow">➔</span>      </a>                              </a>        <a href="https://wazzimagiygg.com/admin/admintools/estatisticas/wikiwazzimagiygg/" class="link-card">        <span class="link-label">Estatisticas do Wiki WazzimaGiygg</span>        <span class="arrow">➔</span>      </a>      <a href="https://wazzimagiygg.com/admin/chat/admin/" class="link-card">        <span class="link-label">Gerenciar CHAT Admin</span>        <span class="arrow">➔</span>      </a>            <a href="http://wazzimagiygg.com/admin/admintools/listagemdecustos/" class="link-card">        <span class="link-label">Listagem de custos</span>        <span class="arrow">➔</span>      </a>          <a href="https://gspotfverwazzimagiygg.wazzimagiygg.com/D490F/F0ML/DFEf0eF/Ffgg0Ef2/8Gev0F/dd50D5f0.html" class="link-card">        <span class="link-label">Check User Universal</span>        <span class="arrow">➔</span>      </a>          <a href="https://gspotfverwazzimagiygg.wazzimagiygg.com/V900C/DfECfEVAcE/D2FCwFFv0/SrV2F0CwFrR4/AC/iac.html" class="link-card">        <span class="link-label">Check User Irregular</span>        <span class="arrow">➔</span>      </a>              <a href="https://wazzimagiygg.com/admin/admintools/gerenciarforum/index.html" class="link-card">        <span class="link-label">Gerenciar Fórum - </span>        <span class="arrow">➔</span>      </a>              <a href="https://wazzimagiygg.com/admin/gerenciarusuarios/gerenciar.html" class="link-card">        <span class="link-label">Gerenciar Usuários Avançado</span>        <span class="arrow">➔</span>      </a>                    <a href="https://wazzimagiygg.com/admin/blog/admin/" class="link-card">        <span class="link-label">Administrar blog</span>        <span class="arrow">➔</span>      </a>                                <a href="https://wazzimagiygg.com/admin/admintools/redirecionador/" class="link-card">        <span class="link-label">Administrar Links Redirecionados com aviso</span>        <span class="arrow">➔</span>      </a>                          <a href="https://wazzimagiygg.com/admin/admintools/pesquisas/" class="link-card">        <span class="link-label">Administrar Pesquisas</span>        <span class="arrow">➔</span>      </a>          </div>  </div></body></html>`;

export interface FerramentaItem {
  label: string;
  href: string;
  action?: "usuarios" | "cadastrar_professor" | "artigos" | "tickets" | "checkuser" | "notificacao" | "html_creator" | "redirecionador" | "custos";
  category: string;
  isExternal?: boolean;
}

export const FERRAMENTAS_LIST: FerramentaItem[] = [
  {
    label: "Cadastrar Professor",
    href: "admintools/cadastrarprofessor.html",
    action: "cadastrar_professor",
    category: "Gestão Docente"
  },
  {
    label: "Procurar informações sobre Cliente",
    href: "detalhes_cliente/",
    action: "usuarios",
    category: "Perfis & Usuários"
  },
  {
    label: "Administrar armazenamento Firebase",
    href: "https://wazzimagiygg.com/admin/admintools/estatisticas/visualizadorgeral/",
    isExternal: true,
    category: "Infraestrutura Firebase"
  },
  {
    label: "Configurações de Custos",
    href: "administrarcustos/",
    action: "custos",
    category: "Financeiro & Custos"
  },
  {
    label: "Procura de Custos avançado",
    href: "listadecustosavancada/",
    action: "custos",
    category: "Financeiro & Custos"
  },
  {
    label: "Página Gerenciadora de Usuários",
    href: "gerenciarusuarios/",
    action: "usuarios",
    category: "Gestão de Usuários"
  },
  {
    label: "Adicionar HTML Flutuante",
    href: "htmlcreator/",
    action: "html_creator",
    category: "Design & Customização"
  },
  {
    label: "Criar redirecionador",
    href: "redirecionador/",
    action: "redirecionador",
    category: "Roteamento & Redirecionamentos"
  },
  {
    label: "Relatórios Administrativos",
    href: "dados/relatoriosadmin/",
    action: "tickets",
    category: "Auditoria & Métricas"
  },
  {
    label: "Administrar Wiki Zero",
    href: "wiki/pages/",
    action: "artigos",
    category: "Wiki & Acervo"
  },
  {
    label: "Inserir Notificação para Usuário",
    href: "checkuser/notificacao/",
    action: "notificacao",
    category: "Comunicação & Mensageria"
  },
  {
    label: "Busca de Lista de Páginas",
    href: "https://wazzimagiygg.com/admin/buscadelistadepaginas/",
    isExternal: true,
    category: "Indexação & Páginas"
  },
  {
    label: "Solicitação de exclusão de dados",
    href: "https://wazzimagiygg.com/admin/admintools/solicitacaodeexlusao/",
    action: "tickets",
    category: "LGPD & Privacidade"
  },
  {
    label: "Gerenciamento de Tickets",
    href: "https://wazzimagiygg.com/admin/admintools/gerenciartickets/",
    action: "tickets",
    category: "Ouvidoria & Suporte"
  },
  {
    label: "Estatisticas do Wiki WazzimaGiygg",
    href: "https://wazzimagiygg.com/admin/admintools/estatisticas/wikiwazzimagiygg/",
    isExternal: true,
    category: "Métricas & Estatísticas"
  },
  {
    label: "Gerenciar CHAT Admin",
    href: "https://wazzimagiygg.com/admin/chat/admin/",
    action: "checkuser",
    category: "Comunicação Interna"
  },
  {
    label: "Listagem de custos",
    href: "http://wazzimagiygg.com/admin/admintools/listagemdecustos/",
    isExternal: true,
    category: "Financeiro & Custos"
  },
  {
    label: "Check User Universal",
    href: "https://gspotfverwazzimagiygg.wazzimagiygg.com/D490F/F0ML/DFEf0eF/Ffgg0Ef2/8Gev0F/dd50D5f0.html",
    isExternal: true,
    category: "Forense & Auditoria"
  },
  {
    label: "Check User Irregular",
    href: "https://gspotfverwazzimagiygg.wazzimagiygg.com/V900C/DfECfEVAcE/D2FCwFFv0/SrV2F0CwFrR4/AC/iac.html",
    isExternal: true,
    category: "Forense & Auditoria"
  },
  {
    label: "Gerenciar Fórum",
    href: "https://wazzimagiygg.com/admin/admintools/gerenciarforum/index.html",
    isExternal: true,
    category: "Comunidade MASPIA"
  },
  {
    label: "Gerenciar Usuários Avançado",
    href: "https://wazzimagiygg.com/admin/gerenciarusuarios/gerenciar.html",
    action: "usuarios",
    category: "Gestão de Usuários"
  },
  {
    label: "Administrar blog",
    href: "https://wazzimagiygg.com/admin/blog/admin/",
    isExternal: true,
    category: "Editorial"
  },
  {
    label: "Administrar Links Redirecionados com aviso",
    href: "https://wazzimagiygg.com/admin/admintools/redirecionador/",
    isExternal: true,
    category: "Roteamento & Redirecionamentos"
  },
  {
    label: "Administrar Pesquisas",
    href: "https://wazzimagiygg.com/admin/admintools/pesquisas/",
    isExternal: true,
    category: "Pesquisa Acadêmica"
  }
];
