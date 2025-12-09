# Conexão Pusher - Planning Poker

Este documento explica como a conexão em tempo real com o Pusher funciona no sistema de Planning Poker.

## Visão Geral

O sistema utiliza o Pusher para comunicação em tempo real entre os participantes de uma sessão de Planning Poker. A arquitetura é composta por dois hooks principais:

1. **`useRealtimeClient`**: Gerencia a conexão com o Pusher e a inscrição em canais
2. **`usePlanningPoker`**: Utiliza o cliente real-time para gerenciar o estado da sessão

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    usePlanningPoker Hook                      │
│  - Gerencia estado da sessão                                  │
│  - Define callbacks para eventos                              │
│  - Processa eventos recebidos                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ callbacks
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  useRealtimeClient Hook                       │
│  - Inicializa conexão Pusher                                  │
│  - Gerencia inscrição em canais                               │
│  - Bind de eventos do Pusher                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ WebSocket
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                        Pusher Service                         │
│  - Canal: planning-poker-{sessionId}                         │
│  - Eventos: vote, member-joined, task-finalized, session-ended│
└─────────────────────────────────────────────────────────────┘
```

## useRealtimeClient Hook

### Responsabilidades

O hook `useRealtimeClient` é responsável por:

1. **Inicializar a conexão Pusher**: Cria uma instância do Pusher usando as credenciais do ambiente
2. **Gerenciar inscrições em canais**: Inscreve-se no canal específico da sessão
3. **Bind de eventos**: Conecta eventos do Pusher aos callbacks fornecidos
4. **Reutilização de conexão**: Evita criar múltiplas instâncias do Pusher

### Fluxo de Inicialização

```typescript
useEffect(() => {
  // 1. Verifica se sessionId existe
  if (!sessionId) return;

  // 2. Define o nome do canal
  const channelName = `planning-poker-${sessionId}`;

  // 3. Reutiliza instância existente ou cria nova
  if (pusherRef.current) {
    // Verifica se já está inscrito no mesmo canal
    if (channelRef.current === channelName) {
      const existingChannel = pusherRef.current.channel(channelName);
      if (existingChannel) {
        return; // Já está conectado
      }
    }
    // Limpa canal anterior se mudou de sessão
    if (channelRef.current && channelRef.current !== channelName) {
      const prevChannel = pusherRef.current.channel(channelRef.current);
      if (prevChannel) {
        prevChannel.unbind_all();
        pusherRef.current.unsubscribe(channelRef.current);
      }
    }
  } else {
    // Cria nova instância do Pusher
    pusherRef.current = new Pusher(env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: env.NEXT_PUBLIC_PUSHER_CLUSTER,
      forceTLS: true,
    });
  }

  // 4. Bind de eventos de conexão (apenas uma vez)
  if (!eventsBoundRef.current) {
    pusher.connection.bind("connected", () => {
      setIsConnected(true);
      callbacksRef.current.onConnected?.();
    });

    pusher.connection.bind("disconnected", () => {
      setIsConnected(false);
      callbacksRef.current.onDisconnected?.();
    });

    pusher.connection.bind("error", (error: Error) => {
      callbacksRef.current.onError?.(error);
    });
    eventsBoundRef.current = true;
  }

  // 5. Inscreve-se no canal
  const channel = pusher.subscribe(channelName);
  channelRef.current = channelName;

  // 6. Bind de eventos específicos do canal
  channel.bind("vote", (data) => {
    callbacksRef.current.onEvent?.({
      type: "vote",
      data,
    });
  });

  channel.bind("member-joined", (data) => {
    callbacksRef.current.onEvent?.({
      type: "member-joined",
      data,
    });
  });

  channel.bind("task-finalized", (data) => {
    callbacksRef.current.onEvent?.({
      type: "task-finalized",
      data,
    });
  });

  channel.bind("session-ended", (data) => {
    callbacksRef.current.onEvent?.({
      type: "session-ended",
      data,
    });
  });

  // 7. Cleanup ao desmontar ou mudar de sessão
  return () => {
    if (channel && pusherRef.current) {
      channel.unbind_all();
      pusherRef.current.unsubscribe(channelName);
    }
  };
}, [sessionId]);
```

### Otimizações

1. **Reutilização de Instância**: A instância do Pusher é mantida em um `useRef` e reutilizada entre renderizações
2. **Verificação de Canal Existente**: Antes de criar uma nova inscrição, verifica se já está inscrito no canal
3. **Bind Único de Eventos de Conexão**: Os eventos de conexão são bindados apenas uma vez usando `eventsBoundRef`
4. **Atualização de Callbacks via Ref**: Os callbacks são armazenados em um `ref` para evitar reconexões desnecessárias

## usePlanningPoker Hook

### Responsabilidades

O hook `usePlanningPoker` utiliza o `useRealtimeClient` para:

1. **Definir callbacks**: Cria callbacks que processam eventos recebidos
2. **Gerenciar estado**: Atualiza o estado local baseado nos eventos
3. **Sincronizar dados**: Invalida e refaz fetch de queries quando necessário

### Callbacks Definidos

```typescript
const handleRealtimeEvent = useCallback(
  (event: SSEMessage) => {
    switch (event.type) {
      case "vote":
        // Atualiza voto selecionado se for do usuário atual
        if (data.userId === userId && data.taskId === currentTaskId) {
          setSelectedValue(data.storyPoints);
        }
        // Refaz fetch dos votos para atualizar lista
        refetchVotes();
        break;

      case "member-joined":
        // Mostra notificação e atualiza lista de membros
        toast.info(`${data.userName || data.userEmail} joined the session`);
        refetchSession();
        break;

      case "task-finalized":
        // Reseta estado e atualiza sessão para próxima task
        setShowResults(false);
        setSelectedValue(undefined);
        setFinalStoryPoints(null);
        setAllVoted(false);

        // Invalida query de sessão para forçar refetch
        void utils.planningPoker.getSession
          .invalidate({ sessionId })
          .then(() => {
            return refetchSession();
          });
        break;

      case "session-ended":
        // Mostra notificação e atualiza sessão
        toast.success("Session ended!");
        refetchSession();
        break;
    }
  },
  [userId, currentTaskId, refetchVotes, refetchSession, sessionId, utils]
);
```

### Memoização de Callbacks

Para evitar reconexões desnecessárias, os callbacks são memoizados:

```typescript
const onConnected = useCallback(() => {}, []);
const onDisconnected = useCallback(() => {}, []);
const onError = useCallback(() => {}, []);

