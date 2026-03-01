'use client';

import { useState, useEffect } from 'react';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, ChevronRight, FileText, Settings, Loader2, Info } from 'lucide-react';
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
      headerTitle="Project Setup"
      headerDescription={
        <span className="flex items-center gap-2">
          Configure API keys, models, and research criteria
          <HoverCard>
            <HoverCardTrigger className="cursor-help">
              <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
            </HoverCardTrigger>
            <HoverCardContent className="w-[300px] text-xs shadow-xl border-border z-[100] font-normal" align="start">
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground border-b border-border pb-1">Guidelines</h4>
                <p className="text-muted-foreground leading-relaxed">
                  The Setup phase allows you to globally configure the AI model, set strict inclusion/exclusion criteria for papers, and provide the references (via CSV, Excel, or APA format). These settings dictate how the AI will evaluate studies during the screening runs.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </span>
      }
    >
      <div className="p-6 space-y-8 animate-in fade-in duration-500">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">

            {/* API Configuration */}
            <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm space-y-4">
              <div>
                <h3 className="font-medium text-lg text-foreground flex items-center gap-2 mb-4">
                  <Settings className="w-5 h-5 text-primary" /> API Configuration
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="apiKey" className="text-xs-caps">API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Paste OpenAI (sk-), Anthropic (sk-ant-), or Google (AIza) key..."
                      className="bg-background/50 border-border/50 transition-smooth focus:border-primary font-mono text-sm"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1 tracking-wide">
                      The key is stored only in your browser&apos;s memory for the current session and is cleared when you close or refresh the page.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="provider" className="text-xs-caps">Provider</Label>
                    <Input
                      id="provider"
                      value={PROVIDER_NAMES[provider] || (isFetchingModels ? 'Detecting...' : provider ? provider : 'Waiting for API Key...')}
                      disabled
                      className="bg-secondary/50 text-muted-foreground font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model" className="flex items-center gap-2 text-xs-caps">
                      Model {isFetchingModels && <Loader2 className="w-3 h-3 animate-spin" />}
                    </Label>
                    <Select value={model} onValueChange={(val) => setProviderAndModel(provider, val)} disabled={availableModels.length === 0 || isFetchingModels}>
                      <SelectTrigger className="w-full bg-background/50 border-border/50 transition-smooth focus:ring-primary font-mono text-xs">
                        <SelectValue placeholder={isFetchingModels ? "Fetching models..." : "Select model"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.map((v) => (
                          <SelectItem key={v} value={v} className="font-mono text-xs">{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground mt-1 text-balance tracking-wide">
                      Use a more capable model (e.g. claude-3-opus) for smaller reference lists where cost is less of a concern, or a faster model (claude-3-5-haiku) for large batches.
                    </p>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="runName" className="text-xs-caps">Run Name</Label>
                    <Input
                      id="runName"
                      value={runName}
                      onChange={(e) => setRunName(e.target.value)}
                      placeholder="e.g. Claude Sonnet Base Run"
                      className="bg-background/50 border-border/50 transition-smooth focus:border-primary font-medium"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1 text-balance tracking-wide">
                      Give this run a descriptive label. This name appears in the Comparison view, saved run lists, and exported Excel files. Choose a name that clearly identifies what changed between runs.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Criteria & Research Params */}
            <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm space-y-4">
              <div>
                <h3 className="font-medium text-lg text-foreground mb-4">
                  Research Parameters
                </h3>

                {/* Requirements Document Upload */}
                <div className="mb-6 border border-dashed border-border/50 bg-secondary/20 rounded-lg p-5">
                  <h4 className="text-sm font-medium mb-2">Auto-fill from Requirements Document (Optional)</h4>
                  <p className="text-xs text-muted-foreground mb-4">Upload a PDF containing your research proposal or guidelines to automatically extract the topic and criteria.</p>
                  <label className="cursor-pointer inline-flex">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleRequirementsUpload}
                      className="hidden"
                      disabled={isExtractingParams}
                    />
                    <Button disabled={isExtractingParams} variant="secondary" size="sm" className="pointer-events-none gap-2 button-hover-lift">
                      {isExtractingParams ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {isExtractingParams ? 'Extracting...' : 'Upload Requirements Document'}
                    </Button>
                  </label>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic" className="text-xs-caps">Research Topic</Label>
                    <Textarea
                      id="topic"
                      value={topic}
                      onChange={(e) => setResearchConfig({ topic: e.target.value })}
                      placeholder="Specific description of the review topic..."
                      rows={2}
                      className="bg-background/50 border-border/50 transition-smooth focus:border-primary resize-none text-sm"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1 text-balance tracking-wide">
                      Write a clear, focused description of your review topic. This is the primary context the AI uses to make inclusion decisions. Be specific enough that the AI can distinguish relevant from irrelevant papers.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inclusionCriteria" className="text-xs-caps">Inclusion Criteria</Label>
                    <Textarea
                      id="inclusionCriteria"
                      value={inclusionCriteria}
                      onChange={(e) => setResearchConfig({ inclusionCriteria: e.target.value })}
                      placeholder="Studies must have n > 50, peer-reviewed, etc..."
                      rows={3}
                      className="bg-background/50 border-border/50 transition-smooth focus:border-primary resize-none text-sm"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1 text-balance tracking-wide">
                      List the criteria a paper must meet to be included. Examples: study design (RCT, cohort), population (human adults), language (English), date range (2015–2025), outcome type (quantitative).
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exclusionCriteria" className="text-xs-caps">Exclusion Criteria</Label>
                    <Textarea
                      id="exclusionCriteria"
                      value={exclusionCriteria}
                      onChange={(e) => setResearchConfig({ exclusionCriteria: e.target.value })}
                      placeholder="Exclude systematic reviews, n < 50, etc..."
                      rows={3}
                      className="bg-background/50 border-border/50 transition-smooth focus:border-primary resize-none text-sm"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1 text-balance tracking-wide">
                      List reasons to exclude a paper. Examples: conference abstracts only, n &lt; 50 participants, pediatric or veterinary studies, non-English, grey literature.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="extractionFields" className="text-xs-caps">Extraction Fields (Step 2)</Label>
                    <Textarea
                      id="extractionFields"
                      value={extractionFields}
                      onChange={(e) => setResearchConfig({ extractionFields: e.target.value })}
                      placeholder="e.g., Study Design, Sample Size, AI System Used, AUC"
                      rows={2}
                      className="bg-background/50 border-border/50 transition-smooth focus:border-primary resize-none text-sm"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1 text-balance tracking-wide">
                      Enter a comma-separated list of data fields you want the AI to extract during full-text review. These become columns in the Step 2 results table.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="extraContext" className="text-xs-caps">Extra Context (Optional)</Label>
                    <Textarea
                      id="extraContext"
                      value={extraContext}
                      onChange={(e) => setResearchConfig({ extraContext: e.target.value })}
                      placeholder="Provide any additional instructions that should guide AI decisions..."
                      rows={2}
                      className="bg-background/50 border-border/50 transition-smooth focus:border-primary resize-none text-sm"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1 text-balance tracking-wide">
                      Provide any additional instructions that should guide AI decisions but do not fit neatly into inclusion/exclusion criteria. Examples: &quot;Treat systematic reviews without meta-analysis as excluded,&quot; or &quot;Focus on prospective designs.&quot;
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* File Upload */}
            <Card className="p-6 border-border/50 border-dashed bg-card/50 backdrop-blur-sm">
              <div className="space-y-4">
                <h3 className="font-medium text-lg text-foreground">Upload References</h3>
                <div className="border border-dashed border-border/50 bg-background/50 rounded-lg p-8 text-center hover:border-primary/50 transition-smooth group relative overflow-hidden">
                  <label className="cursor-pointer block relative z-10">
                    <input
                      type="file"
                      multiple
                      accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isParsing}
                    />
                    <Upload className="w-8 h-8 text-muted-foreground opacity-50 group-hover:text-primary mx-auto mb-2 transition-smooth group-hover:opacity-100" />
                    <p className="text-sm font-medium text-foreground">
                      {isParsing ? "Parsing file..." : "Click to upload Excel/CSV"}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1 tracking-wide">
                      Must contain Title, Author, Year, Abstract columns.
                    </p>
                  </label>
                  {isParsing && <div className="absolute inset-0 bg-secondary/50 flex z-0 items-center justify-center animate-pulse" />}
                </div>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-border/50"></div>
                  <span className="flex-shrink-0 mx-4 text-muted-foreground text-[10px] uppercase tracking-widest font-semibold">or paste</span>
                  <div className="flex-grow border-t border-border/50"></div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apaText" className="text-xs-caps">Paste APA references</Label>
                  <Textarea
                    id="apaText"
                    value={apaText}
                    onChange={(e) => setApaText(e.target.value)}
                    placeholder="Author, A. A., & Author, B. B. (Year). Title... doi:10.xxxx/..."
                    rows={4}
                    className="bg-background/50 border-border/50 transition-smooth focus:border-primary resize-none text-sm font-mono"
                  />
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-[11px] text-muted-foreground text-balance mt-1 tracking-wide">
                      Paste plain-text APA-formatted references into the text area. The tool extracts DOIs and years automatically. Both methods can be combined.
                    </p>
                    <Button
                      onClick={handlePasteRefs}
                      disabled={apaText.trim().length === 0}
                      variant="secondary"
                      size="sm"
                      className="shrink-0 button-hover-lift"
                    >
                      Import Text
                    </Button>
                  </div>
                </div>

                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-xs-caps">
                      {uploadedFiles.length} files uploaded
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {uploadedFiles.map((file) => (
                        <div
                          key={file}
                          className="flex items-center justify-between p-3 rounded-md bg-secondary/50 hover:bg-secondary border border-border/30 transition-smooth group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-xs text-foreground truncate font-mono">
                              {file}
                            </span>
                          </div>
                          <button
                            onClick={() => removeFile(file)}
                            className="text-xs text-muted-foreground hover:text-destructive transition-smooth opacity-0 group-hover:opacity-100"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Summary Card */}
            <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
              <h3 className="font-medium text-lg text-foreground mb-4">Ready Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs-caps">Papers Loaded</span>
                  <span className="text-sm font-mono text-foreground tracking-tight">
                    {papers.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs-caps">Provider</span>
                  <span className="text-xs font-mono font-medium text-primary">
                    {PROVIDER_NAMES[provider] || '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs-caps">API Key provided</span>
                  <span className="text-xs font-mono font-medium text-primary">
                    {apiKey ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              {papers.length > 0 && (
                <div className="mt-6 p-3 bg-green-500/10 border border-green-500/20 rounded-md text-green-500 text-xs uppercase tracking-widest font-semibold text-center">
                  {papers.length} papers loaded
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-border">
          <Button variant="outline" className="border-border hover:bg-secondary" onClick={() => router.push('/')}>
            Back to Dashboard
          </Button>
          <Button
            onClick={startReview}
            disabled={!isFormValid}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
          >
            Begin Abstract Screening
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </LayoutWrapper>
  );
}
