# Mapa de evolução do CodeWise

> Documento de análise do sistema atual e priorização de novas features. A prioridade considera valor para o aluno/mentor, reaproveitamento do que já existe, risco e esforço de implementação.
>
> **Status atualizado em 12/08/2026.** Itens marcados como ✅ já foram implementados na branch `main`; itens 🚧 têm uma primeira versão, mas ainda possuem escopo pendente; itens sem marcação continuam planejados.

### Entregas concluídas

- ✅ **P0.1 — Autorização por recurso:** procedures de usuário, tarefas, comentários, anexos, sprints, epics e reviews passaram a validar autenticação, membership e papel administrativo; testes positivos e negativos foram adicionados.
- ✅ **P0.2 — Ledger de créditos e pagamentos confiáveis:** transações append-only, idempotência para Stripe e operações de projeto, débitos atômicos, reconciliação e histórico de créditos.
- ✅ **P0.3 — Ciclo de vida de PR review:** `requestedBy` e `reviewedBy` separados, histórico de decisões, `reviewedAt` e uma única review ativa por tarefa.
- 🚧 **P0.4 — E2E da jornada principal:** cenário Playwright implementado para catálogo → projeto → tarefa → comentário → PR review → decisão do admin. Ainda falta incorporar a execução ao CI.
- ✅ **P1.1 — Dashboard do aluno e próxima ação:** dashboard autenticado em `/`, consulta agregada server-side com tarefas urgentes, projetos, exercícios, reviews, mentorship e notificações.
- ✅ **P1.2 — Agenda, atrasos e lembretes:** agenda em `/agenda` com faixas de prazo, filtros e lembretes de tarefas próximos do vencimento ou atrasados.
- ✅ **P1.3 — Fila única de atenção do mentor:** fila administrativa paginada com reviews, tarefas bloqueadas, alunos inativos e sessões de mentorship sem contexto, com filtros e links diretos.
- ✅ **Navegação do produto:** shell com navegação consciente de papel; o catálogo de projetos está disponível em `/projects` e tem entrada permanente no menu lateral.

O dashboard é uma primeira versão deliberadamente baseada nas consultas atuais. Ele mostra progresso por tarefas; milestones clonados para o projeto ainda pertencem ao escopo de P1.5.

## 1. Resumo executivo

O CodeWise já é uma plataforma de aprendizagem prática com dois produtos conectados:

1. **Projetos colaborativos**: o aluno escolhe um template, entra em um workspace Scrum/Kanban, executa tarefas, estima trabalho, recebe comentários e solicita code review.
2. **Trilhas de exercícios**: o aluno executa desafios em repositórios GitHub, envia Pull Requests e recebe decisões e feedback de mentores.

A base técnica também está mais avançada do que a lista anterior sugere:

- o app já possui uma API interna tipada com tRPC;
- os routers já estão separados por domínio em `src/server/api/routers/*`;
- o Prisma já modela projetos, tarefas, sprints, epics, reviews, exercícios, mentorship, convites e notificações;
- Clerk, Stripe, Cal.com, UploadThing, Pusher e Groq já estão integrados em diferentes graus.

A recomendação é **não começar por uma reescrita para “API based”**. O maior retorno imediato está em tornar os fluxos existentes confiáveis e conectá-los melhor. Depois disso, podemos expor uma API externa versionada sem abandonar o tRPC usado pelo próprio app.

### Ordem recomendada

1. ✅ **Confiabilidade e segurança:** autorização por projeto, idempotência financeira e ciclo de vida de reviews.
2. 🚧 **Retenção do aluno:** dashboard, agenda e lembretes entregues; roadmap ainda pendente.
3. 🚧 **Operação do mentor:** fila única de atenção entregue; histórico e métricas ainda pendentes.
4. **Integrações de crescimento:** GitHub de verdade e code review assistido por IA.
5. **Expansão:** localização, papéis de equipe, portfólio e analytics.

---

## 2. O que existe hoje

### Jornadas do aluno

