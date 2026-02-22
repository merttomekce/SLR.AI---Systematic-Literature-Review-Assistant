'use client';

import { useState, useEffect, useRef } from 'react';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Play,
  Pause,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useReviewStore, Paper, Decision } from '@/store/useReviewStore';

const filters = ['All', 'INCLUDED', 'EXCLUDED', 'NOT ACCESSIBLE', 'PENDING', 'ANALYZING'];

export default function ScreeningPage() {
  const {
    currentS1Run, startS1Run, updatePaperInCurrentRun, papers: basePapers,
    apiKey, provider, model, topic, inclusionCriteria, exclusionCriteria, extraContext
  } = useReviewStore();

  const [activeFilter, setActiveFilter] = useState('All');
  const [currentIndex, setCurrentIndex] = useState(0);
  const isRunning = useReviewStore((state) => state.isS1Running);
  const pauseTimeLeft = useReviewStore((state) => state.s1PauseTimeLeft);
  const toggleS1ProcessingLoop = useReviewStore((state) => state.toggleS1ProcessingLoop);

  useEffect(() => {
    // If we land here and no S1 run exists, but we have base papers, start one
    if (!currentS1Run && basePapers.length > 0) {
      startS1Run();
    }
  }, [currentS1Run, basePapers, startS1Run]);

  // Derive local array from store dict for easier rendering
  const papers = currentS1Run ? Object.values(currentS1Run.papers) : [];

  const filteredPapers = papers.filter((p) => {
    if (activeFilter === 'All') return true;
    return p.s1Decision === activeFilter;
  });

  const currentPaper = filteredPapers[currentIndex];

  const handleDecision = (decision: Decision) => {
    if (!currentPaper) return;
    updatePaperInCurrentRun(currentPaper.id, { s1Decision: decision });
  };

  // Automatically sync visual highlight to the paper currently being analyzed in the background
  useEffect(() => {
    if (isRunning) {
      const analyzingIdx = filteredPapers.findIndex(p => p.s1Decision === 'ANALYZING');
      if (analyzingIdx !== -1 && analyzingIdx !== currentIndex) {
        setCurrentIndex(analyzingIdx);
      }
    }
  }, [filteredPapers, isRunning, currentIndex]);



  const stats = currentS1Run?.stats || { total: 0, included: 0, excluded: 0, notAccessible: 0 };
  const pending = papers.filter(p => !p.s1Decision || p.s1Decision === 'PENDING' || p.s1Decision === 'ANALYZING').length;
  const progress = stats.total > 0 ? ((stats.total - pending) / stats.total) * 100 : 0;

  function renderDecisionIcon(decision: Decision | undefined) {
    if (decision === 'INCLUDED') return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (decision === 'EXCLUDED') return <XCircle className="w-4 h-4 text-red-600" />;
    if (decision === 'NOT ACCESSIBLE') return <HelpCircle className="w-4 h-4 text-yellow-600" />;
    if (decision === 'ANALYZING') return <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />;
    return <div className="w-4 h-4 rounded-full border-2 border-muted" />;
  }

  function getDecisionColor(decision: Decision | undefined) {
    if (decision === 'INCLUDED') return 'text-green-600';
    if (decision === 'EXCLUDED') return 'text-red-600';
    if (decision === 'NOT ACCESSIBLE') return 'text-yellow-600';
    if (decision === 'ANALYZING') return 'text-primary';
    return 'text-muted-foreground';
  }

  return (
    <LayoutWrapper
      headerTitle="Abstract Screening (Step 1)"
      headerDescription={currentS1Run ? `Run: ${currentS1Run.name} (${currentS1Run.model})` : "Review and classify papers based on inclusion criteria"}
    >
      <div className="p-6 space-y-6 animate-in fade-in duration-500">

        {/* Controls Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-4">
            <Button
              onClick={toggleS1ProcessingLoop}
              disabled={pauseTimeLeft > 0}
              className={`gap-2 shadow-md transition-smooth ${isRunning ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
            >
              {pauseTimeLeft > 0 ? <Loader2 className="w-4 h-4 animate-spin" /> : (isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />)}
              {pauseTimeLeft > 0 ? `Rate Limit Paused (${pauseTimeLeft}s)` : (isRunning ? 'Pause AI Screening' : 'Start AI Screening')}
            </Button>
            {isRunning && pauseTimeLeft === 0 && (
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                AI is analyzing...
              </span>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4 border-border bg-secondary/30">
            <p className="text-xs text-muted-foreground mb-1">Total Papers</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </Card>
          <Card className="p-4 border-border bg-green-500/10">
            <p className="text-xs text-muted-foreground mb-1">Included</p>
            <p className="text-2xl font-bold text-green-600">{stats.included}</p>
          </Card>
          <Card className="p-4 border-border bg-red-500/10">
            <p className="text-xs text-muted-foreground mb-1">Excluded</p>
            <p className="text-2xl font-bold text-red-600">{stats.excluded}</p>
          </Card>
          <Card className="p-4 border-border bg-yellow-500/10">
            <p className="text-xs text-muted-foreground mb-1">Pending/Unknown</p>
            <p className="text-2xl font-bold text-yellow-600">{pending + stats.notAccessible}</p>
          </Card>
          <Card className="p-4 border-border bg-primary/10 md:col-span-1">
            <p className="text-xs text-muted-foreground mb-1">Progress</p>
            <p className="text-2xl font-bold text-primary">{Math.round(progress)}%</p>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Left Panel - Paper List */}
          <div className="space-y-4">
            {/* Filters */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                <Filter className="w-3 h-3" /> Filter
              </p>
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setActiveFilter(filter);
                      setCurrentIndex(0);
                    }}
                    className={`text-left px-3 py-1.5 rounded-md text-xs font-medium transition-smooth border ${activeFilter === filter
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                      }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Paper List */}
            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Papers ({filteredPapers.length})
              </p>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {filteredPapers.map((paper, idx) => (
                  <button
                    key={paper.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-full text-left p-3 rounded-md transition-smooth border \${
                      paper.id === currentPaper?.id
                        ? 'bg-primary/10 border-primary'
                        : 'bg-secondary border-border hover:border-primary/30'
                    }`}
                  >
                    <p className="text-xs font-medium text-foreground line-clamp-2">
                      {paper.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{paper.year || 'No Year'}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {renderDecisionIcon(paper.s1Decision)}
                      <span className={`text-xs font-medium \${getDecisionColor(paper.s1Decision)}`}>
                        {paper.s1Decision}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Paper Details */}
          {currentPaper ? (
            <Card className="lg:col-span-3 p-8 border-border space-y-6 animate-in fade-in duration-300">
              {/* Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-foreground leading-tight">
                      {currentPaper.title}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2">
                      {currentPaper.author || 'Unknown Authors'}
                    </p>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <Badge variant="outline">{currentPaper.year || 'Unknown Year'}</Badge>
                      {currentPaper.doi && <Badge variant="secondary">DOI: {currentPaper.doi}</Badge>}
                      {currentPaper.s1Confidence !== undefined && (
                        <Badge className="bg-primary/20 text-primary border-primary/30">
                          AI Confidence: {Math.round(currentPaper.s1Confidence * 100)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  {currentPaper.s1Decision && currentPaper.s1Decision !== 'PENDING' && (
                    <div
                      className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg \${
                        currentPaper.s1Decision === 'INCLUDED'
                          ? 'bg-green-500/10'
                          : currentPaper.s1Decision === 'EXCLUDED'
                          ? 'bg-red-500/10'
                          : 'bg-yellow-500/10'
                      }`}
                    >
                      {renderDecisionIcon(currentPaper.s1Decision)}
                      <span className={`text-xs font-bold \${getDecisionColor(currentPaper.s1Decision)}`}>
                        {currentPaper.s1Decision}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Reason */}
              {currentPaper.s1Reason && (
                <div className="space-y-2 p-4 bg-muted/50 rounded-lg border border-border">
                  <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> AI Justification
                  </h3>
                  <p className="text-sm text-foreground/90">
                    {currentPaper.s1Reason}
                  </p>
                </div>
              )}

              {/* Abstract */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Abstract</h3>
                <p className="text-sm text-foreground/80 leading-relaxed max-h-60 overflow-y-auto pr-2">
                  {currentPaper.abstract || <span className="text-muted-foreground italic">No abstract available for this paper.</span>}
                </p>
              </div>

              {/* Manual Override Buttons */}
              <div className="space-y-3 pt-4 border-t border-border">
                <p className="text-sm font-medium text-foreground">
                  Manual Override: Update decision directly
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleDecision('INCLUDED')}
                    className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white shadow-md transition-smooth"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Ensure Included
                  </Button>
                  <Button
                    onClick={() => handleDecision('EXCLUDED')}
                    className="flex-1 gap-2 bg-red-600 hover:bg-red-700 text-white shadow-md transition-smooth"
                  >
                    <XCircle className="w-4 h-4" /> Ensure Excluded
                  </Button>
                  <Button
                    onClick={() => handleDecision('NOT ACCESSIBLE')}
                    variant="outline"
                    className="flex-1 gap-2 shadow-md transition-smooth"
                  >
                    <HelpCircle className="w-4 h-4" /> Mark N/A
                  </Button>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  Paper {currentIndex + 1} of {filteredPapers.length}
                </span>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                    disabled={currentIndex === 0}
                    variant="outline"
                    size="sm"
                    className="border-border disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() =>
                      setCurrentIndex(
                        Math.min(filteredPapers.length - 1, currentIndex + 1)
                      )
                    }
                    disabled={currentIndex === filteredPapers.length - 1}
                    variant="outline"
                    size="sm"
                    className="border-border disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="lg:col-span-3 p-8 border-border flex items-center justify-center min-h-[400px]">
              <p className="text-muted-foreground">No papers found for this filter.</p>
            </Card>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Link href="/review/setup">
            <Button variant="outline" className="border-border hover:bg-secondary">
              Back to Setup
            </Button>
          </Link>
          <div className="flex gap-2">
            <Link href="/review/gate">
              <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md">
                Continue to Quality Gate
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
