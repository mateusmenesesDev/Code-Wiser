# Recomendação: Sistema de Notificações com Ícone de Sino

## Contexto

Você precisa implementar um sistema de notificações in-app (ícone de sino) para eventos como:

- "Usuário A solicitou pull request no projeto X"
- Outros eventos do sistema

## Análise das Opções

### 1. Construção Própria com Pusher Channels (Recomendado) ⭐

**Tecnologias:**

- Pusher Channels (já configurado no projeto)
- Prisma (banco de dados)
- React Query (cache e sincronização)
- Shadcn UI (componentes)

**Vantagens:**

- ✅ **Sem custos adicionais**: Já usa Pusher Channels
- ✅ **Controle total**: Customização completa
- ✅ **Consistente**: Mesma stack do projeto
- ✅ **Flexível**: Fácil adicionar novos tipos de notificação
- ✅ **Type-safe**: Com tRPC e TypeScript
- ✅ **Persistente**: Notificações salvas no banco
- ✅ **Offline**: Notificações aparecem quando usuário volta

**Desvantagens:**

- ⚠️ Desenvolvimento inicial maior
- ⚠️ Precisa gerenciar estado de "lida/não lida"

**Implementação:**

```
┌─────────────────────────────────────────────────────────┐
│ Evento ocorre (ex: PR solicitado)                        │
│   ↓                                                       │
│ Servidor: Salva notificação no banco                     │
│ Servidor: ctx.realtime.trigger('user-{userId}', 'notification', data)│
│   ↓                                                       │
│ Pusher: Distribui para cliente do usuário                 │
│   ↓                                                       │
│ Frontend: Recebe evento via Pusher                       │
│ Frontend: Adiciona notificação ao estado                 │
│ Frontend: Atualiza contador no ícone de sino             │
└─────────────────────────────────────────────────────────┘
```

### 2. Pusher Beams

**O que é:**

- Serviço de **push notifications** (navegador/device)
- Diferente do Pusher Channels (que você já usa)

**Vantagens:**

- ✅ Notificações mesmo com app fechado
- ✅ Suporte a mobile push (iOS/Android)
- ✅ Gerenciamento de dispositivos

**Desvantagens:**

- ❌ **Custo adicional**: Plano separado do Pusher Channels
- ❌ **Complexidade**: Precisa configurar service workers
- ❌ **Permissões**: Usuário precisa permitir notificações do navegador
- ❌ **Não é necessário**: Para notificações in-app, não precisa de push
- ❌ **Overkill**: Muito mais do que você precisa

**Quando usar:**

- Apenas se precisar de notificações quando o usuário está offline/fora do app
- Se quiser notificações mobile nativas

### 3. Outras Bibliotecas

#### OneSignal

- Similar ao Pusher Beams
- Foco em push notifications
- Não necessário para notificações in-app

#### Firebase Cloud Messaging (FCM)

- Gratuito, mas adiciona dependência do Google
- Foco em push notifications
- Não necessário para notificações in-app

#### react-hot-toast / react-toastify

- Apenas para toasts temporários
- Não persiste notificações
- Não tem ícone de sino com contador

## Recomendação Final: Construção Própria

### Por quê?

1. **Já tem a infraestrutura**: Pusher Channels funcionando
2. **Sem custos extras**: Reutiliza o que já tem
3. **Melhor UX**: Notificações in-app são mais rápidas que push
4. **Controle total**: Customização completa
5. **Type-safe**: Com tRPC e Prisma

### Arquitetura Proposta