| Jornada | Estado atual | Evidências |
| --- | --- | --- |
| Descobrir um projeto | Catálogo público em `/projects`, também acessível pelo menu lateral, com filtros, detalhes, dificuldade, categoria, tecnologias, outcomes e pré-requisitos | `src/app/(system)/projects/page.tsx`, `src/features/projects/` |
| Iniciar um projeto | Criação do projeto a partir de template, clonagem de tarefas/sprints/epics e controle de créditos | `src/server/api/routers/project/`, `prisma/models/project*.prisma` |
| Trabalhar no projeto | Workspace com Kanban, backlog, sprints, filtros, ordenação, tags, prioridades, pontos e responsáveis | `src/features/workspace/`, `src/features/kanban/`, `src/features/backlog/` |
| Colaborar | Comentários, anexos, convites, membros e notificações | `src/features/task/`, `src/server/services/notification/` |
| Estimar trabalho | Planning poker em tempo real com Pusher | `src/features/planningPoker/`, `src/server/api/routers/planningPoker/` |
| Solicitar review | PR manualmente informado na tarefa, com fila administrativa, aprovação e pedido de alterações | `src/features/prReview/`, `src/server/api/routers/prReview/` |
| Executar exercícios | Trilhas, desafios, progresso, envio de PR e revisão por desafio | `src/features/exercises/`, `src/server/api/routers/exercise/` |
| Usar mentorship | Disponibilidade, reserva, cancelamento, reagendamento e limite semanal | `src/features/mentorship/`, `src/server/api/routers/mentorship/` |
| Receber avisos | Bell de notificações persistidas para tarefas, convites, reviews e exercícios | `src/features/notifications/`, `prisma/models/notification.prisma` |

### Operação administrativa

O admin já consegue gerenciar templates, exercícios, usuários, feedbacks, PR reviews e reviews de exercícios. As principais rotas estão em `src/app/(system)/admin/`.

### Arquitetura atual

- **Web e rotas**: Next.js App Router em `src/app`.
- **API interna**: tRPC em `src/server/api/root.ts`, com routers por domínio.
- **Dados**: Prisma em `src/server/db.ts` e modelos divididos em `prisma/models/`.
- **Autorização**: Clerk no middleware e procedures `protectedProcedure`, `adminProcedure` e `mentorshipProcedure`.
- **Estado do servidor**: React Query através dos bindings tRPC.
- **Estado de interface**: estado local, Jotai e parâmetros de URL.

Conclusão: a separação por feature e router já existe. A autorização, o ledger, o ciclo de reviews e a primeira jornada E2E já foram tratados. O que permanece é evoluir as experiências de produto, integrar o E2E ao CI e, quando houver consumidor concreto, definir contratos externos.

---

## 3. Gaps encontrados

Estes pontos devem influenciar a ordem do roadmap.

### Produto

- O dashboard do aluno já reúne projetos, exercícios, reviews, tarefas, mentorship e notificações; ainda não exibe um roadmap baseado em milestones do projeto iniciado.
- O aluno pode ter tarefas com `dueDate`, mas não existe agenda, visão de atrasos ou lembrete específico.
- Milestones existem no template, mas ainda não formam um roadmap de execução do projeto iniciado.
- Sprints e epics têm suporte de backend, mas a experiência de gerenciamento no workspace está incompleta.
- O catálogo está acessível em `/projects`, mas a busca atual é limitada principalmente ao título e ainda não cobre todos os filtros prometidos.
- O checkout de créditos já está habilitado e protegido por idempotência; ainda falta a experiência completa de histórico e recuperação de checkout interrompido.
- PRs são informados por URL manual; não há vínculo com repositório, usuário GitHub, checks ou webhooks.
- A navegação e o workspace precisam de uma revisão para uso em telas pequenas.

### Técnica e operação

- A matriz de autorização por recurso está implementada; novas procedures devem continuar usando `protectedProcedure`/`adminProcedure` e validando membership no servidor.
- O ledger de créditos, as transações atômicas e a idempotência de Stripe, criação de projeto, convites e reviews estão implementados; a reconciliação ainda precisa de operação e UI completas.
- Existe uma suíte E2E Playwright para a jornada principal, com banco e autenticação controlados; falta executar esse cenário automaticamente no CI.
- Notificações são persistidas, mas a interface consulta periodicamente e não oferece paginação completa.

