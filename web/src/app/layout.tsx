import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bitget Trading Bot - Dashboard',
  description: 'Real-time monitoring dashboard for Bitget trading bot with aggressive trading and portfolio balancing',
  keywords: 'trading, bot, cryptocurrency, bitcoin, ethereum, dashboard, real-time',
  authors: [{ name: 'Bitget Trading Bot' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-gray-900 text-white`}>
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar Navigation */}
          <nav className="w-64 bg-gray-800 border-r border-gray-700 flex-shrink-0">
            <div className="p-6">
              <h1 className="text-xl font-bold text-white mb-8">
                🚀 Bitget Bot
              </h1>
              <div className="space-y-2">
                <NavLink href="/" icon="📊" label="Dashboard" />
                <NavLink href="/portfolio" icon="💰" label="Portfolio" />
                <NavLink href="/trades" icon="⚡" label="Active Trades" />
                <NavLink href="/history" icon="📈" label="Trade History" />
                <NavLink href="/settings" icon="⚙️" label="Settings" />
                <NavLink href="/logs" icon="📝" label="Logs" />
              </div>
            </div>
            
            {/* Bot Status */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Bot Status</span>
                </div>
                <div className="text-xs text-gray-300">
                  <div>Environment: TESTNET</div>
                  <div>Uptime: --:--:--</div>
                  <div className="text-green-400">✅ Operational</div>
                </div>
              </div>
            </div>
          </nav>
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: string; label: string }) {
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