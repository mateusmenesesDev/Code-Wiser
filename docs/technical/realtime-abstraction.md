# Real-time Communication with Pusher

## Overview

The application uses Pusher for real-time communication in Planning Poker sessions. The implementation is abstracted through an interface to allow easy migration to other providers in the future if needed.

## Architecture

```
┌─────────────────────────────────────────┐
│         Application Code                 │
│  (Planning Poker Mutations, Hooks)      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      IRealtimeService Interface         │
│  (Abstract interface for real-time)      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Pusher Adapter                   │
│  (Pusher implementation)                 │
└─────────────────────────────────────────┘
```

## Server-Side Implementation

### Interface

Located in `src/server/realtime/interface.ts`:

```typescript
interface IRealtimeService {
  broadcast(channel: string, event: RealtimeEvent): Promise<void>;
  trigger(channel: string, eventName: string, data: unknown): Promise<void>;
  getClientConfig(): ClientConfig;
}
```

### Factory

Located in `src/server/realtime/index.ts`:

The factory instantiates the Pusher service. The abstraction interface allows for easy migration to other providers in the future if needed.

### Usage in Mutations

```typescript
import { getRealtimeService } from "~/server/realtime";

// In your mutation
const realtime = getRealtimeService();
await realtime.trigger(`planning-poker-${sessionId}`, "vote", {
  sessionId,
  taskId,
  userId,
  storyPoints,
});
```

## Client-Side Implementation

### Hook

Located in `src/features/planningPoker/hooks/useRealtimeClient.ts`:

The hook automatically uses the correct provider based on `NEXT_PUBLIC_REALTIME_PROVIDER`:

- `pusher` (default): Uses Pusher JS SDK
- `websocket`: Uses native WebSocket API

### Usage

```typescript
import { useRealtimeClient } from "./useRealtimeClient";

useRealtimeClient({
  sessionId,
  callbacks: {
    onEvent: (message) => {
      // Handle events
    },
    onConnected: () => {
      // Handle connection
    },
    // ...
  },
});
```

## Environment Variables

### Server-Side

```env
# Pusher configuration (required)
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=us2  # optional, defaults to us2
```

### Client-Side

```env
# Pusher configuration (required)
NEXT_PUBLIC_PUSHER_KEY=your_public_key
NEXT_PUBLIC_PUSHER_CLUSTER=us2  # optional, defaults to us2
```

## Adding a New Provider (Future)

If you need to migrate from Pusher to another provider in the future:

### 1. Create Adapter

Create a new file `src/server/realtime/{provider}-adapter.ts` implementing `IRealtimeService`:

```typescript
import type { IRealtimeService } from './interface';

export class {Provider}RealtimeService implements IRealtimeService {
  // Implement all required methods
}
```

### 2. Update Factory

Modify `src/server/realtime/index.ts` to instantiate the new provider.

### 3. Update Client Hook

Modify `src/features/planningPoker/hooks/useRealtimeClient.ts` to use the new provider's client SDK.

## Channel Naming Convention

All Planning Poker channels follow the pattern:

```
planning-poker-{sessionId}
```

Example: `planning-poker-clx123abc456`

## Events

### Server → Client Events

- `vote`: User voted on a task
- `member-joined`: New member joined the session
- `task-finalized`: Task was finalized and moved to next
- `session-ended`: Session was ended

### Event Data Structure

```typescript
interface RealtimeEvent {
  type: string;
  data: unknown;
}
```

## Setup Guide

### Getting Started with Pusher

1. Create a Pusher account at https://pusher.com
2. Create a new app and get your credentials:

   - App ID
   - Key (public key for client)
   - Secret (private key for server)
   - Cluster (e.g., us2, eu, ap-southeast-1)

3. Set environment variables:

   ```env
   PUSHER_APP_ID=your_app_id
   PUSHER_SECRET=your_secret

   NEXT_PUBLIC_PUSHER_KEY=your_public_key
   NEXT_PUBLIC_PUSHER_CLUSTER=us2
   ```

4. The application will automatically use Pusher for all real-time communication.

## Benefits

1. **Easy Provider Switching**: Change one environment variable
2. **No Code Changes**: Application code remains unchanged
3. **Type Safety**: Full TypeScript support
4. **Testability**: Easy to mock for testing
5. **Future-Proof**: Easy to add new providers
