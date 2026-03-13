'use client';

import { useState, useRef, useEffect } from 'react';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2, XCircle, FileText, Upload, Play,
  Pause, Download, Loader2, Info, ChevronRight, Activity, FileKey
} from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import Link from 'next/link';
import { toast } from 'sonner';
import { useReviewStore, Paper, Decision } from '@/store/useReviewStore';
import { extractTextFromPDF, matchFileToPaper, exportToExcel } from '@/lib/fileParser';
import { processStep2 } from '@/lib/llmClient';
import { FileDropZone } from '@/components/file-drop-zone';

export default function FullTextReviewPage() {
  const { currentS2Run, updatePaperInS2Run, apiKey, provider, model, topic, inclusionCriteria, exclusionCriteria, extraContext, extractionFields } = useReviewStore();

  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('extraction');

  const [pdfTexts, setPdfTexts] = useState<Record<string, string>>({});
  const [isParsingFiles, setIsParsingFiles] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [pauseTimeLeft, setPauseTimeLeft] = useState(0);

  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;
  const pdfTextsRef = useRef(pdfTexts);
  pdfTextsRef.current = pdfTexts;

  const papers = currentS2Run ? Object.values(currentS2Run.papers) : [];

  // Auto-select analyzing paper
  useEffect(() => {
    const analyzing = papers.find(p => p.s2Status === 'REVIEWING');
    if (analyzing) {
      setSelectedPaperId(analyzing.id);
    } else if (!selectedPaperId && papers.length > 0) {
      setSelectedPaperId(papers[0].id);
    }
  }, [papers, selectedPaperId]);

  const currentPaper = papers.find(p => p.id === selectedPaperId) || papers[0];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | FileList) => {
    let files: FileList | null = null;
    if (e instanceof FileList) {
      files = e;
    } else {
      files = e.currentTarget.files;
    }
    
    if (!files || files.length === 0) return;

    setIsParsingFiles(true);
    const newTexts = { ...pdfTexts };

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.endsWith('.pdf')) {
          const matchedPaper = matchFileToPaper(file.name, papers);
          if (matchedPaper) {
            toast.info(`Parsing ${file.name}...`);
            const text = await extractTextFromPDF(file);
            newTexts[matchedPaper.id] = text;
          } else {
            toast.warning(`No matching paper for ${file.name}`);
          }
        }
      }
      setPdfTexts(newTexts);
      toast.success("PDF parsing complete");
    } catch (err) {
      console.error("PDF Parsing Error", err);
      toast.error("Parsing Failed", {
        description: "Failed to parse some of the uploaded PDFs. Ensure they are valid text-searchable PDFs."
      });
    } finally {
      setIsParsingFiles(false);
    }
  };

  const toggleProcessing = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      if (!apiKey || !provider || !model) {
        toast.error("API Key Missing", {
          id: "api-key-missing-toast",
          description: "Please return to the Setup page and configure your API Key and Model before starting Full-Text Extraction."
        });
        return;
      }
      setIsRunning(true);
      runProcessingLoop();
    }
  };

  const runProcessingLoop = async () => {
    while (isRunningRef.current) {
      const state = useReviewStore.getState();
      const currentRun = state.currentS2Run;
      if (!currentRun) break;

      const allPapers = Object.values(currentRun.papers);
      const nextPaper = allPapers.find(p => p.s2Status === 'PENDING' && pdfTextsRef.current[p.id]);

      if (!nextPaper) {
        setIsRunning(false);
        break;
      }

      state.updatePaperInS2Run(nextPaper.id, { s2Status: 'REVIEWING' });

      try {
        const result = await processStep2(
          nextPaper,
          pdfTextsRef.current[nextPaper.id],
          { apiKey: state.apiKey, provider: state.provider, model: state.model },
          { topic: state.topic, inclusionCriteria: state.inclusionCriteria, exclusionCriteria: state.exclusionCriteria, extraContext: state.extraContext, extractionFields: state.extractionFields }
        );
        state.updatePaperInS2Run(nextPaper.id, {
          s2Decision: result.decision,
          s2Reason: result.reason,
          s2Status: 'DONE',
          extractedData: result.extractedData
        });
      } catch (err: any) {
        console.error("Step 2 error for", nextPaper.id, err);

        if (err.name === 'QuotaError') {
          state.updatePaperInS2Run(nextPaper.id, { s2Status: 'PENDING' });
          setIsRunning(false);
          toast.error("Daily Quota Reached", {
            id: "quota-error-toast",
            description: "The process has been paused because your API key's daily limit or billing credits cannot handle the remaining files."
          });
          break;
        }

        if (err.name === 'RateLimitError') {
          const waitSeconds = err.retryAfterSeconds || 60;
          state.updatePaperInS2Run(nextPaper.id, { s2Status: 'PENDING' });

          console.log(`Rate limit hit, pausing Full-Text extraction for \${waitSeconds} seconds...`);

          for (let i = waitSeconds; i > 0; i--) {
            if (!isRunningRef.current) break;
            setPauseTimeLeft(i);
            await new Promise(r => setTimeout(r, 1000));
          }
          setPauseTimeLeft(0);
          continue;
        }

        state.updatePaperInS2Run(nextPaper.id, { s2Status: 'ERROR' });
        setIsRunning(false);
        toast.error("API Error", {
          id: "api-error-toast",
          description: `\${err.message || 'Unknown error'}. Processing paused.`
        });
        break;
      }
    }
  };

  const handleExportFinal = () => {
    if (!currentS2Run) return;
    const allProcessed = Object.values(currentS2Run.papers).map(p => {
      const flatExtracted = p.extractedData ? Object.entries(p.extractedData).reduce((acc, [k, v]) => {
        acc[`Extracted_\${k}`] = Array.isArray(v) ? v.join('; ') : String(v);
        return acc;
      }, {} as Record<string, string>) : {};

      return {
        ID: p.id,
        Title: p.title,
        Authors: p.author || '',
        Year: p.year || '',
        DOI: p.doi || '',
        Step1_Decision: p.s1Decision || '',
        Step2_Status: p.s2Status || '',
        Step2_Decision: p.s2Decision || '',
        Step2_Reason: p.s2Reason || '',
        ...flatExtracted
      };
    });

    const includedOnly = allProcessed.filter(p => p.Step2_Decision === 'INCLUDED');

    exportToExcel([
      { name: 'Full Review Results', data: allProcessed },
      { name: 'Included Papers', data: includedOnly }
    ], `SLR_AI_Final_\${currentS2Run.name || 'Export'}.xlsx`);
  };

  const total = papers.length;
  const doneCount = papers.filter(p => p.s2Status === 'DONE').length;
  const pdfsLoaded = Object.keys(pdfTexts).length;

  function renderStatus(status: 'DONE' | 'PENDING' | 'REVIEWING' | 'ERROR' | undefined, decision: string | undefined) {
    if (status === 'DONE') {
      if (decision === 'INCLUDED') return <span className="text-[9px] uppercase tracking-widest font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(74,222,128,0.2)]">INCLUDED</span>;
      if (decision === 'EXCLUDED') return <span className="text-[9px] uppercase tracking-widest font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(248,113,113,0.2)]">EXCLUDED</span>;
      return <span className="text-[9px] uppercase tracking-widest font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded">DONE</span>;
    }
    if (status === 'REVIEWING') return <span className="text-[9px] uppercase tracking-widest font-bold text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.4)]">EXTRACTING...</span>;
    if (status === 'ERROR') return <span className="text-[9px] uppercase tracking-widest font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded">ERROR</span>;
    return <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded">PENDING</span>;
  }

  return (
    <LayoutWrapper
      headerTitle="Full-Text Review"
      headerDescription="Deep extraction phase on included PDFs"
    >
      <div className="p-6 h-[calc(100vh-80px)] flex flex-col overflow-hidden max-w-[1800px] mx-auto animate-in fade-in duration-500 bg-background text-foreground">

        {!currentS2Run && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-yellow-500 mb-6 text-xs uppercase tracking-widest font-bold">
            No active processing queue found. Please start a run from the previous screening step.
          </div>
        )}

        {/* TOP BAR */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 flex-shrink-0">
          <FileDropZone 
            onFilesDrop={handleFileUpload} 
            accept=".pdf" 
            disabled={isParsingFiles}
            className="w-auto h-auto rounded-full"
          >
            <div className="flex items-center gap-6 border border-border rounded-full p-1 pr-6 bg-secondary">
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isParsingFiles}
                />
                <div className="h-10 px-6 rounded-full bg-white/10 hover:bg-white/20 text-foreground flex items-center gap-2 font-bold uppercase tracking-widest text-[10px] transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  {isParsingFiles ? "Parsing..." : "Upload PDFs"}
                </div>
              </label>
              <div className="flex items-center gap-2">
                <FileKey className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{pdfsLoaded} PDFs loaded into memory</span>
              </div>
            </div>
          </FileDropZone>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleExportFinal}
              disabled={!currentS2Run}
              className="h-10 px-6 gap-2 bg-transparent text-foreground border border-white/20 hover:bg-white/10 font-bold uppercase tracking-widest text-[10px] rounded-full"
            >
              <Download className="w-4 h-4" />
              Export Matrix
            </Button>

            <Button
              onClick={toggleProcessing}
              disabled={!currentS2Run || isParsingFiles || pdfsLoaded === 0 || pauseTimeLeft > 0}
              className={`h-10 px-8 gap-2 font-bold uppercase tracking-widest text-[10px] rounded-full shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all hover:scale-105 active:scale-95 \${isRunning ? 'bg-amber-500 hover:bg-amber-400 text-black' : 'bg-white hover:bg-white/90 text-black'}`}
            >
              {pauseTimeLeft > 0 ? <Loader2 className="w-4 h-4 animate-spin" /> : (isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />)}
              {pauseTimeLeft > 0 ? `PAUSED (\${pauseTimeLeft}s)` : (isRunning ? 'PAUSE ENGINE' : 'START ENGINE')}
            </Button>
          </div>
        </div>

        <div className="flex-1 flex gap-6 min-h-0">

          {/* LEFT SIDEBAR: PROCESSING QUEUE */}
          <div className="w-[350px] flex-shrink-0 flex flex-col gap-4">
            <Card className="flex-1 bg-card/80 backdrop-blur-xl border border-border rounded-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-500" />
                  <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Processing Queue</h3>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">{doneCount} / {total}</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                <div className="grid gap-1">
                  {papers.map((paper, idx) => {
                    const hasPdf = !!pdfTexts[paper.id];
                    return (
                      <div
                        key={paper.id}
                        onClick={() => setSelectedPaperId(paper.id)}
                        className={`cursor-pointer group flex items-start justify-between p-3 rounded-xl transition-all border border-solid \${selectedPaperId === paper.id ? 'bg-white/10 border-white/20 shadow-inner' : 'bg-transparent border-transparent hover:bg-secondary'}`}
                      >
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[8px] font-mono text-muted-foreground">#{(idx + 1).toString().padStart(3, '0')}</span>
                            {!hasPdf ? (
                              <span className="text-[8px] font-bold uppercase tracking-widest text-red-500/70 border border-red-500/20 bg-red-500/10 px-1 rounded-sm">No PDF</span>
                            ) : (
                              <span className="text-[8px] font-bold uppercase tracking-widest text-green-500/70 border border-green-500/20 bg-green-500/10 px-1 rounded-sm">Ready</span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">{paper.title}</p>
                        </div>
                        <div className="flex-shrink-0 mt-1">
                          {renderStatus(paper.s2Status as 'DONE' | 'PENDING' | 'REVIEWING' | 'ERROR' | undefined, paper.s2Decision)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>

          {/* MAIN CENTER AREA: EXTRACTED DATA PAYLOAD */}
          <div className="flex-1 flex flex-col gap-6 min-w-0">
            {currentPaper ? (
              <Card className="flex-1 bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 relative overflow-hidden flex flex-col">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 opacity-20" />

                <div className="flex items-start justify-between mb-8 pb-6 border-b border-border">
                  <div className="space-y-2 pr-8">
                    <h3 className="text-[10px] uppercase tracking-widest text-purple-400 font-bold flex items-center gap-2 mb-3">
                      <FileText className="w-3.5 h-3.5" /> Extracted Data Payload
                    </h3>
                    <h2 className="text-2xl font-bold text-foreground leading-tight">
                      {currentPaper.title}
                    </h2>
                    <p className="text-sm font-mono text-muted-foreground">
                      {currentPaper.author || 'Unknown Authors'} • {currentPaper.year || 'N/A'} • {currentPaper.doi || 'No DOI'}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right space-y-2">
                    {renderStatus(currentPaper.s2Status as 'DONE' | 'PENDING' | 'REVIEWING' | 'ERROR' | undefined, currentPaper.s2Decision)}
                    {currentPaper.s2Status === 'REVIEWING' && (
                      <p className="text-[9px] text-purple-400 font-mono animate-pulse mt-1">Extracting properties...</p>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                  {currentPaper.s2Status === 'REVIEWING' ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50">
                      <div className="w-12 h-12 rounded-full border-t border-r border-purple-500 animate-spin mb-4" />
                      <p className="font-mono text-xs tracking-widest uppercase">Initializing LLM Decoder...</p>
                    </div>
                  ) : currentPaper.extractedData && Object.keys(currentPaper.extractedData).length > 0 ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                      {currentPaper.s2Reason && (
                        <div className="col-span-1 lg:col-span-2 space-y-2 p-5 rounded-xl bg-purple-500/5 border border-purple-500/10 relative overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-purple-500/50" />
                          <p className="text-[10px] uppercase tracking-widest text-purple-400 font-bold">Reasoning Output</p>
                          <p className="text-xs text-foreground leading-relaxed font-mono">{currentPaper.s2Reason}</p>
                        </div>
                      )}

                      {Object.entries(currentPaper.extractedData).map(([key, value]) => (
                        <div key={key} className="space-y-3 p-5 rounded-xl bg-secondary border border-border hover:bg-white/[0.04] transition-colors relative group">
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white/10 group-hover:bg-white/30 transition-colors" />
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                          <div className="text-sm text-foreground break-words font-mono tracking-tight leading-relaxed">
                            {Array.isArray(value) ? (
                              <ul className="list-disc pl-4 space-y-1 marker:text-muted-foreground/50">
                                {value.map((v, i) => <li key={i}>{v}</li>)}
                              </ul>
                            ) : (
                              <p>{String(value) || <span className="text-muted-foreground/50 italic">null</span>}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50">
                      <FileText className="w-10 h-10 mb-3 opacity-20" />
                      <p className="text-sm">No structured data extracted.</p>
                      <p className="text-[10px] font-mono mt-1">Status: {currentPaper.s2Status || 'PENDING'}</p>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground/50 font-mono text-sm border border-dashed border-border rounded-2xl">
                Awaiting paper selection.
              </div>
            )}
          </div>

        </div>
      </div>
    </LayoutWrapper>
  );
}
