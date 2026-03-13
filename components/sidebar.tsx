'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  FileText,
  Settings,
  ChevronDown,
  Menu,
  X,
  BookOpen,
} from 'lucide-react';
import { Logo } from '@/components/logo';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  description?: string;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: <BarChart3 className="w-5 h-5" />,
    description: 'View your reviews',
  },
  {
    title: 'New Review',
    href: '/review/setup',
    icon: <BookOpen className="w-5 h-5" />,
    description: 'Start a new review',
  },
];

const reviewStages = [
  { title: 'Setup', href: '/review/setup', icon: <Settings className="w-4 h-4" /> },
  { title: 'Abstract Screening', href: '/review/screening', icon: <FileText className="w-4 h-4" /> },
  { title: 'Full-Text Review', href: '/review/fulltext', icon: <BookOpen className="w-4 h-4" /> },
  { title: 'Comparison', href: '/review/comparison', icon: <BarChart3 className="w-4 h-4" /> },
];

export function Sidebar() {
  const [open, setOpen] = useState(true);
  const [stagesOpen, setStagesOpen] = useState(true);
  const pathname = usePathname();

  const isReviewPath = pathname.startsWith('/review');

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(!open)}
          className="hover:bg-secondary"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-30 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-out lg:translate-x-0 overflow-y-auto',
          !open && '-translate-x-full'
        )}
      >
        <div className="p-6 space-y-8">
          {/* Logo/Title */}
          <div className="space-y-2">
            <Link href="/" className="inline-block transition-transform hover:scale-105 active:scale-95">
              <h1 className="text-xl font-semibold text-sidebar-foreground flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-transparent flex items-center justify-center">
                  <Logo className="w-8 h-8" />
                </div>
                <span className="var(--font-outfit) font-outfit">SLR AI</span>
              </h1>
            </Link>
            <p className="text-xs text-sidebar-foreground/60">Systematic Literature Review</p>
          </div>

          {/* Main Navigation */}
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? 'default' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3 transition-smooth',
                    pathname === item.href
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  )}
                >
                  {item.icon}
                  <div className="text-left">
                    <div className="font-medium">{item.title}</div>
                    {item.description && (
                      <div className="text-xs opacity-70">{item.description}</div>
                    )}
                  </div>
                </Button>
              </Link>
            ))}
          </nav>

          {/* Review Stages */}
          {isReviewPath && (
            <div className="space-y-2 pt-4 border-t border-sidebar-border">
              <button
                onClick={() => setStagesOpen(!stagesOpen)}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-sidebar-foreground/70 hover:text-sidebar-foreground transition-smooth"
              >
                Review Stages
                <ChevronDown
                  className={cn(
                    'w-4 h-4 transition-transform duration-300',
                    stagesOpen && 'rotate-180'
                  )}
                />
              </button>
              {stagesOpen && (
                <div className="space-y-1 ml-2">
                  {reviewStages.map((stage) => (
                    <Link key={stage.href} href={stage.href}>
                      <Button
                        variant={pathname === stage.href ? 'secondary' : 'ghost'}
                        size="sm"
                        className={cn(
                          'w-full justify-start gap-2 text-xs transition-smooth',
                          pathname === stage.href
                            ? 'bg-sidebar-accent text-sidebar-foreground'
                            : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                        )}
                      >
                        {stage.icon}
                        {stage.title}
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
