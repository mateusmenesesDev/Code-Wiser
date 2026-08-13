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
The project-planning view for organizing tasks by sprint and backlog, distinct from the Board/List views.
_Avoid_: List
