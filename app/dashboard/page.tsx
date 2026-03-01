'use client';

import { LayoutWrapper } from '@/components/layout-wrapper';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Archive, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useReviewStore } from '@/store/useReviewStore';

export default function Dashboard() {
  const { currentS1Run, currentS2Run, savedS1Runs } = useReviewStore();

  const getS1RunProgress = (run: any) => {
    if (!run || run.stats.total === 0) return 0;
    const pending = Object.values(run.papers).filter((p: any) => !p.s1Decision || p.s1Decision === 'PENDING').length;
    return Math.round(((run.stats.total - pending) / run.stats.total) * 100);
  };

  const getS2RunProgress = (run: any) => {
    if (!run || Object.keys(run.papers).length === 0) return 0;
    const total = Object.keys(run.papers).length;
    const done = Object.values(run.papers).filter((p: any) => p.s2Status === 'DONE').length;
    return Math.round((done / total) * 100);
  };

  const hasAnyRuns = !!currentS1Run || !!currentS2Run || savedS1Runs.length > 0;

  return (
    <LayoutWrapper
      headerTitle="Dashboard"
      headerDescription="View and manage your systematic literature reviews"
    >
      <div className="p-6 space-y-8 animate-in fade-in duration-500">
        {/* New Review Button */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-foreground">Your Active Runs</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Resume your current review or start a new one
            </p>
          </div>
          <Link href="/review/setup">
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-smooth">
              <Plus className="w-4 h-4" />
              New Review
            </Button>
          </Link>
        </div>

        {/* Empty State Info */}
        {!hasAnyRuns && (
          <Card className="p-12 text-center border-dashed border-border/50 bg-transparent shadow-none hover:shadow-none">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No reviews yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Create your first systematic literature review to get started.
            </p>
            <Link href="/review/setup">
              <Button className="gap-2 button-hover-lift">
                <Plus className="w-4 h-4" />
                Create First Review
              </Button>
            </Link>
          </Card>
        )}

        {/* Runs Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

          {/* Current S1 Run */}
          {currentS1Run && (
            <Link href="/review/screening">
              <Card className="p-6 cursor-pointer group card-hover relative overflow-hidden">
                <div className="absolute top-0 left-0 w-[2px] h-full bg-primary/50 group-hover:bg-primary transition-colors duration-300" />
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <h4 className="font-medium text-foreground group-hover:text-primary transition-smooth line-clamp-1">
                        S1: {currentS1Run.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {new Date(currentS1Run.timestamp).toLocaleDateString()} &middot; {currentS1Run.model}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs-caps text-primary">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">In Progress</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md border border-border/30 p-2">
                      <p className="text-xs-caps mb-1">Papers</p>
                      <p className="text-lg font-mono text-foreground tracking-tight">{currentS1Run.stats.total}</p>
                    </div>
                    <div className="rounded-md border border-border/30 p-2">
                      <p className="text-xs-caps mb-1">Included</p>
                      <p className="text-lg font-mono text-green-500 tracking-tight">{currentS1Run.stats.included}</p>
                    </div>
                    <div className="rounded-md border border-border/30 p-2">
                      <p className="text-xs-caps mb-1">Excluded</p>
                      <p className="text-lg font-mono text-destructive tracking-tight">{currentS1Run.stats.excluded}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs-caps">Screening Progress</span>
                      <span className="font-mono text-xs text-foreground">{getS1RunProgress(currentS1Run)}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500 rounded-full"
                        style={{ width: `${getS1RunProgress(currentS1Run)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          )}

          {/* Current S2 Run */}
          {currentS2Run && (
            <Link href="/review/fulltext">
              <Card className="p-6 cursor-pointer group border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:scale-105 animate-in fade-in duration-500 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-smooth line-clamp-1">
                        S2: {currentS2Run.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {new Date(currentS2Run.timestamp).toLocaleDateString()} &middot; {currentS2Run.model}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/10 text-xs font-medium text-purple-600">
                      <Clock className="w-4 h-4" />
                      <span className="hidden sm:inline">Extraction</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-md bg-muted/50 p-2">
                      <p className="text-xs text-muted-foreground">Total to Extract</p>
                      <p className="text-lg font-semibold text-foreground">{Object.keys(currentS2Run.papers).length}</p>
                    </div>
                    <div className="rounded-md bg-muted/50 p-2">
                      <p className="text-xs text-muted-foreground">Done</p>
                      <p className="text-lg font-semibold text-green-600">
                        {Object.values(currentS2Run.papers).filter(p => p.s2Status === 'DONE').length}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Extraction Progress</span>
                      <span className="font-semibold text-foreground">{getS2RunProgress(currentS2Run)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-purple-500 transition-all duration-300 rounded-full"
                        style={{ width: `\${getS2RunProgress(currentS2Run)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          )}

          {/* Saved S1 Runs */}
          {savedS1Runs.map((run, idx) => (
            <Link key={run.id} href="/review/comparison">
              <Card className="p-6 cursor-pointer group card-hover relative overflow-hidden">
                <div className="absolute top-0 left-0 w-[2px] h-full bg-green-500/50 group-hover:bg-green-500 transition-colors duration-300" />
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <h4 className="font-medium text-foreground group-hover:text-primary transition-smooth line-clamp-1">
                        S1: {run.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {new Date(run.timestamp).toLocaleDateString()} &middot; {run.model}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs-caps text-green-500">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Completed</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md border border-border/30 p-2">
                      <p className="text-xs-caps mb-1">Papers</p>
                      <p className="text-lg font-mono text-foreground tracking-tight">{run.stats.total}</p>
                    </div>
                    <div className="rounded-md border border-border/30 p-2">
                      <p className="text-xs-caps mb-1">Included</p>
                      <p className="text-lg font-mono text-green-500 tracking-tight">{run.stats.included}</p>
                    </div>
                    <div className="rounded-md border border-border/30 p-2">
                      <p className="text-xs-caps mb-1">Excluded</p>
                      <p className="text-lg font-mono text-destructive tracking-tight">{run.stats.excluded}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </LayoutWrapper>
  );
}
