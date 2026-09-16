# Features implementadas

Este documento resume as features pedagógicas adicionadas ao CodeWise, o objetivo de cada uma e como utilizá-las. O fluxo principal é:

> diagnóstico → recomendação → execução → feedback → remediação → evidência

## 1. Diagnóstico inicial

### O que é

O diagnóstico registra objetivo profissional, nível percebido, tecnologias de interesse, disponibilidade semanal e experiência prévia do aluno.

Esses dados orientam a primeira recomendação de aprendizagem e permitem comparar o ponto de partida com evidências futuras.

### Como usar

1. Acesse `/onboarding/diagnosis`.
2. Preencha o objetivo, disponibilidade e experiência.
3. Salve o diagnóstico.
4. Volte ao dashboard para receber uma próxima ação contextualizada.

O diagnóstico é necessário antes de iniciar determinadas atividades ou projetos.

## 2. Matriz de competências

### O que é

A matriz reúne competências editoriais e suas relações com:

- desafios e trilhas de exercícios;
- learning outcomes;
- milestones;
- categorias de findings de PR;
- avaliações de mentor.

Cada competência pode estar não avaliada, em desenvolvimento ou demonstrada. O estado deve ser acompanhado pela evidência que o originou.

### Como usar

- O aluno consulta a matriz no dashboard.
- Mentores registram avaliações durante uma sessão de mentoria.
- Exercícios, milestones, reviews e avaliações alimentam a visão de progresso.
- Uma competência demonstrada deixa de ser escolhida como prioridade pela recomendação adaptativa.

## 3. Remediação e reavaliação

### O que é

Uma decisão de review pode gerar uma ação de remediação rastreável. A ação aponta para uma tarefa, exercício ou sessão de mentoria e possui responsável, prazo, status e evidência.

### Como usar

1. O mentor aceita um finding ou solicita mudanças.
2. Cria uma ação de remediação com destino e prazo.
3. O aluno acompanha a ação no dashboard.
4. O aluno executa a correção e envia a evidência.
5. O mentor revisa a evidência e conclui ou mantém a ação aberta.

A reavaliação fica vinculada à ação original; ela não é uma nova decisão isolada.

## 4. Follow-up acionável de mentoria

### O que é

O follow-up de uma sessão pode ser uma ação concreta para o aluno, em vez de apenas uma anotação. A ação pode apontar para uma tarefa, exercício ou próxima pauta de mentoria.

### Como usar

- O mentor cria o follow-up na sessão.
- Define responsável, prazo e destino.
- O aluno acompanha a ação no dashboard e na agenda.
- Lembretes são enviados apenas para ações úteis com prazo.
- A ação pode ser revisada na próxima sessão.

## 5. Fila de atenção do mentor

### O que é

A fila reúne PRs, reviews de exercícios, tarefas bloqueadas, alunos inativos e sessões de mentoria que precisam de atenção.

A fila registra ownership, claim/release, SLA, primeira resposta, conclusão e escalonamento.

### Como usar

1. O mentor abre a fila administrativa.
2. Filtra ou assume um item.
3. Trabalha no item dentro do prazo exibido.
4. Libera o item se outro mentor precisar assumir.
5. A conclusão da atividade atualiza a fila e as métricas.

A capacidade inicial é limitada por mentor para tornar sobrecarga visível.

## 6. Recomendação adaptativa

### O que é

O dashboard calcula uma recomendação determinística usando objetivo, disponibilidade, tecnologias, matriz de competências, feedback recente, remediações e atividade atual.

A recomendação sempre explica o motivo e aponta para uma ação navegável.

### Como usar

1. Complete o diagnóstico.
2. Abra o dashboard.
3. Leia o motivo da recomendação.
4. Siga o link para a remediação, exercício ou projeto.

A prioridade é: remediação aberta, feedback recente, lacuna de competência relevante ao objetivo e, por fim, atividade atual.

## 7. Checks de CI em exercícios

### O que é