```
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Servidor)                        │
│                                                               │
│  1. Evento ocorre (ex: PR solicitado)                       │
│  2. Salva notificação no banco (Prisma)                      │
│  3. ctx.realtime.trigger('user-{userId}', 'notification')  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Pusher Channels
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Cliente)                        │
│                                                               │
│  1. useNotifications hook                                    │
│     - Inscreve em canal 'user-{userId}'                      │
│     - Recebe eventos via Pusher                             │
│     - Gerencia estado local                                  │
│                                                               │
│  2. NotificationBell Component                               │
│     - Ícone de sino (lucide-react)                           │
│     - Badge com contador de não lidas                        │
│     - Dropdown com lista de notificações                     │
│                                                               │
│  3. tRPC Queries/Mutations                                   │
│     - getNotifications: Busca do banco                       │
│     - markAsRead: Marca como lida                            │
│     - markAllAsRead: Marca todas como lidas                 │
└─────────────────────────────────────────────────────────────┘
```

### Estrutura de Banco de Dados

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      NotificationType
  title     String
  message   String
  link      String?  // URL para onde redirecionar
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
  readAt    DateTime?

  user      User     @relation(fields: [userId], references: [id])

  @@index([userId, read])
  @@index([userId, createdAt])
}

enum NotificationType {
  PR_REQUESTED
  PR_APPROVED
  PR_CHANGES_REQUESTED
  TASK_ASSIGNED
  COMMENT_MENTION
  // ... outros tipos
}
```

### Componentes Necessários

1. **NotificationBell** (ícone de sino)

   - Badge com contador
   - Dropdown com lista
   - Usa Shadcn DropdownMenu

2. **NotificationList** (lista de notificações)

   - Scroll infinito
   - Marca como lida ao clicar
   - Agrupamento por data

3. **useNotifications** (hook)
   - Gerencia estado
   - Conecta com Pusher
   - Sincroniza com banco

### Fluxo de Implementação

1. **Criar schema Prisma** (Notification model)
2. **Criar tRPC router** (queries e mutations)
3. **Criar hook useNotifications** (similar ao usePlanningPoker)
4. **Criar componente NotificationBell** (Shadcn UI)
5. **Integrar eventos** (quando PR é solicitado, dispara notificação)

### Exemplo de Uso

```typescript
// Quando PR é solicitado
await ctx.realtime.trigger(`user-${prAuthorId}`, "notification", {
  id: notification.id,
  type: "PR_REQUESTED",
  title: "Pull Request Solicitado",
  message: `${userName} solicitou PR no projeto ${projectName}`,
  link: `/workspace/${projectId}/pr/${prId}`,
});
```

## Comparação Rápida

| Critério                 | Construção Própria        | Pusher Beams           | OneSignal/FCM                        |
| ------------------------ | ------------------------- | ---------------------- | ------------------------------------ |
| **Custo**                | ✅ Grátis (já tem Pusher) | ❌ Plano adicional     | ⚠️ Gratuito mas adiciona dependência |
| **Complexidade**         | ⚠️ Média                  | ❌ Alta                | ❌ Alta                              |
| **Controle**             | ✅ Total                  | ⚠️ Limitado            | ⚠️ Limitado                          |
| **Type-safe**            | ✅ Sim (tRPC)             | ❌ Não                 | ❌ Não                               |
| **Persistência**         | ✅ Sim (Prisma)           | ⚠️ Precisa implementar | ⚠️ Precisa implementar               |
| **Notificações Offline** | ❌ Não                    | ✅ Sim                 | ✅ Sim                               |
| **Tempo de Dev**         | ⚠️ 2-3 dias               | ❌ 1 semana+           | ❌ 1 semana+                         |

## Conclusão

**Recomendação: Construção Própria com Pusher Channels**

É a melhor opção porque:

- Reutiliza infraestrutura existente
- Sem custos adicionais
- Controle total e type-safe
- Alinhado com a arquitetura do projeto
- Notificações in-app são mais rápidas e diretas

**Quando considerar Pusher Beams:**

- Se precisar de notificações quando usuário está offline
- Se quiser notificações mobile nativas
- Se tiver orçamento para plano adicional

Para notificações in-app (ícone de sino), a construção própria é a melhor escolha.
