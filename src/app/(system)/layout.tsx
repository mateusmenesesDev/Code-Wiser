import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import Header from '~/common/components/Header';
import "~/styles/globals.css";

export const metadata: Metadata = {
  title: {
    template: '%s | Code Wise',
    default: 'Code Wise',
  },
  description: "Code Wise - The best way to learn how to code with senior developers",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  auth().protect({
    unauthenticatedUrl: '/login',
    unauthorizedUrl: '/'
  })

  return (
    <>
      <Header />
      {children}
    </>
  );
}