Reviews de exercícios exibem o estado dos checks do GitHub antes da revisão humana: sucesso, pendente, falha ou ausência de checks.

Checks não aprovam código automaticamente. Eles apenas removem verificações mecânicas da revisão do mentor.

### Como usar

1. Vincule o exercício a um repositório GitHub.
2. Configure os checks obrigatórios no repositório.
3. Envie o exercício para review.
4. Corrija checks pendentes ou falhos antes de solicitar nova avaliação.
5. O mentor continua responsável pela decisão final.

Sem integração GitHub ou sem checks configurados, a revisão manual continua disponível com um aviso explícito.

## 8. Templates versionados

### O que é

Templates possuem versões imutáveis, status editorial e histórico de alterações. Um projeto iniciado usa um snapshot da versão aprovada naquele momento.

Alterar o template depois não altera projetos já iniciados.

### Como usar

1. O admin cria ou edita um rascunho.
2. Envia a versão para aprovação editorial.
3. Publica somente após a aprovação.
4. Para mudar conteúdo publicado, cria uma nova versão.
5. Novos alunos recebem somente a versão aprovada mais recente.

## 9. Portfólio verificável

### O que é

O portfólio pode apresentar competências demonstradas, projetos, milestones, learning outcomes, reviews e evidências associadas.

A publicação é controlada pelo aluno e respeita as configurações de privacidade do projeto e do repositório.

### Como usar

1. Configure o resumo e os links do projeto.
2. Escolha quais informações podem ser públicas.
3. Aguarde ou solicite a avaliação do mentor quando aplicável.
4. Publique o portfólio.
5. Compartilhe o link `/portfolio/{publicCode}`.

Evidência privada ou não publicada não aparece na página pública.

## 10. Cohorts e projetos colaborativos

### O que é

Uma cohort é uma turma administrada explicitamente, com período, estado e membros próprios.

Um projeto colaborativo de cohort é um projeto gratuito vinculado a uma única turma. Ao vincular o projeto, os membros ativos são inscritos como participantes `Learner`, respeitando `maxParticipants`.

Projetos pagos, projetos de mentoria e projetos com repositório privado não podem ser atribuídos dessa forma.

### Como usar — admin

1. Acesse `/admin/cohorts`.
2. Crie a cohort.
3. Adicione os alunos.
4. Ative a cohort.
5. Selecione um projeto gratuito elegível.
6. Vincule o projeto à cohort.
7. Adicione novos alunos somente enquanto houver capacidade no projeto.

Um projeto já atribuído não pode ser reutilizado em outra cohort.

### Como usar — aluno

1. Acesse `/cohorts`.
2. Consulte os projetos colaborativos atribuídos.
3. Abra o workspace do projeto.
4. Execute o trabalho junto dos demais participantes.

## 11. Peer review entre alunos

### O que é

Um admin pode atribuir a um membro da cohort uma revisão consultiva sobre um Pull Request de outro membro da mesma turma.

O peer review é separado da review do mentor: não altera status, créditos, remediações ou evidências de competência.

### Como usar — admin

1. Acesse `/admin/cohorts`.
2. Selecione uma cohort ativa.
3. Escolha um reviewer, um Pull Request e atribua a revisão.
4. Acompanhe o status no painel administrativo.
5. Descarte a atribuição quando necessário.

O sistema impede auto-revisão e protege repositórios privados.

### Como usar — aluno

1. Acesse `/cohorts`.
2. Abra o Pull Request atribuído.
3. Escreva feedback específico e respeitoso com pelo menos 20 caracteres.
4. Envie o feedback.
5. Consulte também os feedbacks recebidos.

## 12. Moderação e reputação de peer review

### O que é

O autor pode denunciar um feedback inadequado. O admin pode:

- remover o feedback, resolvendo a denúncia;
- rejeitar a denúncia, mantendo o feedback.

A reputação é uma contagem derivada de feedbacks submetidos e mantidos após moderação. Ela não é nota de competência, aprovação de código nem permissão de merge.

