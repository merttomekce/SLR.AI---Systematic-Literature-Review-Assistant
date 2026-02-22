'use client';

import { useState, useRef } from 'react';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  MessageSquare,
  Book,
  Settings,
  AlertCircle,
  Upload,
  Play,
  Pause,
  Download
} from 'lucide-react';
import Link from 'next/link';
import { useReviewStore, Paper, Decision } from '@/store/useReviewStore';
import { extractTextFromPDF, matchFileToPaper, exportToExcel } from '@/lib/fileParser';
import { processStep2 } from '@/lib/llmClient';

export default function FullTextReviewPage() {
  const { currentS2Run, updatePaperInS2Run, apiKey, provider, model, topic, inclusionCriteria, exclusionCriteria, extraContext, extractionFields } = useReviewStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('extraction');

  // Local state to store parsed pdf text for each paper to avoid re-parsing on every run
  const [pdfTexts, setPdfTexts] = useState<Record<string, string>>({});
  const [isParsingFiles, setIsParsingFiles] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;
  const pdfTextsRef = useRef(pdfTexts);
  pdfTextsRef.current = pdfTexts;

  const papers = currentS2Run ? Object.values(currentS2Run.papers) : [];
  const currentPaper = papers[currentIndex];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files || files.length === 0) return;

    setIsParsingFiles(true);
    const newTexts = { ...pdfTexts };

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.endsWith('.pdf')) {
          const matchedPaper = matchFileToPaper(file.name, papers);
          if (matchedPaper) {
            const text = await extractTextFromPDF(file);
            newTexts[matchedPaper.id] = text;
          }
        }
      }
      setPdfTexts(newTexts);
    } catch (err) {
      console.error("PDF Parsing Error", err);
      alert("Failed to parse some PDFs.");
    } finally {
      setIsParsingFiles(false);
    }
  };

  const toggleProcessing = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
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
      // Find next pending paper that also has a PDF loaded
      const nextPaper = allPapers.find(p => p.s2Status === 'PENDING' && pdfTextsRef.current[p.id]);

      if (!nextPaper) {
        setIsRunning(false);
        break; // All done with available PDFs
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
      } catch (err) {
        console.error("Step 2 error for", nextPaper.id, err);
        state.updatePaperInS2Run(nextPaper.id, { s2Status: 'ERROR' });
        setIsRunning(false);
        alert("API Error: Processing paused.");
        break;
      }

      await new Promise(r => setTimeout(r, 1000)); // slightly larger delay for bigger context
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

  return (
    <LayoutWrapper
      headerTitle="Full-Text Review (Step 2)"
      headerDescription={currentS2Run ? `Run: \${currentS2Run.name} (\${currentS2Run.model})` : "Extract and analyze data from included studies"}
    >
      <div className="p-6 space-y-6 animate-in fade-in duration-500">
        {!currentS2Run && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-yellow-600 mb-6">
            No active Step 2 run found. Progress through Step 1 and the Gate to reach this step.
          </div>
        )}

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pb-4 border-b border-border">
          
          <div className="flex gap-4 items-center w-full sm:w-auto">
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isParsingFiles}
              />
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md shadow-sm transition-smooth font-medium text-sm">
                <Upload className="w-4 h-4" />
                {isParsingFiles ? "Parsing PDFs..." : "Upload PDFs"}
              </div>
            </label>
            <span className="text-sm font-medium text-muted-foreground">{pdfsLoaded} PDFs loaded in memory</span>
          </div>

          <div className="flex items-center gap-4">
             <Button
                onClick={toggleProcessing}
                disabled={!currentS2Run || isParsingFiles || pdfsLoaded === 0}
                className={`gap-2 shadow-md transition-smooth \${isRunning ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isRunning ? 'Pause Extraction' : 'Start Full-Text Extraction'}
              </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Left Sidebar - Paper List */}
          <div className="space-y-4">
            <Card className="p-4 border-border space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase flex justify-between">
                <span>Included in S1 ({total})</span>
                <span>Done ({doneCount})</span>
              </p>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {papers.map((paper, idx) => (
                  <button
                    key={paper.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setActiveTab('extraction');
                    }}
                    className={`w-full text-left p-3 rounded-md transition-smooth border relative \${
                      paper.id === currentPaper?.id
                        ? 'bg-primary/10 border-primary'
                        : 'bg-secondary border-border hover:border-primary/30'
                    }`}
                  >
                    {pdfTexts[paper.id] && (
                       <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500" title="PDF Loaded" />
                    )}
                    <p className="text-xs font-medium text-foreground line-clamp-2 pr-4">
                      {paper.title}
                    </p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] uppercase \${paper.s2Status === 'DONE' ? 'bg-green-500/10 text-green-600 border-green-200' : paper.s2Status === 'ERROR' ? 'bg-red-500/10 text-red-600 border-red-200' : ''}`}>
                        {paper.s2Decision ? `\${paper.s2Decision}` : paper.s2Status || 'PENDING'}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Content - Paper Details */}
          {currentPaper ? (
            <Card className="lg:col-span-3 border-border animate-in fade-in duration-300">
              {/* Header */}
              <div className="p-6 border-b border-border space-y-3 relative">
                <div>
                  <h2 className="text-xl font-bold text-foreground leading-tight">
                    {currentPaper.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    {currentPaper.author || 'Unknown Authors'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{currentPaper.year || 'Unknown Year'}</Badge>
                  {currentPaper.doi && <Badge variant="secondary" className="font-mono text-xs">{currentPaper.doi}</Badge>}
                  {pdfTexts[currentPaper.id] ? (
                    <Badge className="bg-green-500/10 text-green-600 border-green-200">PDF Ready</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">No PDF</Badge>
                  )}
                </div>
              </div>

              {/* Status Banner */}
              {currentPaper.s2Status === 'DONE' && (
                <div className={`px-6 py-3 border-b border-border flex flex-col gap-1 \${currentPaper.s2Decision === 'INCLUDED' ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
                   <div className="flex items-center gap-2 font-semibold">
                     {currentPaper.s2Decision === 'INCLUDED' ? <CheckCircle2 className="w-5 h-5 text-green-600"/> : <XCircle className="w-5 h-5 text-red-600"/>}
                     <span className={currentPaper.s2Decision === 'INCLUDED' ? 'text-green-600' : 'text-red-600'}>
                       Final Decision: {currentPaper.s2Decision}
                     </span>
                   </div>
                   {currentPaper.s2Reason && <p className="text-sm text-foreground/80 mt-1">{currentPaper.s2Reason}</p>}
                </div>
              )}

              {/* Tabs */}
              <div className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-2 bg-secondary">
                    <TabsTrigger value="extraction" className="gap-2 text-xs">
                      <FileText className="w-4 h-4" />
                      Extracted Data
                    </TabsTrigger>
                    <TabsTrigger value="pdftext" className="gap-2 text-xs">
                      <Book className="w-4 h-4" />
                      PDF Text
                    </TabsTrigger>
                  </TabsList>

                  {/* Data Extraction Tab */}
                  <TabsContent value="extraction" className="space-y-4 mt-4">
                    {currentPaper.s2Status === 'REVIEWING' ? (
                       <div className="p-12 flex flex-col items-center justify-center text-primary">
                          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
                          <p className="font-medium animate-pulse">AI is reading full text...</p>
                       </div>
                    ) : currentPaper.extractedData && Object.keys(currentPaper.extractedData).length > 0 ? (
                      <div className="space-y-4">
                        {Object.entries(currentPaper.extractedData).map(([key, value]) => (
                           <div key={key} className="space-y-1 bg-muted/30 p-4 rounded-lg border border-border">
                             <p className="text-sm font-semibold text-foreground capitalize">
                               {key.replace(/([A-Z])/g, ' $1').trim()}
                             </p>
                             <div className="text-sm text-foreground/80 break-words">
                               {Array.isArray(value) ? (
                                 <ul className="list-disc pl-5 mt-2 space-y-1">
                                   {value.map((v, i) => <li key={i}>{v}</li>)}
                                 </ul>
                               ) : (
                                 String(value)
                               )}
                             </div>
                           </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 rounded-lg bg-secondary/50 text-center border border-dashed border-border mb-4">
                        <p className="text-sm text-muted-foreground mb-2">
                          No data extracted yet.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  {/* PDF Text Tab */}
                  <TabsContent value="pdftext" className="space-y-4 mt-4">
                    {pdfTexts[currentPaper.id] ? (
                       <div className="w-full max-h-96 overflow-y-auto p-4 rounded-md bg-input border border-border text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                          {pdfTexts[currentPaper.id].substring(0, 5000)}
                          {pdfTexts[currentPaper.id].length > 5000 && <div className="mt-4 pt-4 border-t border-border text-center text-primary">--- Text Truncated in UI (Full text is used in AI) ---</div>}
                       </div>
                    ) : (
                       <div className="p-8 rounded-lg bg-secondary/50 text-center border border-dashed border-border mb-4">
                        <p className="text-sm text-muted-foreground mb-2">
                          No PDF loaded for this paper. Upload PDFs above.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              {/* Navigation */}
              <div className="p-6 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Paper {currentIndex + 1} of {papers.length}
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
                      setCurrentIndex(Math.min(papers.length - 1, currentIndex + 1))
                    }
                    disabled={currentIndex === papers.length - 1}
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
              <p className="text-muted-foreground">Load papers through S1 Gate first.</p>
            </Card>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-border gap-4">
          <Link href="/review/gate">
            <Button variant="outline" className="border-border hover:bg-secondary">
              Back to Quality Gate
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button 
                onClick={handleExportFinal}
                disabled={!currentS2Run}
                className="gap-2 bg-green-600 text-white hover:bg-green-700 shadow-md"
              >
              <Download className="w-4 h-4" />
              Export Final Excel
            </Button>
            <Link href="/review/comparison">
              <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md">
                View Comparison
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
