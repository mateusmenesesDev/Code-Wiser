## Query and Mutation Patterns

This doc explains how to fetch, cache, prefetch/hydrate, and mutate data using tRPC + React Query.

### Libraries

- tRPC v11 + @trpc/react-query
- React Query v5 for caching, batching, and hydration
- SuperJSON for serialization

### Client Setup

- `src/trpc/react.tsx` creates a singleton QueryClient in the browser, with `httpBatchStreamLink` and `loggerLink`.
- `src/trpc/query-client.ts` configures SuperJSON dehydration/serialization and default stale times.
- App layout wraps children with `TRPCReactProvider` to expose `api.*` hooks.

### Queries

#### Basic query

```ts
import { api } from "~/trpc/react";

const { data, isLoading, error } = api.projectTemplate.getApproved.useQuery();
```

#### Query with initial data and disabled refetches

```ts
const { data, isLoading } = api.projectTemplate.getApproved.useQuery(
  undefined,
  {
    initialData: initialProjectsData,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  }
);
```

#### Parallel queries per item

```ts
const progressQueries = api.useQueries((t) =>
  projects.map((p) => t.project.getProjectProgress({ projectId: p.id }))
);
```

#### Derived state with useMemo

Use `useMemo` to compute filtered or enriched datasets from query results.

### Mutations

#### Basic mutation with success side effects

```ts
const utils = api.useUtils();
const { mutate: createProject } = api.project.createProject.useMutation({
  onSuccess: (id) => {
    router.push(`/workspace/${id}`);
    utils.project.getEnrolled.invalidate();
    utils.projectTemplate.getApproved.invalidate();
    utils.user.getCredits.invalidate();
  },
});
```

#### Optimistic updates with rollback

```ts
const utils = api.useUtils();
const updateTaskOrders = api.task.updateTaskOrders.useMutation({
  onMutate: async ({ updates }) => {
    const queryKey = { id: projectId };
    await utils.project.getById.cancel(queryKey);
    const previous = utils.project.getById.getData(queryKey);

    const current = previous?.tasks ?? [];
    const byId = new Map(updates.map((u) => [u.id, u]));
    const optimisticTasks = current.map((t) => {
      const u = byId.get(t.id);
      if (!u) return t;
      return {
        ...t,
        order: u.order,
        ...(u.status ? { status: u.status } : {}),
      };
    });

    utils.project.getById.setData(queryKey, (old) =>
      old ? { ...old, tasks: optimisticTasks } : old
    );

    return { previous };
  },
  onError: (_err, _vars, ctx) => {
    const queryKey = { id: projectId };
    if (ctx?.previous) utils.project.getById.setData(queryKey, ctx.previous);
  },
  onSettled: () => {
    const queryKey = { id: projectId };
    utils.project.getById.invalidate(queryKey);
  },
});
```

### RSC and Prefetching

- Server components can call tRPC via `src/trpc/server.ts` to fetch data with the user’s headers.
- Example: Home page fetches approved templates and user-enrolled projects server-side, then hydrates on the client via `TRPCReactProvider`.

### URL State and Filters

- Use `nuqs` `useQueryState` for URL-driven filters (e.g., project catalog filters), then apply in `useMemo` to query results.

### Error Handling

- tRPC formatter exposes Zod errors; inspect `error` in hooks for user-facing messages.
- Route handlers use `NextResponse.json` with status codes for non-tRPC endpoints.

### Tips

- Keep query keys stable (objects that match input params), as used in `utils.project.getById`.
- Prefer invalidation over manual cache updates unless you need immediate UX (optimistic updates).
- Disable unnecessary refetches when you hydrate from server to avoid waterfalls.