### Como usar

- O autor preenche o motivo da denúncia na seção de feedback recebido.
- O admin revisa as denúncias em `/admin/cohorts`.
- Remover feedback marca a atribuição como descartada.
- Feedback descartado não aparece novamente ao aluno e não contribui para a reputação do reviewer.
- O aluno consulta sua contagem de reputação em `/cohorts`.

## 13. Métricas administrativas

### O que é

O dashboard administrativo exibe uma visão da jornada pedagógica:

- alunos com diagnóstico concluído e primeira ação;
- impressões e início de recomendações;
- conclusão de remediações;
- aprovações em segunda avaliação;
- tempo entre cadastro e primeira ação;
- tempo entre diagnóstico e evidência demonstrada;
- tempo médio de resposta e conclusão de reviews;
- itens de atenção de mentor atrasados;
- estados agregados de remediações e peer reviews.

Os eventos são registrados no banco com chaves idempotentes e sem conteúdo de código, texto de feedback ou dados pessoais adicionais. Falha na gravação de analytics não bloqueia a ação pedagógica.

### Como usar

Abra o dashboard administrativo. Os números são agregados do banco e servem para orientar operação, capacidade e acompanhamento pedagógico.

As taxas aparecem como `—` quando ainda não existe denominador suficiente. Métricas de conversão são baseadas em usuários e as consultas possuem limites explícitos para evitar crescimento sem controle.

## 14. Plano de aprendizagem explícito

### O que é

Cada aluno pode manter um plano atual com objetivo e uma sequência de ações escolhidas por ele ou pelo mentor. Uma ação pode apontar para uma tarefa do projeto, exercício, remediação, mentoria ou checklist personalizada.

Cada ação registra:

- posição no plano;
- motivo pedagógico;
- prazo opcional;
- status do compromisso;
- dependências dentro do mesmo plano.

O status do plano não substitui o status da tarefa, exercício ou remediação apontada. A recomendação automática continua sendo uma sugestão; só entra no plano quando alguém a escolhe explicitamente.

### Como usar

- No dashboard do aluno, salve o título e o objetivo do plano.
- Adicione ações e, quando necessário, selecione pré-requisitos.
- Use os controles de início, conclusão, pulo e reabertura para acompanhar o compromisso.
- Reordene as ações com as setas.
- No menu administrativo, abra **Learning plans**, escolha um aluno e ajuste o plano junto com ele.

Uma ação não pode começar ou ser concluída enquanto uma dependência estiver pendente, e dependências cíclicas são rejeitadas.

## 15. Calibração de peer review

### O que é

Antes do primeiro envio em uma cohort, o reviewer consulta uma rubrica por categoria, exemplos de feedback útil, um checklist de envio e responde três cenários curtos. É necessário acertar pelo menos dois cenários para liberar o envio de feedback naquela cohort.

A calibração é versionada no código e o resultado atual fica registrado por reviewer, cohort e versão. Novas versões podem exigir uma nova calibração sem apagar o histórico operacional. A moderação continua disponível para denúncias e exceções.

### Como usar

1. Acesse `/cohorts` e abra uma revisão atribuída.
2. Consulte a rubrica e o checklist antes de escrever.
3. Inicie a calibração quando solicitado.
4. Escolha a categoria mais adequada para cada cenário.
5. Envie o feedback somente depois de atingir a pontuação mínima.

As categorias reutilizam a taxonomia de findings de PR: correção, segurança, performance, design, testes e legibilidade. A calibração não altera reviews de mentor, status de Pull Request, remediações, competências ou merge.

## Regras importantes

- Peer review entre alunos nunca substitui a avaliação do mentor.
- Cohort não concede acesso implícito a projetos fora da turma.
- Reputação não é progresso de competência.
- O sistema não faz matching automático de reviewers.
- O sistema não aprova código ou competência automaticamente com IA.
- As migrations de cohort, calibração e plano de aprendizagem precisam ser aplicadas antes de usar essas telas em produção.