const onEvent = useCallback(
  (event: { type: string; data: unknown }) => {
    handleRealtimeEvent(event as SSEMessage);
  },
  [handleRealtimeEvent]
);

const realtimeCallbacks = useMemo(
  () => ({
    onConnected,
    onDisconnected,
    onError,
    onEvent,
  }),
  [onConnected, onDisconnected, onError, onEvent]
);
```

## Como Eventos São Enviados ao Pusher (Servidor)

### Servidor: Disparo de Eventos

No servidor, os eventos são disparados através das mutations do tRPC. O serviço real-time está disponível no contexto do tRPC como `ctx.realtime`, seguindo o mesmo padrão do banco de dados (`ctx.db`).

O fluxo funciona assim:

1. **Acessar serviço real-time**: Usa `ctx.realtime` que é uma instância do `PusherRealtimeService` disponível no contexto
2. **Chamar trigger**: Usa o método `trigger()` para enviar o evento ao Pusher
3. **Pusher distribui**: O Pusher recebe o evento e distribui para todos os clientes inscritos no canal

**Vantagens de usar o contexto:**

- Consistente com o padrão do projeto (`ctx.db`)
- Facilita testes (pode mockar no contexto)
- Mais explícito e fácil de entender
- Centralizado e reutilizável

### Exemplo: Evento de Voto

```typescript
// src/server/api/routers/planningPoker/mutations/planningPoker.mutations.ts

