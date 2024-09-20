import "~/styles/globals.css";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { userId } = auth()
  if (userId) {
    redirect('/')
  }

  return (<>{children}</>)
}
