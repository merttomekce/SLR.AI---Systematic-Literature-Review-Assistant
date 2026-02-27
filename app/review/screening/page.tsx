'use client';

import { useEffect } from 'react';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Play,
  RotateCcw,
  Loader2,
  Info,
  Pause,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Download,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { exportToExcel } from '@/lib/fileParser';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { useReviewStore, Decision } from '@/store/useReviewStore';

export default function ScreeningPage() {
  const router = useRouter();
  const {
    currentS1Run, startS1Run, updatePaperInCurrentRun, papers: basePapers, savedS1Runs, saveCurrentS1Run, startS2Run
  } = useReviewStore();

  const isRunning = useReviewStore((state) => state.isS1Running);
  const pauseTimeLeft = useReviewStore((state) => state.s1PauseTimeLeft);
  const toggleS1ProcessingLoop = useReviewStore((state) => state.toggleS1ProcessingLoop);

  const [activeFilter, setActiveFilter] = useState<string>('All');

  useEffect(() => {
    // If we land here and no S1 run exists, but we have base papers, start one
    if (!currentS1Run && basePapers.length > 0) {
      startS1Run();
    }
  }, [currentS1Run, basePapers, startS1Run]);

  const papers = currentS1Run ? Object.values(currentS1Run.papers) : [];
  const stats = currentS1Run?.stats || { total: 0, included: 0, excluded: 0, notAccessible: 0 };
  const pending = papers.filter(p => !p.s1Decision || p.s1Decision === 'PENDING' || p.s1Decision === 'ANALYZING').length;
  const progress = stats.total > 0 ? ((stats.total - pending) / stats.total) * 100 : 0;

  const inclusionRate = stats.total > 0 ? ((stats.included / stats.total) * 100).toFixed(1) : '0.0';
  const exclusionRate = stats.total > 0 ? ((stats.excluded / stats.total) * 100).toFixed(1) : '0.0';

  const isComplete = pending === 0 && stats.total > 0;

  const handleExport = () => {
    if (!currentS1Run) return;
    const papersList = Object.values(currentS1Run.papers).map(p => ({
      ID: p.id,
      Title: p.title,
      Authors: p.author || '',
      Year: p.year || '',
      Journal: p.journal || '',
      DOI: p.doi || '',
      Abstract: p.abstract || '',
      Step1_Decision: p.s1Decision || 'PENDING',
      Step1_Reason: p.s1Reason || '',
      Step1_Relevancy: p.s1Relevancy || ''
    }));

    const summary = [{
      Run_Name: currentS1Run.name,
      Model: currentS1Run.model,
      Total_Papers: stats.total,
      Included: stats.included,
      Excluded: stats.excluded,
      Not_Accessible: stats.notAccessible,
      Pending: pending
    }];

    exportToExcel([
      { name: 'S1 Results', data: papersList },
      { name: 'Summary', data: summary }
    ], `SLR_AI_Step1_${currentS1Run.name || 'Export'}.xlsx`);
  };

  const handleProceed = () => {
    if (currentS1Run) {
      saveCurrentS1Run();
      startS2Run(currentS1Run.id);
      router.push('/review/fulltext');
    }
  };

  const filteredPapers = papers.filter(p => {
    if (activeFilter === 'All') return true;
    return p.s1Decision === activeFilter;
  });

  const handleDecisionOverride = (paperId: string, decision: Decision) => {
    updatePaperInCurrentRun(paperId, { s1Decision: decision });
    toast.success(`Decision manually overridden to ${decision}`);
  };

  function renderDecisionBadge(decision: Decision | undefined) {
    if (decision === 'INCLUDED') return <Badge className="bg-green-500/10 text-green-600 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Included</Badge>;
    if (decision === 'EXCLUDED') return <Badge className="bg-red-500/10 text-red-600 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Excluded</Badge>;
    if (decision === 'NOT ACCESSIBLE') return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200"><HelpCircle className="w-3 h-3 mr-1" /> Not Accessible</Badge>;
    if (decision === 'ANALYZING') return <Badge className="bg-primary/10 text-primary border-primary/20"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Analyzing</Badge>;
    return <Badge variant="outline" className="text-muted-foreground border-border">Pending</Badge>;
  }

  function renderRelevancy(relevancy: number | undefined) {
    if (!relevancy) return <span className="text-muted-foreground text-xs">N/A</span>;
    return (
      <div className="flex gap-0.5" title={`Relevancy: ${relevancy} / 5`}>
        {[1, 2, 3, 4, 5].map((val) => (
          <div key={val} className={`w-2 h-2 rounded-full ${val <= relevancy ? 'bg-purple-500' : 'bg-muted'}`} />
        ))}
      </div>
    );
  }

  return (
    <LayoutWrapper
      headerTitle="Abstract Screening (Step 1)"
      headerDescription={
        <span className="flex items-center gap-2">
          AI processes each paper sequentially. Results appear below in real-time.
          <HoverCard>
            <HoverCardTrigger className="cursor-help">
              <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
            </HoverCardTrigger>
            <HoverCardContent className="w-[300px] text-xs shadow-xl border-border z-[100] font-normal" align="start">
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground border-b border-border pb-1">Guidelines</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Step 1 uses only the title, abstract, authors, year, journal, and DOI. It never receives full-text content. This mirrors the abstract screening phase in a human-conducted PRISMA review.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </span>
      }
    >
      <div className="p-6 h-[calc(100vh-80px)] flex gap-6 overflow-hidden max-w-[1600px] mx-auto animate-in fade-in duration-500">

        {/* LEFT SIDEBAR */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-4">
          <Card className="p-4 border-border space-y-4">
            <h3 className="font-semibold text-sm text-foreground">Run Metadata</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Total Papers</p>
                <p className="font-medium text-foreground">{stats.total}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Model</p>
                <p className="font-medium text-foreground truncate" title={currentS1Run?.model}>{currentS1Run?.model || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Run Name</p>
                <p className="font-medium text-foreground truncate" title={currentS1Run?.name}>{currentS1Run?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Saved Runs</p>
                <p className="font-medium text-foreground">{savedS1Runs.length}</p>
              </div>
            </div>
            <Button
              onClick={() => { startS1Run(); }}
              disabled={!isComplete && papers.length > 0}
              variant="outline"
              className="w-full gap-2 border-border"
            >
              <RotateCcw className="w-4 h-4" /> Run Again
            </Button>
          </Card>

          {/* Quality Stats (Replaced Guidelines) */}
          <Card className="p-4 border-border flex-1 overflow-y-auto space-y-4">
            <h3 className="font-semibold text-sm text-foreground">Quality Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-md bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-600">Inclusion Rate</span>
                </div>
                <span className="text-sm font-bold text-green-600">{inclusionRate}%</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-md bg-green-500/10 border border-green-500/20 flex flex-col items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mb-1" />
                  <span className="text-[10px] font-medium text-green-600 text-center">Included</span>
                  <span className="text-lg font-bold text-green-600 leading-none mt-1">{stats.included}</span>
                </div>
                <div className="p-2 rounded-md bg-red-500/10 border border-red-500/20 flex flex-col items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-red-600 mb-1" />
                  <span className="text-[10px] font-medium text-red-600 text-center">Excluded</span>
                  <span className="text-lg font-bold text-red-600 leading-none mt-1">{stats.excluded}</span>
                </div>
                <div className="p-2 rounded-md bg-yellow-500/10 border border-yellow-500/20 flex flex-col items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-yellow-600 mb-1" />
                  <span className="text-[10px] font-medium text-yellow-600 text-center leading-tight">Not <br /> Accessible</span>
                  <span className="text-lg font-bold text-yellow-600 leading-none mt-1">{stats.notAccessible}</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-yellow-600" />
                  <span className="text-xs font-medium text-yellow-600">Pending</span>
                </div>
                <span className="text-sm font-bold text-yellow-600">{pending}</span>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="space-y-2 mt-auto">
            <Button
              onClick={handleExport}
              disabled={!currentS1Run}
              variant="outline"
              className="w-full gap-2 border-border hover:bg-secondary text-xs"
            >
              <Download className="w-3.5 h-3.5" /> Export Data
            </Button>
            <Button
              onClick={handleProceed}
              disabled={!isComplete || stats.included === 0}
              className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md text-xs relative overflow-hidden group"
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              Proceed to Full-Text <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">

          {/* TOP: Progress & Log */}
          <Card className="p-4 border-border flex-shrink-0 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-8">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-foreground">Screening Progress</span>
                  <span className="text-muted-foreground">{stats.total - pending} / {stats.total} Papers</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <Button
                onClick={toggleS1ProcessingLoop}
                disabled={pauseTimeLeft > 0 || isComplete}
                className={`gap-2 shadow-md transition-smooth ${isRunning ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
              >
                {pauseTimeLeft > 0 ? <Loader2 className="w-4 h-4 animate-spin" /> : (isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />)}
                {pauseTimeLeft > 0 ? `Rate Limit Paused (${pauseTimeLeft}s)` : (isRunning ? 'Pause Process' : 'Start Screening')}
              </Button>
            </div>

            {/* Log Console */}
            <div className="h-24 bg-black/90 dark:bg-black rounded-md border border-neutral-800 p-3 overflow-y-auto font-mono text-[11px] text-green-400 space-y-1">
              {papers.slice().reverse().filter(p => p.s1Decision && p.s1Decision !== 'PENDING').slice(0, 50).map(p => (
                <div key={p.id}>
                  <span className="text-neutral-500">[{new Date().toLocaleTimeString()}]</span>{" "}
                  <span className="text-neutral-300">Evaluating: {p.title.substring(0, 40)}...</span>{" "}
                  <span className={p.s1Decision === 'INCLUDED' ? 'text-green-500' : p.s1Decision === 'EXCLUDED' ? 'text-red-500' : p.s1Decision === 'ANALYZING' ? 'text-yellow-500' : 'text-neutral-400'}>
                    -{">"} {p.s1Decision} {p.s1Decision === 'ANALYZING' && '...'}
                  </span>
                </div>
              ))}
              {papers.filter(p => typeof p.s1Decision === 'string' && p.s1Decision !== 'PENDING').length === 0 && (
                <div className="text-neutral-500">System idle. Ready to begin abstract screening.</div>
              )}
            </div>
          </Card>

          {/* BOTTOM: Results Table */}
          <Card className="flex-1 border-border flex flex-col overflow-hidden">
            <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Results Table</h3>
              <div className="flex gap-2">
                {['All', 'INCLUDED', 'EXCLUDED', 'NOT ACCESSIBLE', 'PENDING', 'ANALYZING'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-semibold transition-colors ${activeFilter === filter ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-transparent text-muted-foreground hover:bg-muted'}`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-auto rounded-b-xl">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-[#121212] sticky top-0 z-10 text-[11px] uppercase text-muted-foreground shadow-sm">
                  <tr>
                    <th className="py-2 px-4 font-semibold w-32 whitespace-nowrap tracking-wider">Decision</th>
                    <th className="py-2 px-4 font-semibold w-72 whitespace-nowrap tracking-wider">Reason</th>
                    <th className="py-2 px-4 font-semibold w-24 whitespace-nowrap tracking-wider">Relevancy</th>
                    <th className="py-2 px-4 font-semibold whitespace-nowrap tracking-wider">Metadata (Title & Authors)</th>
                    <th className="py-2 px-4 font-semibold w-32 whitespace-nowrap tracking-wider text-right">Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredPapers.map((paper) => (
                    <tr key={paper.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 align-top">
                        {renderDecisionBadge(paper.s1Decision)}
                      </td>
                      <td className="py-3 px-4 align-top leading-snug">
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <p className="text-[11px] text-foreground/80 line-clamp-3 cursor-pointer hover:underline decoration-muted-foreground underline-offset-2 w-fit">
                              {paper.s1Reason || '-'}
                            </p>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-[350px] text-xs shadow-xl border-border z-[100]">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-foreground flex items-center gap-2 border-b border-border pb-1">
                                <Info className="w-3 h-3" /> AI Justification
                              </h4>
                              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-left">
                                {paper.s1Reason || 'No reason provided.'}
                              </p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </td>
                      <td className="py-3 px-4 align-top">
                        {renderRelevancy(paper.s1Relevancy)}
                      </td>
                      <td className="py-3 px-4 align-top max-w-[300px]">
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <div className="cursor-pointer group w-fit">
                              <div className="font-medium text-xs text-foreground line-clamp-2 group-hover:underline underline-offset-2">{paper.title}</div>
                              <div className="text-[11px] text-muted-foreground mt-1 truncate">
                                {paper.author || 'Unknown'} • {paper.year || 'N/A'} • {paper.journal || 'N/A'}
                              </div>
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-[450px] text-xs shadow-xl border-border max-h-[80vh] overflow-y-auto z-[100]" align="end">
                            <div className="space-y-3">
                              <h4 className="font-semibold text-foreground border-b border-border pb-1">Full Metadata</h4>
                              <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1.5 items-start">
                                <span className="text-muted-foreground font-medium">Title:</span> <span className="font-medium text-foreground">{paper.title || '-'}</span>
                                <span className="text-muted-foreground font-medium">Authors:</span> <span className="text-foreground">{paper.author || '-'}</span>
                                <span className="text-muted-foreground font-medium">Year:</span> <span className="text-foreground">{paper.year || '-'}</span>
                                <span className="text-muted-foreground font-medium">Journal:</span> <span className="text-foreground">{paper.journal || '-'}</span>
                                <span className="text-muted-foreground font-medium">Item Type:</span> <span className="text-foreground">{paper.itemType || '-'}</span>
                                <span className="text-muted-foreground font-medium">ISSN:</span> <span className="text-foreground">{paper.issn || '-'}</span>
                                <span className="text-muted-foreground font-medium">DOI:</span> <span className="text-foreground">{paper.doi || '-'}</span>
                                <span className="text-muted-foreground font-medium">URL:</span> <span className="text-foreground break-all">{paper.url ? <a href={paper.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{paper.url}</a> : '-'}</span>
                              </div>
                              <div className="pt-2 border-t border-border mt-2">
                                <span className="text-muted-foreground font-medium block mb-1">Abstract:</span>
                                <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap text-left">
                                  {paper.abstract || 'No abstract available.'}
                                </p>
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </td>
                      <td className="py-3 px-4 align-top text-right">
                        <Select
                          value={(paper.s1Decision && paper.s1Decision !== 'ANALYZING' && paper.s1Decision !== 'PENDING') ? paper.s1Decision : ''}
                          onValueChange={(val) => handleDecisionOverride(paper.id, val as Decision)}
                          disabled={paper.s1Decision === 'ANALYZING'}
                        >
                          <SelectTrigger className="h-7 text-[10px] w-full min-w-[110px] max-w-[130px]">
                            <SelectValue placeholder="Override..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INCLUDED">Included</SelectItem>
                            <SelectItem value="EXCLUDED">Excluded</SelectItem>
                            <SelectItem value="NOT ACCESSIBLE">Not Accessible</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                  {papers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">
                        No papers found in this run. Start by uploading references in the Setup page.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

        </div>
      </div>
    </LayoutWrapper>
  );
}
