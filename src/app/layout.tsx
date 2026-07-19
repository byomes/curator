import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Curator",
  description: "Book discovery & tracking — spice ratings, Kindle Unlimited, yearly reading stats.",
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
      <body className="min-h-full flex flex-col">
        {session && <Nav name={session.name} />}
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