Esses itens não são “features” de marketing, mas são pré-condições para que as próximas features não acumulem dívida e comportamento inseguro.

---

## 4. Backlog priorizado

| Status | Prioridade | Feature | Valor | Esforço | Dependências principais |
| --- | --- | --- | --- | --- | --- |
| ✅ Concluído | P0 | Matriz de autorização e testes de acesso | Muito alto | M | Definir papéis e escopo por projeto |
| ✅ Concluído | P0 | Ledger de créditos e idempotência de pagamentos | Muito alto | M | Migração Prisma e reconciliação de saldo |
| ✅ Concluído | P0 | Ciclo de vida correto de PR review | Alto | M | Ajuste de modelo e dados existentes |
| 🚧 Primeira versão | P0 | E2E do fluxo principal | Alto | M | Integrar execução ao CI |
| ✅ Concluído | P1 | Dashboard do aluno com “próxima ação” | Muito alto | M | Consultas agregadas e eventos básicos |
| ✅ Concluído | P1 | Agenda de tarefas e lembretes | Alto | M | Datas, notificações e preferências |
| ✅ Concluído | P1 | Fila única do mentor | Alto | M | Paginação, status e ordenação por urgência |
| — | P1 | Busca e filtros reais do catálogo | Médio | S | Índices e filtros por categoria/tecnologia |
| ✅ Concluído | P1 | Roadmap de projeto e milestones | Alto | M | Relacionar milestones do template ao projeto |
| — | P1 | Finalizar UI de sprints e epics | Médio | S/M | Aproveitar procedures existentes |
| 🚧 Parcial | P1 | Checkout de créditos e histórico | Alto | M | Ledger pronto; histórico e recuperação ainda pendentes |
| ✅ Concluído | P2 | Integração GitHub | Muito alto | G | GitHub App, consentimento e escopos |
| — | P2 | Code review assistido por IA | Alto | G | Integração GitHub, fila assíncrona e controle de custo |
| ✅ Concluído | P2 | Objetivos e histórico de mentorship | Alto | M | Modelo de sessão e notas |
| — | P2 | Papéis e permissões explícitos | Alto | G | Modelo de membership próprio |
| — | P2 | Localização PT-BR/EN | Médio | M/G | Estratégia de conteúdo traduzível |
| — | P2 | Portfólio e demonstração de projetos | Médio | M | Roadmap, conclusão e privacidade |
| — | P3 | Analytics de aprendizagem e gamificação | Médio | G | Eventos imutáveis e definição de métricas |

**S = pequeno, M = médio, G = grande.** A estimativa é relativa e deve ser refinada após o desenho do modelo de dados.

---

## 5. Definição das features

### ✅ P0.1 — Autorização por recurso

**Status:** concluído. Implementado em `75c12bf` com cobertura de router e utilitários de autorização.

**Objetivo:** garantir que um usuário só veja ou altere recursos dos projetos aos quais tem acesso.

**Escopo inicial:**

- documentar a matriz de acesso para aluno, mentor e admin;
- restringir procedures de usuário ao próprio perfil ou ao admin;
- verificar membership ao consultar tarefa, sprint, epic, comentário e review por ID;
- revisar operações de template e attachments;
- adicionar testes positivos e negativos por domínio.

**Critério de aceite:** um usuário autenticado não consegue acessar dados de outro projeto apenas conhecendo seu ID. O admin continua conseguindo operar as filas administrativas.

### ✅ P0.2 — Ledger de créditos e pagamentos confiáveis

**Status:** concluído em `0b1ee33` e corrigido para CockroachDB em `8e8ae03`.

**Objetivo:** transformar créditos em uma unidade financeira auditável.

**Escopo inicial:**

- criar uma tabela de transações imutáveis com tipo, valor, origem, referência externa e idempotency key;
- registrar compras Stripe, consumo em projeto, consumo em review, reembolsos e ajustes administrativos;
- registrar eventos Stripe processados por `event.id`;
- tornar criação de projeto e débito de créditos uma operação atômica;
- criar histórico de saldo para o usuário e visão de reconciliação para o admin.

