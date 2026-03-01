'use client';

import { useState, useEffect } from 'react';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, ChevronRight, FileText, Settings, Loader2, Info, CheckCircle2 } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { useRouter } from 'next/navigation';
import { useReviewStore } from '@/store/useReviewStore';
import { parseExcelFile, parseTextReferences, extractTextFromPDF } from '@/lib/fileParser';
import { extractResearchParameters } from '@/lib/llmClient';
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
    topic, inclusionCriteria, exclusionCriteria, extractionFields, extraContext, papers,
    setApiKey, setProviderAndModel, setRunName, setResearchConfig, loadPapers, fetchAvailableModels
  } = useReviewStore();

  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isExtractingParams, setIsExtractingParams] = useState(false);
  const [apaText, setApaText] = useState('');

  // Debounce API key typing to trigger auto-fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      if (apiKey && apiKey.length > 5) {
        fetchAvailableModels(apiKey);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [apiKey, fetchAvailableModels]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
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

  const handleRequirementsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    if (!apiKey) {
      toast.error('API Key Missing', { description: 'Please provide an API key first to use the extraction feature.' });
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

      toast.info('Analyzing Requirements Document...');
      const config = { provider, model, apiKey };
      const extractedParams = await extractResearchParameters(text, config);

      setResearchConfig(extractedParams);
      toast.success('Research Parameters Extracted Successfully!');
    } catch (err: any) {
      console.error('Extraction Error:', err);
      toast.error('Extraction Failed', { description: err.message || 'An unknown error occurred.' });
    } finally {
      setIsExtractingParams(false);
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

  const isFormValid = topic && apiKey && papers.length > 0 && model;

  return (
    <LayoutWrapper
      headerTitle="New Review Setup"
      headerDescription="Configure system parameters for Systematic Literature Review"
    >
      <div className="p-6 md:p-8 pb-32 md:pb-32 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 bg-[#000000] text-white selection:bg-white/20">

        <form className="grid grid-cols-1 lg:grid-cols-2 gap-8" onSubmit={(e) => e.preventDefault()}>

          {/* Left Column: API & Topic */}
          <div className="space-y-8">
            {/* API Configuration */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-5 h-5 text-blue-500" />
                <h2 className="text-sm font-bold tracking-widest text-white uppercase">API Configuration</h2>
              </div>

              <div className="grid gap-6">
                <div className="space-y-3">
                  <Label htmlFor="apiKey" className="text-[10px] uppercase tracking-widest text-white/50">Provider API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="bg-white/[0.03] border-none text-white font-mono text-sm h-12 px-4 shadow-inner focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase tracking-widest text-white/50">Detected Provider</Label>
                    <div className="h-12 px-4 bg-white/[0.02] rounded-xl flex items-center border border-white/5">
                      <span className="text-sm font-mono text-white/70">
                        {PROVIDER_NAMES[provider] || (isFetchingModels ? 'Detecting...' : provider ? provider : 'Waiting...')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="model" className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/50">
                      Model Selection {isFetchingModels && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                    </Label>
                    <Select value={model} onValueChange={(val) => setProviderAndModel(provider, val)} disabled={availableModels.length === 0 || isFetchingModels}>
                      <SelectTrigger className="w-full bg-white/[0.03] border-none text-white font-mono text-xs h-12 px-4 rounded-xl focus:ring-1 focus:ring-blue-500">
                        <SelectValue placeholder={isFetchingModels ? "Fetching models..." : "Select model"} />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111] border-white/10 text-white">
                        {availableModels.map((v) => (
                          <SelectItem key={v} value={v} className="font-mono text-xs focus:bg-white/10 focus:text-white cursor-pointer">{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="runName" className="text-[10px] uppercase tracking-widest text-white/50">Run Identifier (Name)</Label>
                  <Input
                    id="runName"
                    value={runName}
                    onChange={(e) => setRunName(e.target.value)}
                    placeholder="e.g. Initial Search 2026"
                    className="bg-white/[0.03] border-none text-white font-mono text-sm h-12 px-4 shadow-inner focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Uploads moved to Left Column */}
          <div className="space-y-6 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-indigo-500" />
              <h2 className="text-sm font-bold tracking-widest text-white uppercase">Data Sources</h2>
            </div>

            {/* PDF Requirements Extractor */}
            <div className="space-y-3">
              <Label className="text-[10px] uppercase tracking-widest text-white/50">Auto-Fill from Protocol</Label>
              <div className="relative group rounded-2xl p-[2px] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative h-full bg-[#0a0a0a] rounded-[14px] border border-dashed border-white/10 group-hover:border-white/20 transition-colors p-6 text-center">
                  <label className="cursor-pointer block relative z-10 w-full h-full">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleRequirementsUpload}
                      className="hidden"
                      disabled={isExtractingParams}
                    />
                    <div className="flex flex-col items-center justify-center gap-3">
                      {isExtractingParams ? <Loader2 className="w-8 h-8 animate-spin text-purple-400" /> : <Upload className="w-8 h-8 text-white/40 group-hover:text-purple-400 transition-colors" />}
                      <div>
                        <p className="text-sm font-semibold text-white/90">{isExtractingParams ? 'Extracting protocol...' : 'Upload PDF Protocol Document'}</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Extracts Topic & Criteria via AI</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Data Import */}
            <div className="space-y-3">
              <Label className="flex items-center justify-between text-[10px] uppercase tracking-widest text-white/50">
                <span>Import References</span>
                <span className="text-blue-400 font-bold">{papers.length} LOCATED</span>
              </Label>
              <div className="flex gap-4">
                <div className="flex-1 bg-white/[0.02] rounded-2xl border border-white/5 p-4 relative overflow-hidden">
                  <label className="cursor-pointer flex flex-col items-center justify-center h-full text-center group">
                    <input
                      type="file"
                      multiple
                      accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isParsing}
                    />
                    <Upload className="w-6 h-6 text-white/30 group-hover:text-white transition-colors mb-2" />
                    <span className="text-xs font-medium text-white/70">CSV / Excel...</span>
                  </label>
                </div>

                <div className="flex-1 flex flex-col gap-2 relative">
                  <Textarea
                    id="apaText"
                    value={apaText}
                    onChange={(e) => setApaText(e.target.value)}
                    placeholder="Paste APA refs..."
                    className="flex-1 bg-white/[0.02] border border-white/5 transition-smooth focus-visible:ring-1 focus-visible:ring-blue-500 resize-none text-[10px] text-white/70 font-mono p-3 rounded-xl"
                  />
                  <Button
                    onClick={handlePasteRefs}
                    disabled={apaText.trim().length === 0}
                    className="absolute bottom-2 right-2 h-6 px-3 text-[9px] bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-colors gap-1"
                  >
                    Import
                  </Button>
                </div>
              </div>

              {/* Uploaded Files Tag */}
              {uploadedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {uploadedFiles.map((file) => (
                    <div key={file} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-white/70">
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

      {/* Right Column: Research Parameters */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <FileSearch className="w-5 h-5 text-purple-500" />
          <h2 className="text-sm font-bold tracking-widest text-white uppercase">Research Parameters</h2>
        </div>

        <div className="grid gap-6">

          {/* 1. Topic Area Card */}
          <Card className="bg-[#0a0a0a]/80 backdrop-blur-xl border-none shadow-2xl p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-50" />
            <div className="relative z-10 space-y-4">
              <Label htmlFor="topic" className="text-[10px] uppercase tracking-widest text-blue-400 font-bold">1. Research Topic Core</Label>
              <Textarea
                id="topic"
                value={topic}
                onChange={(e) => setResearchConfig({ topic: e.target.value })}
                placeholder="Describe the specific goal of the review in detail..."
                className="min-h-[100px] bg-white/[0.03] border border-white/5 shadow-inner transition-smooth focus-visible:ring-1 focus-visible:ring-blue-500 resize-none text-sm text-white/90 p-4 rounded-xl"
              />
            </div>
          </Card>

          {/* 2. Inclusion Criteria Card */}
          <Card className="bg-[#0a0a0a]/80 backdrop-blur-xl border-none shadow-2xl p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-50" />
            <div className="relative z-10 space-y-4">
              <Label htmlFor="inclusionCriteria" className="text-[10px] uppercase tracking-widest text-green-400 font-bold">2. Inclusion Requirements</Label>
              <Textarea
                id="inclusionCriteria"
                value={inclusionCriteria}
                onChange={(e) => setResearchConfig({ inclusionCriteria: e.target.value })}
                placeholder="List specific requirements studies must meet to be included..."
                className="min-h-[100px] bg-white/[0.03] border border-white/5 shadow-inner transition-smooth focus-visible:ring-1 focus-visible:ring-green-500 resize-none text-sm text-white/90 p-4 rounded-xl"
              />
            </div>
          </Card>

          {/* 3. Exclusion Criteria Card */}
          <Card className="bg-[#0a0a0a]/80 backdrop-blur-xl border-none shadow-2xl p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-50" />
            <div className="relative z-10 space-y-4">
              <Label htmlFor="exclusionCriteria" className="text-[10px] uppercase tracking-widest text-red-400 font-bold">3. Exclusion Rules</Label>
              <Textarea
                id="exclusionCriteria"
                value={exclusionCriteria}
                onChange={(e) => setResearchConfig({ exclusionCriteria: e.target.value })}
                placeholder="List clear rules for why a study should be immediately excluded..."
                className="min-h-[100px] bg-white/[0.03] border border-white/5 shadow-inner transition-smooth focus-visible:ring-1 focus-visible:ring-red-500 resize-none text-sm text-white/90 p-4 rounded-xl"
              />
            </div>
          </Card>

          {/* 4 & 5. Extra fields */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-[#0a0a0a]/80 backdrop-blur-xl border-none shadow-2xl p-5 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-50" />
              <div className="relative z-10 space-y-4">
                <Label htmlFor="extractionFields" className="text-[10px] uppercase tracking-widest text-purple-400 font-bold">4. Extraction Fields <span className="text-white/30 font-normal ml-1">(Optional)</span></Label>
                <Textarea
                  id="extractionFields"
                  value={extractionFields}
                  onChange={(e) => setResearchConfig({ extractionFields: e.target.value })}
                  placeholder="Methodology, Sample Size..."
                  className="h-[80px] bg-white/[0.03] border border-white/5 shadow-inner transition-smooth focus-visible:ring-1 focus-visible:ring-purple-500 resize-none text-xs text-white/90 p-3 rounded-xl"
                />
              </div>
            </Card>

            <Card className="bg-[#0a0a0a]/80 backdrop-blur-xl border-none shadow-2xl p-5 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-50" />
              <div className="relative z-10 space-y-4">
                <Label htmlFor="extraContext" className="text-[10px] uppercase tracking-widest text-purple-400 font-bold">5. Extra Context <span className="text-white/30 font-normal ml-1">(Optional)</span></Label>
                <Textarea
                  id="extraContext"
                  value={extraContext}
                  onChange={(e) => setResearchConfig({ extraContext: e.target.value })}
                  placeholder="Any specific instructions..."
                  className="h-[80px] bg-white/[0.03] border border-white/5 shadow-inner transition-smooth focus-visible:ring-1 focus-visible:ring-purple-500 resize-none text-xs text-white/90 p-3 rounded-xl"
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </form>

          </div >

    {/* Global Action Footer */ }
    < div className = "fixed bottom-0 left-0 right-0 bg-[#000000]/80 backdrop-blur-xl border-t border-white/10 p-4 md:pl-72 z-40 transform translate-y-0" >
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
          className="h-12 px-8 gap-3 bg-white text-black hover:bg-white/90 font-bold uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all hover:scale-105 active:scale-95 rounded-full disabled:opacity-50 disabled:shadow-none"
        >
          Save & Proceed
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
        </div >


      </div >
    </LayoutWrapper >
  );
}
