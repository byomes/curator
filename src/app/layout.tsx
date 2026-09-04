import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { NavHeader, NavTabs } from "@/components/Nav";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";

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
      <body className="h-full">
        <ThemeProvider>
          {/* h-dvh + overflow-hidden on the shell, only the middle section
              scrolling — matches the deacon app's shell (its own comment:
              fixed header/footer position jumped on iOS Safari as the
              address bar hid/showed mid-scroll otherwise). */}
          <div className="h-dvh flex flex-col overflow-hidden bg-white dark:bg-[#0f1117] text-gray-900 dark:text-gray-100">
            {session && <NavHeader />}
            <main className="flex-1 overflow-y-auto">{children}</main>
            {session && <NavTabs />}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
