import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Influencer Studio',
  description: 'Generate and auto-publish AI Influencer videos.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen flex`}>
        <div className="flex w-full">
          {/* Sidebar */}
          <aside className="w-64 bg-gray-900 border-r border-gray-800 p-6 flex flex-col justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-8">
                AI Studio
              </h1>
              <nav className="space-y-4">
                <a href="/" className="block px-4 py-2 rounded-lg bg-gray-800 text-purple-400 font-medium">
                  Dashboard
                </a>
                <a href="/create" className="block px-4 py-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors">
                  Create Video
                </a>
                <a href="/queue" className="block px-4 py-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors">
                  Publish Queue
                </a>
                <a href="/settings" className="block px-4 py-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors">
                  Settings
                </a>
              </nav>
            </div>
            <div className="text-sm text-gray-600">
              &copy; 2026 AI Studio
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
