# Navigation Context

This context defines the product language for the authenticated navigation and the distinction between user work, administration, and account actions.

## Navigation

**Work**:
The user's day-to-day product areas: Exercises, My Projects, and Mentorship when the user has access.
_Avoid_: User menu, Main menu

**Administration**:
Operational areas available to users with the corresponding administrative access: Dashboard, People, Content, Reviews, and Feedback.
_Avoid_: Mentor area, Admin profile

**Dashboard**:
The administrative overview at the entry point of Administration.
_Avoid_: Mentor Dashboard

**Mentorship**:
The user's mentoring area, available only when the user has access to it.
_Avoid_: Mentor Dashboard

**Feedback Inbox**:
The administrative queue for receiving and managing feedback submitted by users.
_Avoid_: Send Feedback

**Send Feedback**:
The user-facing action for submitting feedback about the product.
_Avoid_: Feedback Inbox

## Account

**Profile menu**:
The menu for identity, account/session actions, and sign out; it is not a second product navigation.
_Avoid_: User menu as a product link list

**Admin**:
A user with one or more administrative permissions; Admin is an access category, not a synonym for Mentor.
_Avoid_: Mentor

## Product delivery

**Versão do produto**:
Um marco de entrega de um produto, como `MVP`, `v0.1` ou `v1`, composto por User Stories. Uma versão tem nome, descrição opcional, ordem e, no projeto de um aluno, um status de execução.
_Avoid_: Versão da tarefa, histórico de edições, release quando o contexto for pedagógico

**User Story**:
Uma unidade de valor do produto que pode pertencer a uma única Versão do produto ou permanecer sem versão no backlog.
_Avoid_: Tarefa quando o objetivo for falar do escopo de produto

**Snapshot do projeto**:
A cópia independente do planejamento de um template no momento em que um projeto de aluno é criado. Alterações posteriores no template não mudam esse projeto automaticamente.
_Avoid_: Sincronização do template

**Status da versão**:
O estado de execução de uma Versão do produto em um projeto: planejada, em andamento, concluída ou cancelada. O status não existe como execução no template.
_Avoid_: Status da User Story

## Project management

**Board**:
A workspace view that shows all tasks in status columns, as a Kanban flow.
_Avoid_: Backlog when referring to the workspace view

**List**:
An alternative view of the same project tasks as the Board, organized into collapsible groups by status, sprint, or priority and ordered within each group.
_Avoid_: Table when naming the product view

**Backlog**:
The project-planning view for organizing tasks by sprint and backlog, distinct from the Board/List views. Retirar um item de uma Sprint remove sua associação de planejamento, mas não altera seu status de execução.
_Avoid_: Tratar Backlog como reset automático para o status BACKLOG

**Sprint**:
Um ciclo de execução com duração definida dentro de um projeto. A Sprint é paralela à Versão do produto: a Versão organiza um marco de entrega e a Sprint organiza um período de trabalho; uma Sprint pode incluir User Stories de várias Versões.
_Avoid_: Tratar Sprint como sinônimo de Versão do produto

**Story Points**:
Uma medida relativa do esforço de uma User Story ou tarefa, estimada pela escala Fibonacci estrita: 1, 2, 3, 5, 8, 13 ou 21.
_Avoid_: Horas estimadas ou soma de horas

**Ciclo da Sprint**:
O ciclo de uma Sprint é controlado explicitamente pelo Mentor ou Owner do projeto: as datas definem o timebox, mas não iniciam nem encerram a Sprint automaticamente. Um projeto mantém no máximo uma Sprint ativa. Ao concluir uma Sprint, o trabalho não concluído retorna ao Backlog.
_Avoid_: Encerramento automático pela data

**Compromisso da Sprint**:
O conjunto de pontos comprometidos no momento em que a Sprint é iniciada. O planejamento também acompanha o escopo atual separadamente, para tornar mudanças de escopo visíveis sem reescrever o compromisso original.
_Avoid_: Tratar o escopo atual como se fosse o compromisso original

**Trabalho não estimado**:
Uma User Story ou tarefa sem Story Points que pode participar de uma Sprint. Ela aparece na contagem de tarefas e como risco explícito, mas não compõe os totais de pontos.
_Avoid_: Converter ausência de estimativa em zero pontos