**Critério de aceite:** repetir o mesmo webhook, reenviar a mesma requisição ou executar duas inscrições concorrentes não gera créditos ou débitos duplicados.

O botão de compra em `src/features/checkout/components/PricingClient.tsx` foi habilitado depois da implementação do ledger e da idempotência.

### ✅ P0.3 — PR review com ciclo de vida explícito

**Status:** concluído em `89c389b`.

**Objetivo:** representar corretamente quem solicitou, quem revisou e qual é o estado atual.

**Escopo inicial:**

- separar `requestedBy` de `reviewedBy`;
- registrar `reviewedAt` e o admin responsável pela decisão;
- garantir uma única review ativa por tarefa;
- fechar a review anterior quando uma nova versão for enviada;
- manter histórico de decisões e comentários;
- ordenar a fila por idade, status e prioridade.

**Critério de aceite:** o aluno vê claramente se está aguardando, aprovado ou precisa corrigir; o mentor vê o histórico completo sem registros ativos ambíguos.

### 🚧 P0.4 — E2E da jornada principal

**Status:** primeira versão concluída em `1ecd83c`; o cenário está documentado e executável localmente, mas ainda não há job de CI.

**Objetivo:** testar o produto através do navegador, com banco e serviços de teste reais sempre que possível.

**Primeiro cenário:**

1. usuário entra no catálogo;
2. abre um template aprovado;
3. inicia um projeto gratuito de teste;
4. acessa o workspace;
5. cria uma tarefa;
6. altera status e atribuição;
7. adiciona comentário;
8. solicita code review;
9. admin aprova ou solicita alterações;
10. usuário visualiza o resultado.

Usar dados reais de um banco de teste e autenticação controlada. Mocks ficam restritos a serviços externos que não tenham sandbox adequada, como cobrança real. O cenário usa Playwright, com setup de autenticação, banco isolado e teardown por execução.

**Critério de aceite:** o cenário roda de forma repetível em CI, com limpeza/isolamento de dados e diagnóstico de falha por etapa.

---

### ✅ P1.1 — Dashboard do aluno e próxima ação

**Status:** concluído em `f6816f3`; o catálogo ganhou rota própria e entrada no menu em `0f84414`.

**Problema resolvido:** antes desta entrega, o trabalho do aluno estava dividido entre `/my-projects`, exercícios, notificações, PRs e mentorship.

**Proposta:** uma página inicial autenticada que responda “o que devo fazer agora?”.

**Blocos:**

- tarefa mais urgente ou atrasada;
- projetos ativos e progresso por tarefas; o progresso por milestone está reservado para P1.5;
- exercício aguardando envio ou correção;
- review pendente e última decisão;
- próxima sessão de mentorship;
- notificações relevantes, sem transformar tudo em alerta.

A primeira versão foi implementada como uma consulta agregada server-side, sem criar um novo sistema de eventos.

### ✅ P1.2 — Agenda, atrasos e lembretes

**Status:** concluído em `40e97ee`; a migração foi ajustada para CockroachDB em `9f27827`.

**Implementado:** agenda em `/agenda` com visões de tarefas por prazo, filtros por projeto/sprint/responsável e lembretes por cron para tarefas próximas do vencimento e atrasadas.

**Objetivo:** dar uso real ao `Task.dueDate`.

**Escopo:**

- visão “Hoje”, “Próximos 7 dias” e “Atrasadas”;
- filtro por projeto, sprint e responsável;
- lembrete discreto para tarefas próximas do vencimento;
- notificação de tarefa atrasada apenas quando houver ação útil;
- preferência para desativar lembretes.

Não criar uma segunda forma de editar tarefas: a agenda deve reutilizar a mesma procedure do workspace.

### ✅ P1.3 — Fila única de atenção do mentor

**Status:** concluído nesta entrega.

**Implementado:** fila em `/admin/attention` com paginação por cursor, filtros por tipo/prioridade e busca. A fila reúne PR reviews, exercícios aguardando análise, tarefas bloqueadas, alunos inativos e sessões de mentorship próximas sem objetivo ou follow-up; cada item expõe idade, prioridade, próxima ação e link direto. A rota `/admin/mentorship` permite registrar objetivo e follow-up da sessão.

