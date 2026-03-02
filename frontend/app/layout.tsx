import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Comply-v2",
  description: "RIA Compliance Management Platform",
};

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/scanner", label: "Glass Box Scanner" },
  { href: "/policies", label: "Policies" },
  { href: "/audit", label: "Audit Log" },
  { href: "/calendar", label: "Calendar" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-6">
            <h1 className="text-xl font-bold mb-8 text-gray-900 dark:text-white">
              Comply-v2
            </h1>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
