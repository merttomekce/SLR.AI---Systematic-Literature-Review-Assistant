'use client';

import { Sidebar } from './sidebar';
import { Header } from './header';

interface LayoutWrapperProps {
  children: React.ReactNode;
  headerTitle?: React.ReactNode;
  headerDescription?: React.ReactNode;
}

export function LayoutWrapper({
  children,
  headerTitle,
  headerDescription,
}: LayoutWrapperProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header title={headerTitle} description={headerDescription} />
      <main className="lg:ml-64 mt-16 transition-smooth">
        <div className="h-full">{children}</div>
      </main>
    </div>
  );
}
