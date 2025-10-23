import type { Metadata } from "next";
import { ModeIndicator } from "@/components/ModeIndicator";
import { WalletConnect } from "@/components/WalletConnect";
import { ErrorNotifications } from "@/components/ErrorNotifications";
import { NotificationProvider } from "@/contexts/NotificationContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bitget Trading Bot - Dashboard",
  description:
    "Real-time monitoring dashboard for Bitget trading bot with aggressive trading and portfolio balancing",
  keywords:
    "trading, bot, cryptocurrency, bitcoin, ethereum, dashboard, real-time",
  authors: [{ name: "Bitget Trading Bot" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
} as const;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-gray-900 text-white font-sans">
        <NotificationProvider>
          <div className="flex h-screen overflow-hidden">
            {/* Sidebar Navigation */}
            <nav className="w-64 bg-gray-800 border-r border-gray-700 flex-shrink-0">
              <div className="p-6">
                <h1 className="text-xl font-bold text-white mb-4">
                  🚀 Bitget Bot
                </h1>

                {/* Mode Indicator */}
                <div className="mb-6">
                  <ModeIndicator />
                </div>

                {/* Wallet Connect */}
                <div className="mb-6">
                  <WalletConnect />
                </div>

                <div className="space-y-2">
                  <NavLink href="/" icon="📊" label="Dashboard" />
                  <NavLink href="/portfolio" icon="💰" label="Portfolio" />
                  <NavLink href="/trades" icon="⚡" label="Active Trades" />
                  <NavLink href="/ai-analysis" icon="🤖" label="AI Analysis" />
                  <NavLink href="/history" icon="📈" label="Trade History" />
                  <NavLink href="/settings" icon="⚙️" label="Settings" />
                  <NavLink href="/logs" icon="📝" label="Logs" />
                </div>
              </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">{children}</main>
          </div>

          {/* Error Notifications */}
          <ErrorNotifications />
        </NotificationProvider>
      </body>
    </html>
  );
}

function NavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors duration-200"
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
}
