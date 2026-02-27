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
import { parseExcelFile, parseTextReferences } from '@/lib/fileParser';

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
            <Card className="p-6 border-border space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Settings className="w-5 h-5 text-primary" /> API Configuration
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="apiKey" className="text-foreground">API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Paste OpenAI (sk-), Anthropic (sk-ant-), or Google (AIza) key..."
                      className="bg-input border-border transition-smooth focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      The key is stored only in your browser&apos;s memory for the current session and is cleared when you close or refresh the page.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="provider" className="text-foreground">Provider</Label>
                    <Input
                      id="provider"
                      value={PROVIDER_NAMES[provider] || (isFetchingModels ? 'Detecting...' : provider ? provider : 'Waiting for API Key...')}
                      disabled
                      className="bg-muted text-muted-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model" className="flex items-center gap-2 text-foreground">
                      Model {isFetchingModels && <Loader2 className="w-3 h-3 animate-spin" />}
                    </Label>
                    <Select value={model} onValueChange={(val) => setProviderAndModel(provider, val)} disabled={availableModels.length === 0 || isFetchingModels}>
                      <SelectTrigger className="w-full bg-input border-border transition-smooth focus:ring-primary">
                        <SelectValue placeholder={isFetchingModels ? "Fetching models..." : "Select model"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.map((v) => (
                          <SelectItem key={v} value={v}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1 text-balance">
                      Use a more capable model (e.g. claude-3-opus) for smaller reference lists where cost is less of a concern, or a faster model (claude-3-5-haiku) for large batches.
                    </p>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="runName" className="text-foreground">Run Name</Label>
                    <Input
                      id="runName"
                      value={runName}
                      onChange={(e) => setRunName(e.target.value)}
                      placeholder="e.g. Claude Sonnet Base Run"
                      className="bg-input border-border transition-smooth focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-balance">
                      Give this run a descriptive label. This name appears in the Comparison view, saved run lists, and exported Excel files. Choose a name that clearly identifies what changed between runs.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Criteria & Research Params */}
            <Card className="p-6 border-border space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Research Parameters
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic" className="text-foreground">Research Topic</Label>
                    <Textarea
                      id="topic"
                      value={topic}
                      onChange={(e) => setResearchConfig({ topic: e.target.value })}
                      placeholder="Specific description of the review topic..."
                      rows={2}
                      className="bg-input border-border transition-smooth focus:border-primary resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-balance">
                      Write a clear, focused description of your review topic. This is the primary context the AI uses to make inclusion decisions. Be specific enough that the AI can distinguish relevant from irrelevant papers.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inclusionCriteria" className="text-foreground">Inclusion Criteria</Label>
                    <Textarea
                      id="inclusionCriteria"
                      value={inclusionCriteria}
                      onChange={(e) => setResearchConfig({ inclusionCriteria: e.target.value })}
                      placeholder="Studies must have n > 50, peer-reviewed, etc..."
                      rows={3}
                      className="bg-input border-border transition-smooth focus:border-primary resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-balance">
                      List the criteria a paper must meet to be included. Examples: study design (RCT, cohort), population (human adults), language (English), date range (2015–2025), outcome type (quantitative).
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exclusionCriteria" className="text-foreground">Exclusion Criteria</Label>
                    <Textarea
                      id="exclusionCriteria"
                      value={exclusionCriteria}
                      onChange={(e) => setResearchConfig({ exclusionCriteria: e.target.value })}
                      placeholder="Exclude systematic reviews, n < 50, etc..."
                      rows={3}
                      className="bg-input border-border transition-smooth focus:border-primary resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-balance">
                      List reasons to exclude a paper. Examples: conference abstracts only, n &lt; 50 participants, pediatric or veterinary studies, non-English, grey literature.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="extractionFields" className="text-foreground">Extraction Fields (Step 2)</Label>
                    <Textarea
                      id="extractionFields"
                      value={extractionFields}
                      onChange={(e) => setResearchConfig({ extractionFields: e.target.value })}
                      placeholder="e.g., Study Design, Sample Size, AI System Used, AUC"
                      rows={2}
                      className="bg-input border-border transition-smooth focus:border-primary resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-balance">
                      Enter a comma-separated list of data fields you want the AI to extract during full-text review. These become columns in the Step 2 results table.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="extraContext" className="text-foreground">Extra Context (Optional)</Label>
                    <Textarea
                      id="extraContext"
                      value={extraContext}
                      onChange={(e) => setResearchConfig({ extraContext: e.target.value })}
                      placeholder="Provide any additional instructions that should guide AI decisions..."
                      rows={2}
                      className="bg-input border-border transition-smooth focus:border-primary resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-balance">
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
            <Card className="p-6 border-border border-dashed">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Upload References</h3>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-smooth group relative overflow-hidden">
                  <label className="cursor-pointer block relative z-10">
                    <input
                      type="file"
                      multiple
                      accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isParsing}
                    />
                    <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary mx-auto mb-2 transition-smooth" />
                    <p className="text-sm font-medium text-foreground">
                      {isParsing ? "Parsing file..." : "Click to upload Excel/CSV"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Must contain Title, Author, Year, Abstract columns.
                    </p>
                  </label>
                  {isParsing && <div className="absolute inset-0 bg-secondary/50 flex z-0 items-center justify-center animate-pulse" />}
                </div>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-border"></div>
                  <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs uppercase tracking-wider">or paste</span>
                  <div className="flex-grow border-t border-border"></div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apaText" className="text-foreground">Paste APA references</Label>
                  <Textarea
                    id="apaText"
                    value={apaText}
                    onChange={(e) => setApaText(e.target.value)}
                    placeholder="Author, A. A., & Author, B. B. (Year). Title... doi:10.xxxx/..."
                    rows={4}
                    className="bg-input border-border transition-smooth focus:border-primary resize-none"
                  />
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-xs text-muted-foreground text-balance mt-1">
                      Paste plain-text APA-formatted references into the text area. The tool extracts DOIs and years automatically. Both methods can be combined.
                    </p>
                    <Button
                      onClick={handlePasteRefs}
                      disabled={apaText.trim().length === 0}
                      variant="secondary"
                      size="sm"
                      className="shrink-0"
                    >
                      Import Text
                    </Button>
                  </div>
                </div>

                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-sm font-medium text-foreground">
                      {uploadedFiles.length} files uploaded
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {uploadedFiles.map((file) => (
                        <div
                          key={file}
                          className="flex items-center justify-between p-3 rounded-md bg-secondary hover:bg-secondary/80 transition-smooth group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-xs text-foreground truncate">
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
            <Card className="p-6 border-border bg-secondary/20">
              <h3 className="text-lg font-semibold text-foreground mb-4">Ready Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Papers Loaded</span>
                  <span className="text-sm font-medium text-foreground">
                    {papers.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Provider</span>
                  <span className="text-sm font-medium text-foreground">
                    {PROVIDER_NAMES[provider] || '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">API Key provided</span>
                  <span className="text-sm font-medium text-foreground">
                    {apiKey ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              {papers.length > 0 && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-md text-green-600 dark:text-green-400 text-sm font-medium text-center">
                  ✓ {papers.length} papers loaded
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
