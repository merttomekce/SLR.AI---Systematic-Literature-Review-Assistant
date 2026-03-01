'use client';

import { LayoutWrapper } from '@/components/layout-wrapper';
import { useReviewStore } from '@/store/useReviewStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BarChart3, BookOpen, Settings, Play, Download, Clock, ChevronRight, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

export default function BentoDashboard() {
    const { currentS1Run, currentS2Run, savedS1Runs, provider, model } = useReviewStore();

    const totalRuns = savedS1Runs.length + (currentS1Run ? 1 : 0);

    // Stats calculation over all runs
    let totalPapers = 0;
    let totalIncluded = 0;
    let totalExcluded = 0;

    if (currentS1Run) {
        totalPapers += currentS1Run.stats.total;
        totalIncluded += currentS1Run.stats.included;
        totalExcluded += currentS1Run.stats.excluded;
    }

    savedS1Runs.forEach(run => {
        totalPapers += run.stats.total;
        totalIncluded += run.stats.included;
        totalExcluded += run.stats.excluded;
    });

    return (
        <LayoutWrapper
            headerTitle="Bento Dashboard"
            headerDescription="Centralized prototype overview of your SLR process"
        >
            <div className="p-6 md:p-8 animate-in fade-in duration-500">
                <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[minmax(160px,auto)]">

                    {/* Tile 1: Active Run (Large Focus) */}
                    <Card className="surface-elevated overflow-hidden relative col-span-1 md:col-span-2 lg:col-span-2 lg:row-span-2 flex flex-col p-6 group transition-all hover:border-primary/40">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                            <Play className="w-48 h-48 text-primary" />
                        </div>

                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30 text-primary">
                                <Play className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-foreground">Current Active Run</h2>
                                <p className="text-xs text-muted-foreground">{currentS1Run ? currentS1Run.name : 'No active runs'}</p>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-center relative z-10">
                            {currentS1Run ? (
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between text-sm mb-2 font-mono">
                                            <span className="text-muted-foreground">Screening Progress</span>
                                            <span className="text-foreground">{currentS1Run.stats.included + currentS1Run.stats.excluded + currentS1Run.stats.notAccessible} / {currentS1Run.stats.total}</span>
                                        </div>
                                        <div className="h-3 w-full bg-secondary/50 rounded-full overflow-hidden border border-border/30">
                                            <div
                                                className="h-full bg-primary"
                                                style={{ width: `${(currentS1Run.stats.total > 0 ? (currentS1Run.stats.included + currentS1Run.stats.excluded + currentS1Run.stats.notAccessible) / currentS1Run.stats.total : 0) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-secondary/30 p-4 rounded-lg border border-border/30 text-center text-green-500">
                                            <CheckCircle2 className="w-6 h-6 mx-auto mb-2 opacity-80" />
                                            <div className="text-2xl font-mono font-bold">{currentS1Run.stats.included}</div>
                                            <div className="text-[10px] uppercase tracking-wider font-semibold opacity-70">Included</div>
                                        </div>
                                        <div className="bg-secondary/30 p-4 rounded-lg border border-border/30 text-center text-red-500">
                                            <XCircle className="w-6 h-6 mx-auto mb-2 opacity-80" />
                                            <div className="text-2xl font-mono font-bold">{currentS1Run.stats.excluded}</div>
                                            <div className="text-[10px] uppercase tracking-wider font-semibold opacity-70">Excluded</div>
                                        </div>
                                        <div className="bg-secondary/30 p-4 rounded-lg border border-border/30 text-center text-amber-500">
                                            <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-80" />
                                            <div className="text-2xl font-mono font-bold">{currentS1Run.stats.notAccessible}</div>
                                            <div className="text-[10px] uppercase tracking-wider font-semibold opacity-70">Pending</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground mb-6">You aren't screening any papers right now.</p>
                                    <Link href="/review/setup">
                                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 button-hover-lift shadow-md">
                                            Start New Review
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {currentS1Run && (
                            <div className="mt-8 relative z-10">
                                <Link href="/review/screening">
                                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 button-hover-lift shadow-md">
                                        Resume Screening
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </Card>

                    {/* Tile 2: Quick Metrics (Stats) */}
                    <Card className="surface-elevated p-6 flex flex-col col-span-1 md:col-span-1 lg:col-span-1 lg:row-span-1">
                        <div className="flex items-center gap-2 mb-6">
                            <BarChart3 className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-semibold text-foreground tracking-tight">Review Metrics</h3>
                        </div>

                        <div className="space-y-4 flex-1">
                            <div className="flex justify-between items-center border-b border-border/40 pb-2">
                                <span className="text-xs-caps text-muted-foreground">Total Runs</span>
                                <span className="font-mono text-lg font-bold">{totalRuns}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-border/40 pb-2">
                                <span className="text-xs-caps text-muted-foreground">Papers Assessed</span>
                                <span className="font-mono text-lg font-bold">{totalPapers}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs-caps text-muted-foreground">Included Rate</span>
                                <span className="font-mono text-lg font-bold text-green-500">
                                    {totalPapers > 0 ? Math.round((totalIncluded / totalPapers) * 100) : 0}%
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Tile 3: Config Status */}
                    <Card className="surface-elevated p-6 flex flex-col col-span-1 md:col-span-1 lg:col-span-1 lg:row-span-1">
                        <div className="flex items-center gap-2 mb-6">
                            <Settings className="w-4 h-4 text-purple-400" />
                            <h3 className="text-sm font-semibold text-foreground tracking-tight">Engine Config</h3>
                        </div>

                        <div className="flex-1 flex flex-col justify-center space-y-6">
                            <div>
                                <p className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground mb-1">Provider</p>
                                <p className="text-sm font-medium text-foreground capitalize flex items-center gap-2">
                                    {provider ? (
                                        <>
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            {provider}
                                        </>
                                    ) : 'Not Configured'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground mb-1">Active Model</p>
                                <p className="text-sm font-mono text-primary truncate">
                                    {model || 'None'}
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Tile 4: History / Saved Runs */}
                    <Card className="surface-elevated p-6 flex flex-col col-span-1 md:col-span-2 lg:col-span-2 lg:row-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-400" />
                                <h3 className="text-sm font-semibold text-foreground tracking-tight">Saved Screening Runs</h3>
                            </div>
                            <Link href="/review/comparison">
                                <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground">
                                    Compare <ChevronRight className="w-3 h-3 ml-1" />
                                </Button>
                            </Link>
                        </div>

                        <ScrollArea className="flex-1 pr-4 -mr-4">
                            {savedS1Runs.length > 0 ? (
                                <div className="space-y-3">
                                    {savedS1Runs.map(run => (
                                        <div key={run.id} className="group flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/30 hover:border-primary/40 transition-colors">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-sm text-foreground truncate">{run.name}</p>
                                                <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                                                    <span className="font-mono">{format(new Date(run.timestamp), "MMM d, HH:mm")}</span>
                                                    <span className="px-1.5 py-0.5 rounded-sm bg-background border border-border/50 font-mono text-green-500">
                                                        {run.stats.included} Inc
                                                    </span>
                                                    <span className="px-1.5 py-0.5 rounded-sm bg-background border border-border/50 font-mono text-red-500">
                                                        {run.stats.excluded} Exc
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                                    <BookOpen className="w-8 h-8 mb-3 opacity-20" />
                                    <p>No saved runs yet.</p>
                                </div>
                            )}
                        </ScrollArea>
                    </Card>

                    {/* Tile 5: Quick Actions */}
                    <Card className="surface-elevated p-6 flex flex-col col-span-1 md:col-span-2 lg:col-span-2 lg:row-span-1">
                        <h3 className="text-sm font-semibold text-foreground tracking-tight mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-4 flex-1">
                            <Link href="/review/fulltext" className="h-full">
                                <Button variant="outline" className="w-full h-full flex flex-col items-center justify-center gap-2 bg-secondary/20 hover:bg-secondary/40 border-border/40 transition-colors">
                                    <Download className="w-5 h-5 text-primary" />
                                    <span className="text-sm font-medium">Extract Full Text</span>
                                </Button>
                            </Link>
                            <Link href="/review/setup" className="h-full">
                                <Button variant="outline" className="w-full h-full flex flex-col items-center justify-center gap-2 bg-secondary/20 hover:bg-secondary/40 border-border/40 transition-colors">
                                    <Settings className="w-5 h-5 text-purple-400" />
                                    <span className="text-sm font-medium">Configure Project</span>
                                </Button>
                            </Link>
                        </div>
                    </Card>

                </div>
            </div>
        </LayoutWrapper>
    );
}
