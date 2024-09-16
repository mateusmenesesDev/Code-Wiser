import { UserButton } from "@clerk/nextjs";
import { ToggleTheme } from "~/common/components/ToggleTheme";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
  return (
    <HydrateClient>
      <main>
        <h1>Code Wise</h1>
        <ToggleTheme />
        <UserButton />
      </main>
    </HydrateClient>
  );
}