**Progresso da Sprint**:
O indicador principal é a proporção de pontos concluídos em relação aos pontos comprometidos; a proporção de tarefas concluídas é um indicador secundário. Alterações de datas devem permanecer visíveis sem apagar o histórico das métricas coletadas.
_Avoid_: Usar somente quantidade de tarefas como progresso

**Mudança de escopo**:
Durante uma Sprint ativa, o aluno pode adicionar ou remover tarefas. Essas mudanças são permitidas, mas devem permanecer visíveis e não podem alterar retroativamente o Compromisso da Sprint.
_Avoid_: Esconder mudanças de escopo dentro do total atual

**Burndown**:
O gráfico da Sprint compara uma linha ideal baseada no Compromisso da Sprint com a linha real de pontos restantes no escopo atual e marca alterações de escopo ou estimativa.
_Avoid_: Reescrever a linha ideal para fazer a Sprint parecer estável

**Velocity**:
A velocity de uma Sprint é a soma dos Story Points dos itens que estão concluídos no encerramento dela. Trabalho não estimado e trabalho apenas planejado não entram no cálculo.
_Avoid_: Confundir pontos comprometidos com pontos entregues

**Objetivo da Sprint**:
A descrição da Sprint expressa seu objetivo operacional e deve aparecer junto do título, período e progresso; não há um campo paralelo para duplicar esse significado.
_Avoid_: Criar descrição e objetivo como campos concorrentes

**Item planejável**:
Qualquer User Story, Task, Subtask ou Bug pode pertencer a uma Sprint. A ausência de Story Points é válida para qualquer tipo e deve ser mostrada como trabalho não estimado.
_Avoid_: Impedir trabalho auxiliar ou Bugs de serem planejados

**Relatórios de Sprint**:
O burndown pertence ao contexto da Sprint. A velocity pertence ao contexto do projeto e compara as cinco Sprints concluídas mais recentes, mostrando também a média e a variação sem transformar a média em meta.
_Avoid_: Misturar métricas de projetos diferentes na primeira visão

**Ciclo linear**:
Uma Sprint passa de Planning para Active e depois para Completed. Uma Sprint concluída não é reaberta; uma Sprint em Planning pode ser excluída, devolvendo seus itens ao Backlog.
_Avoid_: Alterar silenciosamente uma Sprint histórica

**Sprint atrasada**:
Uma Sprint cuja data final passou enquanto permanece Active é marcada como atrasada, mas não é concluída automaticamente. O Mentor ou Owner ainda precisa encerrar o ciclo explicitamente.
_Avoid_: Fazer a data substituir a decisão de encerramento

**Início da Sprint**:
Para iniciar, uma Sprint precisa de título e intervalo de datas válido. Objetivo e estimativas incompletas são lacunas visíveis, não bloqueios de início.
_Avoid_: Exigir estimativa completa para iniciar

**Resultado da Sprint**:
O encerramento mostra pontos concluídos, pontos restantes e itens devolvidos ao Backlog. Um resultado abaixo do compromisso não recebe automaticamente um julgamento de falha. A velocity conta apenas itens que estão DONE no encerramento; itens concluídos movidos para outra Sprint geram crédito para a Sprint final.
_Avoid_: Reduzir o resultado a sucesso ou fracasso

**Histórico de planejamento**:
Mudanças de escopo e de estimativa registram item, valor anterior e novo, tipo da mudança e autor. A duração da Sprint usa datas livres, com sugestão inicial de duas semanas, sem cadência global obrigatória. O atraso é uma etiqueta derivada sobre uma Sprint Active, não um novo estado.
_Avoid_: Apagar o contexto de como os totais mudaram

**Burndown diário**:
O burndown registra uma leitura por dia do calendário e carrega o último valor quando não há alteração. Eventos de escopo e estimativa aparecem como marcadores; a ausência de dados históricos anteriores à adoção não é preenchida por estimativa.
_Avoid_: Fabricar uma série histórica a partir de dados incompletos

**Planejamento incompleto**:
Uma Sprint pode iniciar com objetivo vazio ou itens não estimados; o painel permite o início e sinaliza essas lacunas. Capacidade individual por aluno não faz parte desta etapa.
_Avoid_: Transformar lacunas de planejamento em bloqueios invisíveis
