# Protótipo navegável do portal PPGMCS

**Situação:** conceito demonstrativo para avaliação dos estudantes, docentes e demais envolvidos. **Não é um portal institucional aprovado ou uma aplicação pronta para produção.**

## Acesso

- [Abrir o HTML do protótipo](index.html)
- [Visualizar o protótipo pelo GitHub Pages](https://maiandreh.github.io/ppgmcs-governance/) **após habilitar o Pages com fonte GitHub Actions**.
- [Workflow de publicação](../../.github/workflows/deploy-portal.yml): envia exclusivamente o arquivo HTML para o Pages.
- Para testar localmente, baixe `index.html` e abra no navegador, sem servidor ou dependências externas.

## Como ativar o site

1. Abra **Settings → Pages** no repositório.
2. Em **Build and deployment → Source**, selecione **GitHub Actions**, não **Deploy from a branch**.
3. Acesse **Actions → Publicar protótipo HTML no GitHub Pages** e use **Run workflow** (branch `main`) se não houver execução recente.
4. Verifique se a execução terminou com sucesso e clique no link publicado em **Settings → Pages**.
5. O endereço esperado é `https://maiandreh.github.io/ppgmcs-governance/`.

O workflow publica somente `prototypes/portal/index.html` como a raiz do site (mais um arquivo técnico vazio `.nojekyll`). As pastas `docs/`, `integrations/` e arquivos de governança **não fazem parte do artifact do site**. O repositório em si continua público.

## Funcionalidades demonstradas

- Página inicial e navegação por seções;
- Central "Como podemos ajudar?" com FAQ expansível, busca, filtros por público e links diretos opcionais;
- Calendário acadêmico mensal com **eventos fictícios**, filtros e exportação `.ics`;
- Informações sobre pesquisa, processos seletivos e documentos;
- Layout adaptável e controles básicos de acessibilidade;
- **Sem integração ou link para o Google Forms nesta demonstração pública**. O canal de demandas permanece independente na documentação de governança.

## Cuidados antes de uma versão oficial

1. Validar nome do programa, requisitos acadêmicos, estrutura editorial e informações publicadas.
2. Confirmar endereços e atualidade dos links externos e quaisquer dados de destaque.
3. Substituir os eventos e bancas de demonstração por dados autorizados e homologados.
4. Definir responsáveis pela atualização da agenda, FAQ, editais e documentos.
5. Realizar avaliação de acessibilidade, usabilidade, segurança e proteção de dados.
6. Homologar com a coordenação e instâncias competentes antes de qualquer implantação institucional.

**Importante:** o código HTML está versionado neste diretório. Não há backend, autenticação ou cadastro real de eventos. A implantação no GitHub Pages depende da configuração indicada acima; o funcionamento público deve ser verificado após o deploy.

## Requisitos relacionados

- [FAQ e central de ajuda](../../docs/requisitos-portal-faq.md)
- [Agenda, eventos e bancas](../../docs/requisitos-portal-agenda.md)
- [Governança do projeto](../../docs/governanca.md)