**Objetivo:** reduzir o tempo gasto alternando entre `/admin/pr-reviews`, `/admin/exercise-reviews` e projetos.

**Itens da fila:**

- PR reviews pendentes;
- exercícios aguardando análise;
- projetos com tarefas bloqueadas;
- alunos sem atividade por um período definido;
- sessões de mentorship próximas sem objetivo ou follow-up.

Cada item deve ter idade, prioridade, aluno, projeto/trilha, próxima ação e link direto. A fila deve ter paginação e filtros; não deve carregar todos os registros em uma única consulta.

### P1.4 — Catálogo pesquisável de verdade

**Objetivo:** fazer a descoberta corresponder ao que a interface promete.

**Escopo:**

- título e descrição;
- categoria derivada dos dados;
- tecnologias;
- dificuldade, metodologia e tipo de acesso;
- ordenação por relevância, novidade e dificuldade;
- URL compartilhável para todos os filtros.

Começar com consultas Prisma e índices adequados. Busca dedicada só é necessária quando houver evidência de volume.

### ✅ P1.5 — Roadmap e milestones

**Status:** concluído. Milestones e outcomes agora são clonados como snapshots do projeto; o workspace exibe progresso, bloqueios e outcomes, e admins podem reordenar milestones e marcar entregas como revisadas.

**Objetivo:** conectar o template comprado ao resultado de aprendizagem.

**Escopo:**

- clonar milestones do template para o projeto iniciado;
- associar milestones a sprints, epics ou tarefas;
- mostrar progresso e bloqueios no projeto;
- exibir outcomes esperados no detalhe e na conclusão;
- permitir que o mentor ajuste a ordem ou marque uma entrega como revisada.

A decisão importante é criar uma entidade de milestone do projeto, em vez de exibir diretamente o milestone mutável do template.

### P1.6 — Completar sprints e epics no workspace

**Objetivo:** fechar a diferença entre o backend existente e a experiência do usuário.

**Escopo:**

- editar e excluir sprint diretamente no workspace;
- mostrar epics em backlog e filtros;
- relacionar tarefas a epic/sprint sem sair da tela;
- apresentar estado, datas e progresso de forma consistente;
- remover controles que aparecem mas não têm ação completa.

### P1.7 — Checkout e histórico de créditos

Depois do ledger P0.2:

- habilitar compra de créditos;
- exibir status da transação e recuperação de checkout interrompido;
- mostrar histórico de compras, uso e reembolsos;
- permitir que o admin reconcilie uma transação sem editar saldo diretamente;
- adicionar mensagens de erro acionáveis.

---

### ✅ P2.1 — Integração GitHub

**Status:** concluído nesta entrega. A integração usa GitHub App com estado assinado, tokens de instalação efêmeros, vínculo de repositórios, seleção/validação de PRs, snapshots e webhooks idempotentes. URLs manuais continuam disponíveis como fallback.

**Objetivo:** eliminar o trabalho manual de copiar URLs e permitir que o sistema acompanhe o código real.

**Desenho recomendado:** GitHub App com autorização explícita, escopo mínimo e repositórios instalados pelo usuário/organização.

**Primeira versão:**

- conectar conta ou instalação do GitHub;
- vincular projeto/exercício a um repositório;
- selecionar PR e validar que ele pertence ao repositório vinculado;
- sincronizar título, estado, autor, commits e checks;
- receber webhooks de abertura, atualização, merge e fechamento;
- manter a URL manual como fallback durante a migração.

Não usar `agent-browser` como integração principal de produção. Browser automation é frágil para autenticação, rate limit e mudanças de UI; a API/GitHub App é o seam correto.

### 🚧 P2.2 — Code review assistido por IA

**Status:** primeira versão implementada; análise assíncrona, limites, achados editáveis e decisão humana estão cobertos. A configuração do provedor e a aprovação final do copy ainda dependem de operação/produto.

