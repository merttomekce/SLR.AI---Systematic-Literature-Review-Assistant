'use client';

import { useState, useEffect } from 'react';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, ChevronRight, FileText, Settings, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useReviewStore } from '@/store/useReviewStore';
import { parseExcelFile } from '@/lib/fileParser';

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

  const removeFile = (fileName: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f !== fileName));
  };

  const startReview = () => {
    router.push('/review/screening');
  };

  const isFormValid = topic && apiKey && papers.length > 0 && model;

  return (
    <LayoutWrapper
      headerTitle="Setup Review"
      headerDescription="Configure your systematic literature review parameters"
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
                    <p className="text-xs text-muted-foreground mt-1">Provider and available models will auto-detect from your key.</p>
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
                      Must contain Title, Author, Year, Abstract columns
                    </p>
                  </label>
                  {isParsing && <div className="absolute inset-0 bg-secondary/50 flex z-0 items-center justify-center animate-pulse" />}
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
