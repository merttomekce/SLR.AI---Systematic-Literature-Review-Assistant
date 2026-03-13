'use client';

import { useState, useEffect } from 'react';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, ChevronRight, FileText, FileSearch, Settings, Loader2, Info, CheckCircle2 } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { useRouter } from 'next/navigation';
import { useReviewStore } from '@/store/useReviewStore';
import { cn } from '@/lib/utils';
import { FileDropZone } from '@/components/file-drop-zone';
import { parseExcelFile, parseTextReferences, extractTextFromPDF } from '@/lib/fileParser';
import { extractResearchParameters, extractResearchParametersRegex } from '@/lib/llmClient';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const PROVIDER_NAMES: Record<string, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google Gemini',
};

export default function SetupPage() {
  const router = useRouter();

  // Zustand store
  const {
    apiKey, provider, model, runName, availableModels, isFetchingModels,
    localEngine, customLocalEndpoint, setLocalEngine,
    topic, inclusionCriteria, exclusionCriteria, extractionFields, extraContext, papers,
    setApiKey, setProviderAndModel, setRunName, setResearchConfig, loadPapers, fetchAvailableModels
  } = useReviewStore();

  const [isLocalMode, setIsLocalMode] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isExtractingParams, setIsExtractingParams] = useState(false);
  const [apaText, setApaText] = useState('');
  const [useAiExtraction, setUseAiExtraction] = useState(false);
  const isModelReady = !!model && availableModels.length > 0 && !availableModels[0].includes('Offline');

  useEffect(() => {
    if (!isModelReady) {
      setUseAiExtraction(false);
    }
  }, [isModelReady]);
  // Auto-fetch local models once toggled
  useEffect(() => {
    if (isLocalMode) {
      if (localEngine) {
         fetchAvailableModels('local-mode');
      }
    } else {
      if (apiKey === 'local-mode') setApiKey('');
    }
  }, [isLocalMode, localEngine, customLocalEndpoint, fetchAvailableModels]);

  // Debounce API key typing to trigger auto-fetch for cloud
  useEffect(() => {
    if (isLocalMode) return;
    const timer = setTimeout(() => {
      if (apiKey && apiKey.length > 5 && apiKey !== 'local-mode') {
        fetchAvailableModels(apiKey);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [apiKey, fetchAvailableModels, isLocalMode]);

  const handleRequirementsUpload = async (e?: React.ChangeEvent<HTMLInputElement> | FileList) => {
    let file: File | undefined;
    if (e instanceof FileList) {
      file = e[0];
    } else if (e) {
      file = e.currentTarget.files?.[0];
    }
    
    if (!file) return;

    if (useAiExtraction && !apiKey && provider !== 'local') {
      toast.error('API Key Missing', { description: 'Please provide an API key or connect a local model first for AI extraction.' });
      return;
    }

    if (!file.name.endsWith('.pdf')) {
      toast.error('Invalid File', { description: 'Please upload a PDF document.' });
      return;
    }

    setIsExtractingParams(true);
    try {
      toast.info('Extracting Text from PDF...');
      const text = await extractTextFromPDF(file);

      if (!text || text.trim().length === 0) {
        throw new Error("Could not extract any text from the PDF.");
      }

      if (useAiExtraction) {
        toast.info('Analyzing Requirements Document with AI...');
        const config = { provider, model, apiKey };
        const extractedParams = await extractResearchParameters(text, config);
        setResearchConfig(extractedParams);
        toast.success('Research Parameters Extracted (AI Assisted)');
      } else {
        toast.info('Extracting Parameters via Regex...');
        const extractedParams = extractResearchParametersRegex(text);
        setResearchConfig(extractedParams);
        toast.success('Research Parameters Extracted (Fast Regex)');
      }
    } catch (err: any) {
      console.error('Extraction Error:', err);
      toast.error('Extraction Failed', { description: err.message || 'An unknown error occurred.' });
    } finally {
      setIsExtractingParams(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | FileList) => {
    let files: FileList | null = null;
    if (e instanceof FileList) {
      files = e;
    } else {
      files = e.currentTarget.files;
    }

    if (files) {
      setIsParsing(true);
      try {
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          if (f.name.endsWith('.xlsx') || f.name.endsWith('.csv')) {
            const parsedPapers = await parseExcelFile(f);
            loadPapers(parsedPapers, false);
            setUploadedFiles((prev) => [...prev, f.name]);
          } else {
            alert(`Only .xlsx and .csv files are supported for references right now.`);
          }
        }
      } catch (err) {
        console.error("Error parsing file:", err);
        alert("Failed to parse file. Ensure it's a valid Excel/CSV.");
      } finally {
        setIsParsing(false);
      }
    }
  };

  const handlePasteRefs = () => {
    if (!apaText.trim()) return;
    const parsedPapers = parseTextReferences(apaText);
    if (parsedPapers.length > 0) {
      loadPapers(parsedPapers, false);
      setUploadedFiles((prev) => [...prev, `Pasted References (${parsedPapers.length})`]);
      setApaText(''); // clear text area after successful load
    } else {
      alert("Could not parse any references. Please check the format.");
    }
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f !== fileName));
  };

  const startReview = () => {
    router.push('/review/screening');
  };

  const isFormValid = topic && (provider === 'local' || apiKey) && papers.length > 0 && model;

  return (
    <LayoutWrapper
      headerTitle="New Review Setup"
      headerDescription="Configure system parameters for Systematic Literature Review"
    >
      <div className="p-6 md:p-8 pb-32 md:pb-32 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 bg-background text-foreground selection:bg-foreground/20">

        <form className="grid grid-cols-1 lg:grid-cols-2 gap-8" onSubmit={(e) => e.preventDefault()}>

          {/* ── Left Column: API Config + Data Sources ── */}
          <div className="space-y-8">

            {/* API Configuration */}
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-500" />
                  <h2 className="text-sm font-bold tracking-widest text-foreground uppercase">API Configuration</h2>
                </div>

                {/* Local vs Cloud Toggle */}
                <div className="flex items-center bg-secondary border border-border rounded-lg p-1">
                  <button
                    onClick={() => {
                        setIsLocalMode(false);
                        if (apiKey === 'local-mode') {
                           setApiKey('');
                           fetchAvailableModels('');
                        } else {
                           fetchAvailableModels(apiKey);
                        }
                    }}
                    className={`px-3 py-1 text-[10px] font-bold tracking-wider uppercase rounded-md transition-all ${!isLocalMode ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Cloud API
                  </button>
                  <button
                    onClick={() => {
                        setIsLocalMode(true);
                        setApiKey('local-mode');
                        if (!localEngine) setLocalEngine('lmstudio', 'http://127.0.0.1:1234/v1');
                    }}
                    className={`px-3 py-1 text-[10px] font-bold tracking-wider uppercase rounded-md transition-all ${isLocalMode ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Local AI
                  </button>
                </div>
              </div>

              <div className="grid gap-6">

                {/* API Key Input (Hidden in Local Mode) */}
                {!isLocalMode && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label htmlFor="apiKey" className="text-[10px] uppercase tracking-widest text-muted-foreground">Provider API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={apiKey === 'local-mode' ? '' : apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="bg-secondary border border-border text-foreground font-mono text-sm h-12 px-4 shadow-inner focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl"
                    />
                  </div>
                )}

                {/* Local Engine Selection (Hidden in Cloud Mode) */}
                {isLocalMode && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-3">
                        <Label htmlFor="localEngine" className="text-[10px] uppercase tracking-widest text-muted-foreground">Select Local Engine</Label>
                        <Select 
                           value={localEngine || 'lmstudio'} 
                           onValueChange={(val: any) => {
                             let defaultUrl = customLocalEndpoint;
                             if (val === 'lmstudio') defaultUrl = 'http://127.0.0.1:1234/v1';
                             if (val === 'ollama') defaultUrl = 'http://127.0.0.1:11434/v1';
                             if (val === 'jan') defaultUrl = 'http://127.0.0.1:1337/v1';
                             setLocalEngine(val, defaultUrl);
                           }}
                        >
                          <SelectTrigger className="w-full bg-secondary border border-border text-foreground font-mono text-xs h-12 px-4 rounded-xl focus:ring-1 focus:ring-blue-500">
                             <SelectValue placeholder="Select Engine" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border text-foreground">
                             <SelectItem value="lmstudio" className="font-mono text-xs focus:bg-white/10 focus:text-foreground cursor-pointer">LM Studio</SelectItem>
                             <SelectItem value="ollama" className="font-mono text-xs focus:bg-white/10 focus:text-foreground cursor-pointer">Ollama</SelectItem>
                             <SelectItem value="jan" className="font-mono text-xs focus:bg-white/10 focus:text-foreground cursor-pointer">Jan</SelectItem>
                             <SelectItem value="custom" className="font-mono text-xs focus:bg-white/10 focus:text-foreground cursor-pointer">Custom Endpoint...</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                       <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Endpoint URL</Label>
                       <Input
                          value={customLocalEndpoint}
                          disabled={localEngine !== 'custom'}
                          onChange={(e) => setLocalEngine('custom', e.target.value)}
                          placeholder="http://127.0.0.1:11434/v1"
                          className={`bg-secondary border border-border text-foreground font-mono text-xs h-12 px-4 rounded-xl ${localEngine !== 'custom' ? 'opacity-50' : 'focus-visible:ring-1 focus-visible:ring-blue-500'}`}
                       />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Detected Provider</Label>
                    <div className="h-12 px-4 bg-secondary rounded-xl flex items-center border border-border">
                      <span className="text-sm font-mono text-muted-foreground">
                        {isLocalMode 
                          ? (localEngine ? localEngine.toUpperCase() : 'LOCAL') 
                          : (!apiKey ? 'Waiting for API Key...' : (isFetchingModels ? 'Detecting...' : (PROVIDER_NAMES[provider] || provider || 'Unknown')))}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="model" className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                      Model Selection {isFetchingModels && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                    </Label>
                    <Select value={model} onValueChange={(val) => setProviderAndModel(provider, val)} disabled={availableModels.length === 0 || isFetchingModels}>
                      <SelectTrigger className="w-full bg-secondary border border-border text-foreground font-mono text-xs h-12 px-4 rounded-xl focus:ring-1 focus:ring-blue-500">
                        <SelectValue placeholder={isFetchingModels ? "Fetching models..." : "Select model"} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border text-foreground">
                        {availableModels.map((v) => (
                          <SelectItem key={v} value={v} className="font-mono text-xs focus:bg-white/10 focus:text-foreground cursor-pointer">{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="runName" className="text-[10px] uppercase tracking-widest text-muted-foreground">Run Identifier (Name)</Label>
                  <Input
                    id="runName"
                    value={runName}
                    onChange={(e) => setRunName(e.target.value)}
                    placeholder="e.g. Initial Search 2026"
                    className="bg-secondary border border-border text-foreground font-mono text-sm h-12 px-4 shadow-inner focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Data Sources */}
            <div className="space-y-6 pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                <h2 className="text-sm font-bold tracking-widest text-foreground uppercase">Data Sources</h2>
              </div>

              {/* PDF Protocol Extractor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Auto-Fill from Protocol</Label>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[9px] font-bold uppercase tracking-widest", useAiExtraction ? "text-purple-400" : "text-muted-foreground/50")}>
                      AI Assisted
                    </span>
                    <Switch 
                      checked={useAiExtraction} 
                      onCheckedChange={setUseAiExtraction}
                      disabled={!isModelReady}
                      className="scale-90"
                    />
                  </div>
                </div>
                <FileDropZone 
                  onFilesDrop={handleRequirementsUpload} 
                  accept=".pdf" 
                  disabled={isExtractingParams}
                  className="rounded-2xl w-full h-full"
                >
                  <div className="relative group rounded-2xl p-[2px] overflow-hidden h-full">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative h-full bg-card rounded-[14px] border border-dashed border-border group-hover:border-white/20 transition-colors p-6 text-center">
                      <label className="cursor-pointer block relative z-10 w-full h-full">
                        <input type="file" accept=".pdf" onChange={handleRequirementsUpload} className="hidden" disabled={isExtractingParams} />
                        <div className="flex flex-col items-center justify-center gap-3">
                          {isExtractingParams ? <Loader2 className="w-8 h-8 animate-spin text-purple-400" /> : <Upload className="w-8 h-8 text-muted-foreground group-hover:text-purple-400 transition-colors" />}
                          <div>
                            <p className="text-sm font-semibold text-foreground">{isExtractingParams ? 'Extracting protocol...' : 'Upload PDF Protocol Document'}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                              Using {useAiExtraction ? "AI Synthesis" : "Fast Regex Mode"}
                            </p>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </FileDropZone>
              </div>

              {/* References Import */}
              <div className="space-y-3">
                <Label className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span>Import References</span>
                  <span className="text-blue-400 font-bold">{papers.length} LOCATED</span>
                </Label>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 bg-secondary rounded-2xl border border-border relative overflow-hidden">
                    <FileDropZone 
                      onFilesDrop={handleFileUpload} 
                      accept=".csv,.xlsx,.xls" 
                      disabled={isParsing}
                      className="h-full w-full rounded-2xl"
                    >
                      <label className="cursor-pointer flex flex-col items-center justify-center h-full text-center group p-4">
                        <input type="file" multiple accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleFileUpload} className="hidden" disabled={isParsing} />
                        <Upload className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors mb-2" />
                        <span className="text-xs font-medium text-muted-foreground">CSV / Excel Upload</span>
                      </label>
                    </FileDropZone>
                  </div>

                  <div className="flex-1 flex flex-col gap-2 relative">
                    <Textarea
                      id="apaText"
                      value={apaText}
                      onChange={(e) => setApaText(e.target.value)}
                      placeholder="Paste APA refs..."
                      className="flex-1 bg-secondary border border-border transition-smooth focus-visible:ring-1 focus-visible:ring-blue-500 resize-none text-[10px] text-muted-foreground font-mono p-3 rounded-xl"
                    />
                    <Button onClick={handlePasteRefs} disabled={apaText.trim().length === 0} className="absolute bottom-2 right-2 h-6 px-3 text-[9px] bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-foreground transition-colors">
                      Import
                    </Button>
                  </div>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {uploadedFiles.map((file) => (
                      <div key={file} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border text-[10px] font-mono text-muted-foreground">
                        <FileText className="w-3 h-3 text-blue-400" />
                        <span className="truncate max-w-[150px]">{file}</span>
                        <button onClick={() => removeFile(file)} className="hover:text-red-400 ml-1">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right Column: Research Parameters ── */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <FileSearch className="w-5 h-5 text-purple-500" />
              <h2 className="text-sm font-bold tracking-widest text-foreground uppercase">Research Parameters</h2>
            </div>

            <div className="grid gap-5">

              {/* 1. Research Topic */}
              <Card className="bg-amber-500/5 dark:bg-[#0d1117] backdrop-blur-xl border border-amber-500/15 shadow-xl p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-amber-500/4 to-transparent pointer-events-none" />
                <div className="relative z-10 space-y-3">
                  <Label htmlFor="topic" className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">1. Research Topic Core</Label>
                  <Textarea
                    id="topic"
                    value={topic}
                    onChange={(e) => setResearchConfig({ topic: e.target.value })}
                    placeholder="Describe the specific goal of the review in detail..."
                    className="min-h-[96px] bg-amber-500/10 dark:bg-[#1a1508]/80 border border-amber-500/20 shadow-inner transition-smooth focus-visible:ring-1 focus-visible:ring-amber-500 resize-none text-sm text-foreground p-4 rounded-xl"
                  />
                </div>
              </Card>

              {/* 2. Inclusion Requirements */}
              <Card className="bg-green-500/5 dark:bg-[#091409] backdrop-blur-xl border border-green-500/15 shadow-xl p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-green-500/4 to-transparent pointer-events-none" />
                <div className="relative z-10 space-y-3">
                  <Label htmlFor="inclusionCriteria" className="text-[10px] uppercase tracking-widest text-green-400 font-bold">2. Inclusion Requirements</Label>
                  <Textarea
                    id="inclusionCriteria"
                    value={inclusionCriteria}
                    onChange={(e) => setResearchConfig({ inclusionCriteria: e.target.value })}
                    placeholder="List specific requirements studies must meet to be included..."
                    className="min-h-[96px] bg-green-500/10 dark:bg-[#0b1d0b]/80 border border-green-500/20 shadow-inner transition-smooth focus-visible:ring-1 focus-visible:ring-green-500 resize-none text-sm text-foreground p-4 rounded-xl"
                  />
                </div>
              </Card>

              {/* 3. Exclusion Rules */}
              <Card className="bg-red-500/5 dark:bg-[#190909] backdrop-blur-xl border border-red-500/15 shadow-xl p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-red-500/4 to-transparent pointer-events-none" />
                <div className="relative z-10 space-y-3">
                  <Label htmlFor="exclusionCriteria" className="text-[10px] uppercase tracking-widest text-red-400 font-bold">3. Exclusion Rules</Label>
                  <Textarea
                    id="exclusionCriteria"
                    value={exclusionCriteria}
                    onChange={(e) => setResearchConfig({ exclusionCriteria: e.target.value })}
                    placeholder="List clear rules for why a study should be immediately excluded..."
                    className="min-h-[96px] bg-red-500/10 dark:bg-[#1e0c0c]/80 border border-red-500/20 shadow-inner transition-smooth focus-visible:ring-1 focus-visible:ring-red-500 resize-none text-sm text-foreground p-4 rounded-xl"
                  />
                </div>
              </Card>

              {/* 4 & 5. Optional fields */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-teal-500/5 dark:bg-[#091417] backdrop-blur-xl border border-teal-500/15 shadow-xl p-5 rounded-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-teal-500/4 to-transparent pointer-events-none" />
                  <div className="relative z-10 space-y-3">
                    <Label htmlFor="extractionFields" className="text-[10px] uppercase tracking-widest text-teal-400 font-bold">
                      4. Extraction Fields
                    </Label>
                    <Textarea
                      id="extractionFields"
                      value={extractionFields}
                      onChange={(e) => setResearchConfig({ extractionFields: e.target.value })}
                      placeholder="Methodology, Sample Size..."
                      className="h-[80px] bg-teal-500/10 dark:bg-[#071214]/80 border border-teal-500/20 shadow-inner transition-smooth focus-visible:ring-1 focus-visible:ring-teal-500 resize-none text-xs text-foreground p-3 rounded-xl"
                    />
                  </div>
                </Card>

                <Card className="bg-sky-500/5 dark:bg-[#0d1114] backdrop-blur-xl border border-sky-500/15 shadow-xl p-5 rounded-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-sky-500/4 to-transparent pointer-events-none" />
                  <div className="relative z-10 space-y-3">
                    <Label htmlFor="extraContext" className="text-[10px] uppercase tracking-widest text-sky-400 font-bold">
                      5. Extra Context
                      <span className="ml-2 text-muted-foreground font-normal normal-case tracking-normal text-[9px]">(Optional)</span>
                    </Label>
                    <Textarea
                      id="extraContext"
                      value={extraContext}
                      onChange={(e) => setResearchConfig({ extraContext: e.target.value })}
                      placeholder="Any specific instructions..."
                      className="h-[80px] bg-sky-500/10 dark:bg-[#080d10]/80 border border-sky-500/20 shadow-inner transition-smooth focus-visible:ring-1 focus-visible:ring-sky-500 resize-none text-xs text-foreground p-3 rounded-xl"
                    />
                  </div>
                </Card>
              </div>

            </div>
          </div>

        </form>
      </div>

      {/* Global Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border p-4 md:pl-72 z-40">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            {isFormValid ? (
              <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-green-400 font-bold bg-green-400/10 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Ready for Screening
              </span>
            ) : (
              <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-yellow-400 font-bold bg-yellow-400/10 px-3 py-1.5 rounded-full">
                Missing Configuration
              </span>
            )}
          </div>

          <Button
            onClick={startReview}
            disabled={!isFormValid}
            className="h-12 px-8 gap-3 bg-foreground text-background hover:bg-white/90 font-bold uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all hover:scale-105 active:scale-95 rounded-full disabled:opacity-50 disabled:shadow-none"
          >
            Save & Proceed
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </LayoutWrapper>
  );
}