**Objetivo:** oferecer ao mentor uma primeira análise técnica sem substituir a decisão humana.

**Fluxo:**

1. admin clica em “Analisar com IA” numa review pendente;
2. o sistema captura diff, arquivos relevantes, contexto da tarefa e critérios da trilha;
3. uma execução assíncrona gera achados estruturados;
4. o mentor revisa, edita e aceita ou descarta as sugestões;
5. somente o feedback aprovado pelo mentor chega ao aluno.

**Formato de cada achado:** arquivo/linha, severidade, problema, justificativa, sugestão, confiança e categoria (correção, segurança, performance, design, testes ou legibilidade).

**Regras obrigatórias:**

- GitHub App somente com leitura na primeira versão;
- não enviar secrets, tokens ou arquivos fora do escopo;
- tratar código e comentários do PR como conteúdo não confiável contra prompt injection;
- limitar tamanho, custo, tempo e número de execuções;
- registrar modelo, versão do prompt e resultado para auditoria;
- nunca marcar uma review como aprovada automaticamente;
- deixar claro ao aluno que a análise é assistiva e foi revisada por um mentor.

Esta feature depende diretamente da integração GitHub, de uma fila assíncrona e de política de retenção do código enviado ao modelo.

### ✅ P2.3 — Objetivos e histórico de mentorship

**Status:** concluído nesta entrega. A sessão agora guarda objetivo, notas compartilhadas, nota privada do mentor, ação combinada, prazo e status; o aluno acessa o histórico mesmo depois do fim da assinatura, sem receber notas privadas.

**Objetivo:** transformar reserva de horário em acompanhamento de aprendizagem.

**Implementado:** objetivo antes da sessão, registro administrativo durante/depois, ações visíveis ao aluno, prazo/status da ação, histórico limitado a 100 sessões e rota read-only para ex-mentorados. Dados privados do mentor ficam fora da projeção do aluno e só aparecem na consulta administrativa.

A fila de atenção pede objetivo antes da sessão. O follow-up é registrado depois, para não criar uma cobrança prematura sobre uma informação que ainda não existe.

### P2.4 — Papéis e permissões de projeto

`ProjectRoleEnum` já existe, mas o relacionamento atual de membros não representa explicitamente o papel.

**Proposta:** criar um modelo de membership explícito com usuário, projeto, papel, status, data de entrada e permissões derivadas.

Papéis possíveis na primeira versão: owner, mentor e learner. Não criar permissões configuráveis antes de existir uma necessidade real de dois projetos com regras diferentes.

### P2.5 — Localização PT-BR/EN

**Decisão recomendada:** separar localização da interface de tradução de conteúdo criado pelo usuário.

#### Fase 1 — interface

- escolher uma biblioteca de i18n compatível com App Router;
- detectar preferência do usuário e permitir troca manual;
- traduzir navegação, estados, validações, emails e onboarding;
- manter chaves de tradução por feature;
- definir fallback para PT-BR ou EN.

#### Fase 2 — conteúdo da plataforma

Templates, trilhas e desafios são conteúdo editorial. Para eles, usar tabelas de tradução relacionadas, por exemplo `ProjectTemplateTranslation` e `ExerciseChallengeTranslation`, com idioma, título, descrição e campos editoriais.

#### O que não fazer

Não exigir que o usuário preencha título e descrição de tarefa em dois idiomas. Isso aumenta o custo de cada tarefa e não representa a realidade de uma equipe multilíngue. Para conteúdo dinâmico do aluno, guardar o idioma original e, se houver demanda, oferecer tradução opcional posterior.

Essa decisão evita multiplicar campos `titlePtBr`, `titleEn`, `descriptionPtBr`, `descriptionEn` em todos os modelos e permite adicionar idiomas sem nova migração para cada coluna.

### P2.6 — Portfólio e demonstração de projetos

**Objetivo:** transformar trabalho concluído em evidência de aprendizagem.

**Escopo:**

- página pública opcional por projeto;
- resumo, tecnologias, milestones e tarefas relevantes;
- link de demo e repositório com controle de privacidade;
- feedback ou avaliação do mentor;
- selo de conclusão baseado em critérios explícitos, não apenas em status manual.

