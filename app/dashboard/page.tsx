'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Clock, CheckCircle2, AlertCircle, Activity, FileText } from 'lucide-react';
import Link from 'next/link';
import { useReviewStore } from '@/store/useReviewStore';
import { LayoutWrapper } from '@/components/layout-wrapper';

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

  // Derive recent activity from runs
  const recentActivities: any[] = [];
  if (currentS2Run) recentActivities.push({ id: 's2-current', title: `S2 Extraction started: ${currentS2Run.name}`, time: new Date(currentS2Run.timestamp).toLocaleDateString(), type: 'process' });
  if (currentS1Run) recentActivities.push({ id: 's1-current', title: `S1 Screening started: ${currentS1Run.name}`, time: new Date(currentS1Run.timestamp).toLocaleDateString(), type: 'screen' });
  savedS1Runs.slice(0, 3).forEach(run => {
    recentActivities.push({ id: `s1-${run.id}`, title: `S1 Completed: ${run.name}`, time: new Date(run.timestamp).toLocaleDateString(), type: 'done' });
  });

  return (
    <LayoutWrapper
      headerTitle="Central Dashboard"
      headerDescription="Systematic Literature Review Hub"
    >
      <div className="p-6 md:p-10 max-w-[1400px] mx-auto space-y-12 animate-in fade-in duration-700">

        {/* Header Greeting & Action */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Good morning.
            </h1>
            <p className="text-muted-foreground mt-2 text-lg font-light">
              Here is the current status of your literature reviews.
            </p>
          </div>
          <Link href="/review/setup">
            <Button className="h-12 px-6 gap-2 bg-white text-black hover:bg-white/90 font-semibold shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all hover:scale-105 active:scale-95 rounded-full">
              <Plus className="w-5 h-5" />
              START NEW REVIEW
            </Button>
          </Link>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Main Runs Column */}
          <div className="lg:col-span-8 space-y-6">
            <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-4">Active Review Runs</h2>

            {!hasAnyRuns && (
              <div className="h-64 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center p-8 backdrop-blur-sm">
                <AlertCircle className="w-12 h-12 text-white/20 mb-4" />
                <p className="text-white/60 font-medium mb-2">No active runs found.</p>
                <p className="text-xs text-white/40">Initiate a new review setup to begin processing papers.</p>
              </div>
            )}

            {/* S1 Current */}
            {currentS1Run && (
              <Link href="/review/screening">
                <Card className="group relative overflow-hidden rounded-2xl bg-[#0a0a0a]/80 backdrop-blur-xl border-none shadow-2xl p-6 transition-transform hover:scale-[1.01] duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] font-bold tracking-widest uppercase text-blue-400">Screening</span>
                      </div>
                      <h3 className="text-xl font-semibold text-white group-hover:text-blue-200 transition-colors line-clamp-1">{currentS1Run.name}</h3>
                      <p className="text-xs text-white/50 font-mono">{currentS1Run.model}</p>
                    </div>

                    <div className="flex gap-4">
                      <div className="text-center">
                        <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Papers</p>
                        <p className="font-mono text-xl text-white">{currentS1Run.stats.total}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Incl</p>
                        <p className="font-mono text-xl text-green-400">{currentS1Run.stats.included}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Excl</p>
                        <p className="font-mono text-xl text-red-400/80">{currentS1Run.stats.excluded}</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 mt-6 pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Progress</span>
                      <span className="font-mono text-xs text-white">{getS1RunProgress(currentS1Run)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${getS1RunProgress(currentS1Run)}%` }} />
                    </div>
                  </div>
                </Card>
              </Link>
            )}

            {/* S2 Current */}
            {currentS2Run && (
              <Link href="/review/fulltext">
                <Card className="group mt-4 relative overflow-hidden rounded-2xl bg-[#0a0a0a]/80 backdrop-blur-xl border-none shadow-2xl p-6 transition-transform hover:scale-[1.01] duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                        <span className="text-[10px] font-bold tracking-widest uppercase text-purple-400">Extraction</span>
                      </div>
                      <h3 className="text-xl font-semibold text-white group-hover:text-purple-200 transition-colors line-clamp-1">{currentS2Run.name}</h3>
                      <p className="text-xs text-white/50 font-mono">{currentS2Run.model}</p>
                    </div>

                    <div className="flex gap-4">
                      <div className="text-center">
                        <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Queue</p>
                        <p className="font-mono text-xl text-white">{Object.keys(currentS2Run.papers).length}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Done</p>
                        <p className="font-mono text-xl text-purple-400">{Object.values(currentS2Run.papers).filter((p: any) => p.s2Status === 'DONE').length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 mt-6 pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Extraction Progress</span>
                      <span className="font-mono text-xs text-white">{getS2RunProgress(currentS2Run)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] rounded-full transition-all duration-1000" style={{ width: `${getS2RunProgress(currentS2Run)}%` }} />
                    </div>
                  </div>
                </Card>
              </Link>
            )}

            {/* Saved S1 Runs */}
            {savedS1Runs.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-4">Completed Runs</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {savedS1Runs.map(run => (
                    <Link key={run.id} href="/review/comparison">
                      <Card className="group relative overflow-hidden rounded-xl bg-[#0a0a0a]/50 backdrop-blur-md border border-white/[0.02] hover:border-white/[0.05] shadow-lg p-5 transition-all hover:bg-[#111]">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-medium text-white/90 truncate max-w-[150px]">{run.name}</h4>
                            <p className="text-[10px] text-muted-foreground mt-1">{new Date(run.timestamp).toLocaleDateString()}</p>
                          </div>
                          <CheckCircle2 className="w-4 h-4 text-green-500/50" />
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Total</span>
                            <p className="font-mono text-sm text-white">{run.stats.total}</p>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Incl</span>
                            <p className="font-mono text-sm text-green-400/80">{run.stats.included}</p>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Excl</span>
                            <p className="font-mono text-sm text-red-400/80">{run.stats.excluded}</p>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar / Recent Activity */}
          <div className="lg:col-span-4 mt-8 lg:mt-0">
            <div className="sticky top-24 space-y-6">
              <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" /> Recent Activity
              </h2>
              <div className="rounded-2xl bg-white/[0.01] border border-white/[0.03] p-6 backdrop-blur-xl">
                {recentActivities.length > 0 ? (
                  <div className="space-y-6">
                    {recentActivities.map((act, i) => (
                      <div key={i} className="flex gap-4 relative">
                        {i !== recentActivities.length - 1 && (
                          <div className="absolute left-2 top-8 bottom-[-24px] w-px bg-white/5" />
                        )}
                        <div className={`w-4 h-4 rounded-full mt-1 shrink-0 flex items-center justify-center ${act.type === 'process' ? 'bg-purple-500/20 text-purple-400' : act.type === 'screen' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-current" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white/90 leading-tight">{act.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-1 tracking-wide">{act.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 opacity-50">
                    <FileText className="w-8 h-8 mx-auto mb-3 text-white/20" />
                    <p className="text-xs">No recent activity.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </LayoutWrapper>
  );
}
