import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { NavHeader, NavTabs } from "@/components/Nav";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Curator",
  description: "Book discovery & tracking — spice ratings, Kindle Unlimited.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get(SESSION_COOKIE)?.value);

  return (
    <html lang="en" className="h-full antialiased">
      {/* h-dvh + overflow-hidden on the shell, only the middle section
          scrolling — matches the deacon app's shell (its own comment: fixed
          header/footer position jumped on iOS Safari as the address bar
          hid/showed mid-scroll otherwise). */}
      <body className="h-dvh flex flex-col overflow-hidden">
        {session && <NavHeader name={session.name} />}
        <main className="flex-1 overflow-y-auto">{children}</main>
        {session && <NavTabs />}
      </body>
    </html>
  );
}
