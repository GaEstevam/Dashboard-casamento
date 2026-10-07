# Nosso Sim

Dashboard local, responsivo e instalável para organizar um casamento a partir de uma planilha do Google Planilhas.

O projeto transforma dados de convidados, orçamento, pagamentos, cronograma e fornecedores em indicadores, alertas, filtros e visualizações úteis. Todo o processamento acontece no navegador: nenhuma planilha é enviada para um servidor.

## Sobre o projeto

Este projeto foi desenvolvido como uma aplicação de portfólio em **React + TypeScript**, com foco em transformação de dados, experiência de uso e privacidade. Além da interface, ele demonstra leitura de arquivos Excel, normalização de dados inconsistentes, tipagem de domínio, persistência local, responsividade e recursos de PWA.

### Destaques técnicos

- TypeScript em modo estrito e modelos de domínio explícitos.
- Parser de planilhas desacoplado da interface.
- Carregamento assíncrono da biblioteca de Excel para reduzir o bundle inicial.
- Componentes funcionais e estado derivado com hooks do React.
- Persistência e histórico usando APIs nativas do navegador.
- PWA com manifesto, service worker e funcionamento offline.
- Testes automatizados com Vitest.
- Pipeline de CI para formatação, testes, tipos e build.

## Funcionalidades

- Importação de arquivos `.xlsx` com prévia e validação.
- Histórico local das cinco últimas importações, com opção de desfazer.
- Central de alertas para pagamentos, tarefas, contratos, RSVP e orçamento.
- Filtros de convidados, mapa de mesas e exportação em CSV.
- Comparativo financeiro, projeção, custo por convidado e fluxo mensal.
- Cronograma, checklist e prioridades reunidos em lista ou Kanban.
- Cards de fornecedores com valores, contratos e atalhos de contato.
- Tema claro/escuro, cor, monograma, foto e widgets personalizáveis.
- Backup, restauração, impressão e proteção local por senha.
- Progressive Web App: pode ser instalado no computador ou celular.

## Privacidade

Os dados importados são armazenados apenas no `localStorage` do navegador. O projeto não possui backend, banco de dados, telemetria ou integração automática com contas Google.

Não publique planilhas reais, backups `.json` ou arquivos com dados pessoais no repositório. Consulte [SECURITY.md](SECURITY.md) antes de publicar uma instância.

## Como usar

1. No Google Planilhas, abra **Arquivo → Fazer download → Microsoft Excel (.xlsx)**.
2. Abra o dashboard e selecione **Importar planilha**.
3. Confira a prévia e os avisos apresentados.
4. Selecione **Aplicar atualização**.

A estrutura esperada das abas e colunas está documentada em [docs/ESTRUTURA-DA-PLANILHA.md](docs/ESTRUTURA-DA-PLANILHA.md).

## Desenvolvimento local

### Requisitos

- Node.js 20.19 ou superior.
- npm 10 ou superior.

### Instalação

```bash
git clone <URL-DO-SEU-REPOSITORIO>
cd nosso-sim-dashboard
npm ci
npm run dev
```

O Vite exibirá o endereço local da aplicação no terminal.

### Comandos

| Comando                | Descrição                                   |
| ---------------------- | ------------------------------------------- |
| `npm run dev`          | Inicia o servidor de desenvolvimento.       |
| `npm run typecheck`    | Verifica os tipos TypeScript.               |
| `npm run test`         | Executa os testes em modo interativo.       |
| `npm run test:run`     | Executa os testes uma vez, como no CI.      |
| `npm run build`        | Gera a versão de produção em `dist/`.       |
| `npm run preview`      | Abre localmente a versão compilada.         |
| `npm run format`       | Formata o código e a documentação.          |
| `npm run format:check` | Verifica a formatação sem alterar arquivos. |
| `npm run check`        | Verifica formatação, tipos, testes e build. |

## Deploy

O projeto gera uma aplicação estática na pasta `dist/` e não depende de um provedor específico. Ela pode ser publicada em Vercel, Netlify, Cloudflare Pages ou qualquer servidor de arquivos estáticos.

Configuração de build:

```text
Comando: npm run build
Diretório de saída: dist
Versão do Node.js: 22
```

O repositório não contém configuração de deploy vinculada a um serviço. Isso mantém o projeto de portfólio portátil e facilita escolher a plataforma posteriormente.

## Estrutura do projeto

```text
.
├── .github/                 # CI, templates de issues e pull requests
├── docs/                    # documentação funcional
├── public/                  # manifesto, ícone e service worker da PWA
├── src/
│   ├── App.tsx              # telas e interações principais
│   ├── parser.ts            # leitura e validação da planilha
│   ├── seed.ts              # dados fictícios de demonstração
│   ├── styles.css           # identidade visual e responsividade
│   ├── types.ts             # modelos de dados
│   ├── utils.ts             # datas, moeda, downloads e armazenamento
│   └── utils.test.ts        # testes unitários
├── index.html
├── package.json
└── vite.config.ts
```

## Contribuição

Contribuições são bem-vindas. Leia [CONTRIBUTING.md](CONTRIBUTING.md) antes de abrir uma issue ou pull request.

## Licença

Distribuído sob a licença MIT. Consulte [LICENSE](LICENSE).
