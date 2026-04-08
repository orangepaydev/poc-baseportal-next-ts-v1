import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BasePortal Workspace',
  description: 'Multi-panel workspace layout with collapsible navigation',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="text-foreground min-h-screen bg-[linear-gradient(180deg,rgba(241,245,249,0.95),rgba(255,255,255,1))] font-[family-name:ui-sans-serif] antialiased">
        {children}
      </body>
    </html>
  );
}