vote: protectedProcedure.input(voteSchema).mutation(async ({ ctx, input }) => {
  // 1. Validações e lógica de negócio...

  // 2. Salva o voto no banco de dados
  const vote = await ctx.db.planningPokerVote.upsert({
    where: {
      sessionId_taskId_userId: {
        sessionId: input.sessionId,
        taskId: currentTaskId,
        userId: ctx.session.userId,
      },
    },
    update: {
      storyPoints: input.storyPoints ?? null,
      updatedAt: new Date(),
    },
    create: {
      sessionId: input.sessionId,
      taskId: currentTaskId,
      userId: ctx.session.userId,
      storyPoints: input.storyPoints ?? null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // 3. DISPARA EVENTO VIA PUSHER
  await ctx.realtime.trigger(
    `planning-poker-${input.sessionId}`, // Nome do canal
    "vote", // Nome do evento
    {
      // Dados do evento
      sessionId: input.sessionId,
      taskId: currentTaskId,
      userId: vote.user.id,
      storyPoints: vote.storyPoints,
    }
  );

  return vote;
});
```

### Configuração no Contexto do tRPC

O serviço real-time é adicionado ao contexto do tRPC, seguindo o mesmo padrão do banco de dados:

```typescript
// src/server/api/trpc.ts

import { db } from "~/server/db";
import { getRealtimeService } from "~/server/realtime";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = auth();
  const orgRole = (session.sessionClaims?.o as OrganizationData)?.rol;
  const isAdmin = orgRole === "admin" || session.has({ role: "org:admin" });

  return {
    db,
    realtime: getRealtimeService(), // Serviço real-time disponível no contexto
    session,
    isAdmin,
    ...opts,
  };
};
```

**Nota**: `getRealtimeService()` usa um padrão singleton, então a mesma instância é reutilizada em todas as requisições. Isso é eficiente e não cria múltiplas conexões com o Pusher.

### Implementação do trigger (Pusher Adapter)

```typescript
// src/server/realtime/pusher-adapter.ts

import Pusher from "pusher";
import type { IRealtimeService } from "./interface";
import type { RealtimeConfig, RealtimeEvent } from "./types";

export class PusherRealtimeService implements IRealtimeService {
  private pusher: Pusher;
  private config: RealtimeConfig;

  constructor(config: RealtimeConfig) {
    this.config = config;
    this.pusher = new Pusher({
      appId: config.appId!,
      key: config.key,
      secret: config.secret!,
      cluster: config.cluster,
      useTLS: config.encrypted,
    });
  }

  async trigger(
    channel: string,
    eventName: string,
    data: unknown
  ): Promise<void> {
    // Chama o método trigger do SDK do Pusher
    // Isso envia o evento para todos os clientes inscritos no canal
    await this.pusher.trigger(channel, eventName, data);
  }
}
```

### Todos os Eventos Disparados

#### 1. vote

```typescript
// Quando um usuário vota ou muda seu voto
await ctx.realtime.trigger(`planning-poker-${input.sessionId}`, "vote", {
  sessionId: input.sessionId,
  taskId: currentTaskId,
  userId: vote.user.id,
  storyPoints: vote.storyPoints,
});
```

#### 2. member-joined

```typescript
// Quando um membro entra na sessão (createSession ou joinSession)
await ctx.realtime.trigger(`planning-poker-${sessionId}`, "member-joined", {
  sessionId: sessionId,
  userId: user.id,
  userName: user.name,
  userEmail: user.email,
});
```

#### 3. task-finalized (linhas 397-408)

```typescript
// Quando o criador finaliza uma task
await realtime.trigger(`planning-poker-${input.sessionId}`, "task-finalized", {
  sessionId: input.sessionId,
  taskId: currentTaskId,
  finalStoryPoints: input.finalStoryPoints ?? null,
  nextTaskIndex: isLastTask ? null : nextIndex,
});
```

#### 4. session-ended (linhas 452-459)

```typescript
// Quando o criador encerra a sessão
await realtime.trigger(`planning-poker-${input.sessionId}`, "session-ended", {
  sessionId: input.sessionId,
});
```

## Como o Frontend Recebe Notificações do Pusher

### Visão Geral

Quando um evento é disparado no servidor (ex: um membro vota), o Pusher distribui esse evento para **todos os clientes** inscritos no canal. No frontend, o `useRealtimeClient` recebe esses eventos através de WebSocket e os repassa para o `usePlanningPoker`, que atualiza o estado da UI.

### Fluxo Detalhado: Usuário Membro Vota → Mentor Recebe Notificação

```
┌─────────────────────────────────────────────────────────────┐
│ 1. MEMBRO VOTA (Frontend)                                   │
│    - handleVote() é chamado                                 │
│    - voteMutation.mutate() envia voto ao servidor           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP Request (tRPC)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. SERVIDOR PROCESSA (Backend)                               │
│    - planningPoker.vote mutation                             │
│    - Salva voto no banco de dados                            │
│    - ctx.realtime.trigger() dispara evento 'vote'            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Pusher API (HTTP)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. PUSHER DISTRIBUI                                          │
│    - Recebe evento via trigger()                             │
│    - Identifica canal: planning-poker-{sessionId}            │
│    - Envia evento via WebSocket para TODOS os clientes       │
│      inscritos no canal (mentor + membros)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ WebSocket (Pusher → Clientes)
                       ├──────────────────┬──────────────────┐
                       ▼                  ▼                  ▼
        ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
        │  MENTOR (Cliente)│  │ MEMBRO A (Cliente)│  │ MEMBRO B (Cliente)│
        └─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Como o Frontend Recebe o Evento

#### Passo 1: Pusher SDK Recebe o Evento

O Pusher SDK (no navegador) recebe o evento via WebSocket:

```typescript
// src/features/planningPoker/hooks/useRealtimeClient.ts

// O Pusher SDK automaticamente recebe eventos do servidor Pusher
// quando um evento é disparado no canal que o cliente está inscrito
```

#### Passo 2: Channel Bind Captura o Evento

O evento é capturado pelo `channel.bind()` que foi configurado:

```typescript
// useRealtimeClient.ts - linha 75-80

channel.bind("vote", (data: unknown) => {
  // Este callback é executado quando o evento 'vote' chega
  // data contém: { sessionId, taskId, userId, storyPoints }

  callbacksRef.current.onEvent?.({
    type: "vote",
    data, // Passa os dados do evento para o callback
  });
});
```

#### Passo 3: Callback onEvent é Executado

O callback `onEvent` (definido no `usePlanningPoker`) é chamado:

```typescript
// usePlanningPoker.ts - linha 231-236

const onEvent = useCallback(
  (event: { type: string; data: unknown }) => {
    handleRealtimeEvent(event as SSEMessage);
  },
  [handleRealtimeEvent]
);
```

#### Passo 4: handleRealtimeEvent Processa o Evento

O `handleRealtimeEvent` processa o evento e atualiza o estado:

```typescript
// usePlanningPoker.ts - linha 185-223

const handleRealtimeEvent = useCallback(
  (event: SSEMessage) => {
    switch (event.type) {
      case "vote": {
        const data = event.data as VoteSSEData;
        // data = { sessionId, taskId, userId, storyPoints }

        // Se for o voto do próprio usuário, atualiza o valor selecionado
        if (data.userId === userId && data.taskId === currentTaskId) {
          setSelectedValue(data.storyPoints);
        }

        // IMPORTANTE: Refaz fetch dos votos para atualizar a lista
        // Isso atualiza a UI mostrando que o membro votou
        refetchVotes();
        break;
      }
      // ... outros casos
    }
  },
  [userId, currentTaskId, refetchVotes, refetchSession, sessionId, utils]
);
```

#### Passo 5: UI é Atualizada

Quando `refetchVotes()` é chamado:

1. **React Query refaz a query** `planningPoker.getSessionVotes`
2. **Novos dados chegam** com o voto do membro
3. **Componentes re-renderizam** com os novos dados
4. **Mentor vê o voto** na lista de participantes e nos resultados

### Exemplo Prático: Mentor Vendo Voto do Membro

```typescript
// 1. Membro vota (valor: 5)
//    → Servidor dispara evento 'vote' com { userId: 'membro-id', storyPoints: 5 }

// 2. Pusher envia evento para todos no canal
//    → Mentor recebe evento via WebSocket

// 3. useRealtimeClient recebe evento
channel.bind('vote', (data) => {
  // data = { sessionId, taskId, userId: 'membro-id', storyPoints: 5 }
  callbacksRef.current.onEvent?.({ type: 'vote', data });
});

// 4. usePlanningPoker processa
handleRealtimeEvent({ type: 'vote', data }) {
  // Não é o voto do mentor, então não atualiza selectedValue
  // Mas chama refetchVotes()
  refetchVotes();
}

// 5. React Query refaz fetch
//    → Busca votos atualizados do servidor
//    → Retorna: [{ userId: 'membro-id', storyPoints: 5, ... }]

// 6. UI atualiza
//    → MemberList mostra que membro votou (hasVoted: true)
//    → VoteResults mostra o voto do membro
//    → Se todos votaram, mostra resultados
```

### Componentes que Reagem aos Eventos

#### MemberList Component

```typescript
// O componente MemberList usa o estado 'members' do usePlanningPoker
// Quando refetchVotes() atualiza os votos, o estado membersWithVoteStatus
// é recalculado e mostra quem votou

const membersWithVoteStatus =
  sessionParticipants.data?.map((member) => ({
    ...member,
    hasVoted: votedUserIds.has(member.id), // Atualizado quando votos mudam
  })) ?? [];
```

#### VoteResults Component

```typescript
// O componente VoteResults mostra os votos de todos
// Quando refetchVotes() atualiza, os novos votos aparecem
```

### Sincronização em Tempo Real

**Todos os participantes** (mentor e membros) recebem os mesmos eventos:

- ✅ Quando um membro vota → **todos** veem o voto
- ✅ Quando um membro muda o voto → **todos** veem a mudança
- ✅ Quando o mentor finaliza uma task → **todos** avançam para próxima task
- ✅ Quando um novo membro entra → **todos** veem a notificação

Isso acontece porque:

1. Todos estão inscritos no **mesmo canal**: `planning-poker-{sessionId}`
2. O Pusher distribui eventos para **todos os inscritos**
3. Cada cliente processa o evento e atualiza sua própria UI

## Fluxo de Comunicação Completo

### 1. Inicialização

```
Usuário entra na sessão
    ↓
usePlanningPoker é montado
    ↓
useRealtimeClient é chamado com sessionId
    ↓
Pusher conecta e inscreve no canal planning-poker-{sessionId}
    ↓
Callbacks são bindados aos eventos
```

### 2. Evento de Voto (Fluxo Completo)

```
┌─────────────────────────────────────────────────────────────┐
│ CLIENTE: Usuário A vota                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ handleVote() chama mutation
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ CLIENTE: tRPC mutation.vote()                              │
│  - Envia { sessionId, storyPoints }                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP Request
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ SERVIDOR: planningPoker.vote mutation                      │
│  1. Valida sessão e permissões                              │
│  2. Salva/atualiza voto no banco                            │
│  3. ctx.realtime.trigger('planning-poker-{id}', 'vote', data)│
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Pusher API
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ PUSHER SERVICE                                              │
│  - Recebe evento via trigger()                              │
│  - Distribui para todos inscritos no canal                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ WebSocket
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ CLIENTE: useRealtimeClient                                  │
│  - Recebe evento 'vote' via channel.bind()                   │
│  - Chama callbacksRef.current.onEvent()                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ onEvent callback
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ CLIENTE: usePlanningPoker                                   │
│  - handleRealtimeEvent() processa evento                    │
│  - Atualiza selectedValue se for do usuário                 │
│  - refetchVotes() atualiza lista de votos                   │
└─────────────────────────────────────────────────────────────┘
```

### 3. Finalização de Task

```
Criador finaliza task
    ↓
Mutation finaliza task no servidor
    ↓
Servidor atualiza currentTaskIndex e dispara evento
    ↓
Pusher envia evento 'task-finalized' para todos
    ↓
useRealtimeClient recebe evento
    ↓
usePlanningPoker processa evento
    ↓
Invalida query de sessão
    ↓
Refetch da sessão atualiza currentTaskId
    ↓
useEffect detecta mudança em currentTaskId
    ↓
Reseta estado e refaz fetch dos votos da nova task
```

## Eventos Suportados

### vote

- **Quando**: Um participante vota ou muda seu voto
- **Dados**: `{ sessionId, taskId, userId, storyPoints }`
- **Ação**: Atualiza voto selecionado e refaz fetch dos votos

### member-joined

- **Quando**: Um novo membro entra na sessão
- **Dados**: `{ sessionId, userId, userName, userEmail }`
- **Ação**: Mostra notificação e atualiza lista de membros

### task-finalized

- **Quando**: O criador finaliza uma task e move para a próxima
- **Dados**: `{ sessionId, taskId, finalStoryPoints, nextTaskIndex }`
- **Ação**: Reseta estado, invalida sessão e atualiza para próxima task

### session-ended

- **Quando**: O criador encerra a sessão
- **Dados**: `{ sessionId }`
- **Ação**: Mostra notificação e atualiza sessão

## Configuração

As variáveis de ambiente necessárias são:

```env
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=us2
```

Essas variáveis são acessadas através do objeto `env` importado de `~/env`.

## Considerações Importantes

1. **Reconexão Automática**: O Pusher gerencia reconexões automaticamente em caso de perda de conexão
2. **Cleanup**: Ao desmontar o componente ou mudar de sessão, o canal é desinscrito e eventos são desbindados
3. **Memoização**: Callbacks são memoizados para evitar reconexões desnecessárias
4. **Refs**: Uso de refs para manter referências estáveis sem causar re-renderizações
5. **Invalidação de Queries**: Quando necessário, queries são invalidadas para forçar refetch com dados atualizados

## Troubleshooting

### Conexão não estabelece

- Verifique se as variáveis de ambiente estão configuradas
- Verifique se o cluster está correto
- Verifique logs do navegador para erros do Pusher

### Eventos não chegam

- Verifique se está inscrito no canal correto
- Verifique se o servidor está disparando eventos corretamente
- Verifique se os binds de eventos estão sendo feitos

### Reconexões frequentes

- Verifique se os callbacks estão sendo memoizados corretamente
- Verifique se não há mudanças desnecessárias nas dependências dos hooks
