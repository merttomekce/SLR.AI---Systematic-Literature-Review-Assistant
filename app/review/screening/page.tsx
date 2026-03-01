'use client';

import { useEffect, useState } from 'react';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2, XCircle, HelpCircle, Play, RotateCcw,
  Loader2, Info, Pause, TrendingUp, BarChart3, Download, ChevronRight, Activity, FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { exportToExcel } from '@/lib/fileParser';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentS1Run && basePapers.length > 0) {
      startS1Run();
    }
  }, [currentS1Run, basePapers, startS1Run]);

  const papers = currentS1Run ? Object.values(currentS1Run.papers) : [];
  const stats = currentS1Run?.stats || { total: 0, included: 0, excluded: 0, notAccessible: 0 };
  const pending = papers.filter(p => !p.s1Decision || p.s1Decision === 'PENDING' || p.s1Decision === 'ANALYZING').length;
  const progress = stats.total > 0 ? ((stats.total - pending) / stats.total) * 100 : 0;

  const inclusionRate = stats.total > 0 ? ((stats.included / stats.total) * 100).toFixed(1) : '0.0';

  const isComplete = pending === 0 && stats.total > 0;

  // Auto-select the analyzing paper or the first available one
  useEffect(() => {
    const analyzing = papers.find(p => p.s1Decision === 'ANALYZING');
    if (analyzing) {
      setSelectedPaperId(analyzing.id);
    } else if (!selectedPaperId && papers.length > 0) {
      setSelectedPaperId(papers[0].id);
    }
  }, [papers, selectedPaperId]);

  const selectedPaper = papers.find(p => p.id === selectedPaperId) || papers[0];

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

  function renderDecisionColor(decision: Decision | undefined) {
    if (decision === 'INCLUDED') return 'text-green-400 bg-green-400/10 border-green-500/20';
    if (decision === 'EXCLUDED') return 'text-red-400 bg-red-400/10 border-red-500/20';
    if (decision === 'NOT ACCESSIBLE') return 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20';
    if (decision === 'ANALYZING') return 'text-blue-400 bg-blue-400/10 border-blue-500/20';
    return 'text-white/50 bg-white/5 border-white/10';
  }

  return (
    <LayoutWrapper
      headerTitle="Abstract Screening"
      headerDescription="AI-powered inclusion/exclusion analysis"
    >
      <div className="p-6 h-[calc(100vh-80px)] flex flex-col overflow-hidden max-w-[1800px] mx-auto animate-in fade-in duration-500 bg-[#000000] text-white">

        {/* Header Bar */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isRunning ? <span className="flex h-3 w-3 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" /> : <span className="flex h-3 w-3 rounded-full bg-white/20" />}
              <h2 className="text-xs uppercase tracking-widest font-bold text-white/50">{isRunning ? 'ENGINE ACTIVE' : 'ENGINE STANDBY'}</h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={toggleS1ProcessingLoop}
              disabled={pauseTimeLeft > 0 || isComplete}
              className={`h-10 px-6 gap-2 font-bold uppercase tracking-widest text-[10px] rounded-full shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all hover:scale-105 active:scale-95 ${isRunning ? 'bg-amber-500 hover:bg-amber-400 text-black' : 'bg-white hover:bg-white/90 text-black'}`}
            >
              {pauseTimeLeft > 0 ? <Loader2 className="w-4 h-4 animate-spin" /> : (isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />)}
              {pauseTimeLeft > 0 ? `PAUSED (${pauseTimeLeft}s)` : (isRunning ? 'PAUSE ENGINE' : 'START ENGINE')}
            </Button>
          </div>
        </div>

        <div className="flex-1 flex gap-6 min-h-0">

          {/* LEFT SIDEBAR: Metadata */}
          <div className="w-[300px] flex-shrink-0 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
            <Card className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-[10px] uppercase tracking-widest text-white/50 font-bold mb-4">Run Metadata</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Total Papers</p>
                    <p className="font-mono text-xl">{stats.total}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Model Snippet</p>
                    <p className="font-mono text-sm text-blue-400 truncate">{currentS1Run?.model || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Run Name</p>
                    <p className="font-mono text-sm truncate">{currentS1Run?.name || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Progress</h3>
                  <span className="font-mono text-xs">{stats.total - pending} / {stats.total}</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <h3 className="text-[10px] uppercase tracking-widest text-white/50 font-bold mb-4">Stats</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                    <p className="text-[9px] uppercase tracking-widest text-green-400/70 mb-1">Included</p>
                    <p className="font-mono text-xl text-green-400">{stats.included}</p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                    <p className="text-[9px] uppercase tracking-widest text-red-400/70 mb-1">Excluded</p>
                    <p className="font-mono text-xl text-red-400">{stats.excluded}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <span className="text-[9px] uppercase tracking-widest text-white/50">Inclusion Rate</span>
                  <span className="font-mono text-sm text-green-400">{inclusionRate}%</span>
                </div>
              </div>

            </Card>

            {/* Actions Card */}
            <div className="space-y-3 mt-auto pt-4">
              <Button onClick={handleExport} disabled={!currentS1Run} variant="outline" className="w-full h-10 border-white/10 bg-transparent hover:bg-white/5 text-xs">
                <Download className="w-4 h-4 mr-2" /> Export Log
              </Button>
              <Button onClick={handleProceed} disabled={!isComplete || stats.included === 0} className="w-full h-12 gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all text-xs font-bold uppercase tracking-widest group">
                Proceed to Extraction <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>

          {/* CENTER: Active Paper & Grid */}
          <div className="flex-1 flex flex-col gap-6 min-w-0">
            {/* Active Paper Context */}
            <Card className="flex-shrink-0 bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-8 relative overflow-hidden flex flex-col max-h-[50%]">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20" />

              {selectedPaper ? (
                <>
                  <div className="flex items-start justify-between mb-6">
                    <div className="space-y-2">
                      <h2 className="text-xl md:text-2xl font-bold text-white/90 leading-tight pr-4">
                        {selectedPaper.title}
                      </h2>
                      <p className="text-sm font-mono text-blue-300/80">
                        {selectedPaper.author || 'Unknown Authors'} • {selectedPaper.year || 'N/A'} • {selectedPaper.journal || 'Journal N/A'}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className={`px-4 py-1.5 rounded-full border text-[10px] uppercase tracking-widest font-bold whitespace-nowrap ${renderDecisionColor(selectedPaper.s1Decision)}`}>
                        {selectedPaper.s1Decision || 'PENDING'}
                      </div>
                      {selectedPaper.s1Decision === 'ANALYZING' && (
                        <p className="text-[9px] text-blue-400 mt-2 font-mono animate-pulse">Processing...</p>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-4 text-sm text-white/70 leading-relaxed max-w-4xl">
                    {selectedPaper.abstract ? (
                      <p>{selectedPaper.abstract}</p>
                    ) : (
                      <p className="italic opacity-50">No abstract available for this paper.</p>
                    )}

                    {selectedPaper.s1Reason && (
                      <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/5 border-l-2 border-l-blue-500">
                        <h4 className="text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold flex items-center gap-2"><Info className="w-3 h-3" /> AI Justification</h4>
                        <p className="text-xs text-white/80">{selectedPaper.s1Reason}</p>
                        {selectedPaper.s1Relevancy && (
                          <p className="text-[10px] uppercase tracking-widest mt-2 text-blue-400/80">Relevancy Score: {selectedPaper.s1Relevancy} / 5</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Override action */}
                  <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Override Decision</p>
                    <Select
                      value={(selectedPaper.s1Decision && selectedPaper.s1Decision !== 'ANALYZING' && selectedPaper.s1Decision !== 'PENDING') ? selectedPaper.s1Decision : ''}
                      onValueChange={(val) => handleDecisionOverride(selectedPaper.id, val as Decision)}
                      disabled={selectedPaper.s1Decision === 'ANALYZING'}
                    >
                      <SelectTrigger className="w-[180px] h-9 bg-white/[0.03] border border-white/10 text-xs font-mono rounded-lg">
                        <SelectValue placeholder="Select outcome..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111] border-white/10 text-white">
                        <SelectItem value="INCLUDED" className="focus:bg-green-500/20 focus:text-green-400 text-xs">Include</SelectItem>
                        <SelectItem value="EXCLUDED" className="focus:bg-red-500/20 focus:text-red-400 text-xs">Exclude</SelectItem>
                        <SelectItem value="NOT ACCESSIBLE" className="focus:bg-yellow-500/20 focus:text-yellow-400 text-xs">Not Accessible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
                  No paper selected.
                </div>
              )}
            </Card>

            {/* Results Sub-grid */}
            <Card className="flex-1 bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 rounded-2xl flex flex-col overflow-hidden min-h-0">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Paper Matrix</h3>
                <div className="flex gap-2">
                  {['All', 'INCLUDED', 'EXCLUDED', 'PENDING', 'ANALYZING'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-3 py-1 rounded-md text-[9px] uppercase tracking-widest font-bold transition-all ${activeFilter === filter ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                <div className="grid gap-1">
                  {filteredPapers.map(paper => (
                    <div
                      key={paper.id}
                      onClick={() => setSelectedPaperId(paper.id)}
                      className={`cursor-pointer group flex items-center justify-between p-3 rounded-xl transition-all ${selectedPaperId === paper.id ? 'bg-white/10 border-white/20 shadow-inner' : 'bg-transparent border-transparent hover:bg-white/5 flex-row border'} border-solid`}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-xs font-medium text-white/90 truncate">{paper.title}</p>
                        <p className="text-[10px] text-white/40 font-mono mt-1 truncate">{paper.author || 'Unknown'}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <div className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-widest font-bold ${renderDecisionColor(paper.s1Decision)}`}>
                          {paper.s1Decision || 'PENDING'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT SIDEBAR: Live Log */}
          <div className="w-[300px] flex-shrink-0 flex flex-col">
            <Card className="flex-1 bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/5">
                <Activity className="w-4 h-4 text-purple-500" />
                <h3 className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Live Screening Log</h3>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 font-mono text-[10px]">
                {papers.slice().reverse().filter(p => p.s1Decision && p.s1Decision !== 'PENDING').slice(0, 100).map(p => (
                  <div key={p.id} className="leading-relaxed border-l-2 border-white/10 pl-3 py-1 cursor-pointer hover:border-white/30 transition-colors" onClick={() => setSelectedPaperId(p.id)}>
                    <div className="text-white/30 mb-0.5">[{new Date().toLocaleTimeString()}]</div>
                    <div className="text-white/80 line-clamp-2">{p.title}</div>
                    <div className={`mt-1 font-bold ${p.s1Decision === 'INCLUDED' ? 'text-green-400' : p.s1Decision === 'EXCLUDED' ? 'text-red-400' : p.s1Decision === 'ANALYZING' ? 'text-blue-400 animate-pulse' : 'text-yellow-400'}`}>
                      -&gt; {p.s1Decision}
                    </div>
                  </div>
                ))}
                {papers.filter(p => typeof p.s1Decision === 'string' && p.s1Decision !== 'PENDING').length === 0 && (
                  <div className="text-white/30 text-center py-10">
                    System idle.<br />Awaiting start command.
                  </div>
                )}
              </div>
            </Card>
          </div>

        </div>
      </div>
    </LayoutWrapper>
  );
}