O campo `demoUrl` deve ser definido no modelo correto antes de habilitar um botão de preview.

---

## 6. Plano para API externa

A API interna já existe via tRPC. Se “API based” significa permitir clientes externos, integrações ou um app mobile, a migração deve ser gradual:

### Etapa 1 — estabilizar a API interna

- inventariar procedures por domínio;
- corrigir autorização e validação de cada procedure;
- padronizar erros, paginação, filtros e idempotência;
- adicionar testes de contrato para os fluxos que serão expostos.

### Etapa 2 — definir o contrato externo

- escolher os casos de uso reais, não expor todos os routers;
- definir REST versionada (`/api/v1`) ou outro protocolo apenas se houver consumidor concreto;
- separar DTOs públicos dos modelos Prisma;
- definir autenticação, rate limit, quotas, logs e política de breaking changes.

### Etapa 3 — criar adapters finos

- cada endpoint externo chama um caso de uso/procedure já protegido;
- não duplicar regra de negócio em route handlers;
- começar por catálogo, projetos do usuário, tarefas e status de reviews;
- usar OpenAPI somente quando houver necessidade de consumo por terceiros.

### Etapa 4 — migração de consumidores

- o app web continua em tRPC inicialmente;
- clientes externos adotam `/api/v1` por domínio;
- medir uso e erros;
- remover endpoints somente depois de confirmar que não há consumidores.

**Decisão:** não substituir tRPC por REST por preferência arquitetural. A duplicação de contratos e regras seria custo sem benefício até existir um consumidor externo real.

---

## 7. Sequência de implementação sugerida

### Marco 1 — produto confiável

1. ✅ Matriz de autorização.
2. ✅ Ledger de créditos e idempotência Stripe.
3. ✅ Correção do ciclo de vida de PR review.
4. 🚧 Primeiro E2E da jornada projeto → tarefa → review; falta integração ao CI.

### Marco 2 — aluno e mentor orientados por ação

5. ✅ Dashboard de próxima ação.
6. ✅ Agenda e lembretes.
7. ✅ Fila única do mentor.
8. ✅ Roadmap com milestones.
9. Busca real do catálogo.

### Marco 3 — monetização e colaboração completa

10. 🚧 Checkout de créditos habilitado; completar histórico e recuperação de checkout interrompido.
11. Finalizar sprints e epics.
12. Melhorar notificações, paginação e entrega em tempo real.
13. Objetivos e histórico de mentorship.

### Marco 4 — integração e diferenciação

14. GitHub App.
15. Code review assistido por IA.
16. Papéis de projeto.
17. Localização.
18. Portfólio.

---

## 8. O que não priorizar agora

- Reescrever o app inteiro para REST sem um consumidor externo.
- Criar uma camada genérica de “service/repository” apenas para mudar arquivos de lugar.
- Adicionar gamificação antes de medir progresso e resultados de aprendizagem.
- Automatizar aprovação de código com IA.
- Usar agent-browser como integração de GitHub em produção.
- Duplicar todos os campos de conteúdo em PT-BR e EN.
- Criar analytics de velocity/burndown antes de registrar eventos históricos de forma confiável.

Essas decisões reduzem caminhos paralelos e mantêm cada feature apoiada em uma fonte única de verdade.

---

## 9. Critério de pronto para qualquer nova feature

Antes de considerar uma feature pronta, ela deve ter:

- regra de autorização no servidor;
- schema de entrada próximo do domínio;
- estado de erro, carregamento, vazio e recuperação;
- comportamento definido para interrupção ou reenvio;
- teste de procedure ou regra de domínio;
- teste E2E quando atravessar uma jornada crítica;
- migração/backfill reversível quando alterar dados;
- documentação de limites e dependências externas;
- copy final revisada por uma pessoa responsável pelo produto.

## Referências analisadas

- `src/server/api/root.ts`
- `src/server/api/routers/*`
- `src/features/*`
- `src/app/(system)/*`
- `prisma/models/*`
- `docs/current-features.md`
- `docs/technical/design.md`
- `docs/technical/folder-structure.md`
- `package.json`
