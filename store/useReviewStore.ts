import { create } from 'zustand';
import { processStep1 } from '@/lib/llmClient';
import { toast } from 'sonner';

export type Decision = 'INCLUDED' | 'EXCLUDED' | 'NOT ACCESSIBLE' | 'PENDING' | 'ANALYZING';

export interface Paper {
  id: string; // Unique ID (could be DOI or generated UUID)
  title: string;
  author?: string;
  year?: string;
  abstract?: string;
  doi?: string;
  journal?: string;
  url?: string;
  issn?: string;
  itemType?: string;

  // Step 1 screening result
  s1Decision?: Decision;
  s1Reason?: string;
  s1Relevancy?: number;

  // Step 2 screening result
  s2Decision?: Decision;
  s2Reason?: string;
  s2Status?: 'DONE' | 'PENDING' | 'REVIEWING' | 'SKIPPED' | 'ERROR';
  extractedData?: Record<string, string>;
}

export interface ReviewRun {
  id: string;
  name: string;
  model: string;
  timestamp: string;
  papers: Record<string, Paper>; // Map of paper ID to Paper state for this run
  stats: {
    total: number;
    included: number;
    excluded: number;
    notAccessible: number;
  }
}

interface ReviewState {
  // Global config
  apiKey: string;
  provider: string;
  model: string;
  runName: string;

  // Research config
  topic: string;
  inclusionCriteria: string;
  exclusionCriteria: string;
  extractionFields: string;
  extraContext: string;

  // Base papers (the uploaded references)
  papers: Paper[];

  // Runs
  currentS1Run: ReviewRun | null;
  savedS1Runs: ReviewRun[];

  // Extraction Runs
  currentS2Run: ReviewRun | null;
  savedS2Runs: ReviewRun[];

  // Global Runner States
  isS1Running: boolean;
  s1PauseTimeLeft: number;

  // Dynamic Models
  availableModels: string[];
  isFetchingModels: boolean;

  // Actions
  setApiKey: (key: string) => void;
  setProviderAndModel: (provider: string, model: string) => void;
  setRunName: (name: string) => void;
  setResearchConfig: (config: Partial<Pick<ReviewState, 'topic' | 'inclusionCriteria' | 'exclusionCriteria' | 'extractionFields' | 'extraContext'>>) => void;

  loadPapers: (papers: Paper[], replace?: boolean) => void;

  startS1Run: () => void;
  updatePaperInCurrentRun: (paperId: string, update: Partial<Paper>) => void;
  saveCurrentS1Run: () => void;
  deleteS1Run: (runId: string) => void;

  toggleS1ProcessingLoop: () => void;

  startS2Run: (fromS1RunId: string) => void;
  updatePaperInS2Run: (paperId: string, update: Partial<Paper>) => void;
  saveCurrentS2Run: () => void;

  fetchAvailableModels: (apiKey: string) => Promise<void>;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  apiKey: '',
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022',
  runName: '',

  topic: '',
  inclusionCriteria: '',
  exclusionCriteria: '',
  extractionFields: '',
  extraContext: '',

  papers: [],

  currentS1Run: null,
  savedS1Runs: [],

  currentS2Run: null,
  savedS2Runs: [],

  isS1Running: false,
  s1PauseTimeLeft: 0,

  availableModels: [],
  isFetchingModels: false,

  setApiKey: (key) => set({ apiKey: key }),
  setProviderAndModel: (provider, model) => set({ provider, model }),
  setRunName: (name) => set({ runName: name }),
  setResearchConfig: (config) => set((state) => ({ ...state, ...config })),

  loadPapers: (newPapers, replace = false) => set((state) => {
    if (replace) {
      return { papers: newPapers };
    }
    // Simple deduplication logic could go here based on title/DOI
    const existingIds = new Set(state.papers.map(p => p.id));
    const uniqueNew = newPapers.filter(p => !existingIds.has(p.id));
    return { papers: [...state.papers, ...uniqueNew] };
  }),

  startS1Run: () => set((state) => {
    const newRun: ReviewRun = {
      id: crypto.randomUUID(),
      name: state.runName || `Run ${state.savedS1Runs.length + 1}`,
      model: state.model,
      timestamp: new Date().toISOString(),
      papers: state.papers.reduce((acc, p) => {
        acc[p.id] = { ...p, s1Decision: 'PENDING' };
        return acc;
      }, {} as Record<string, Paper>),
      stats: { total: state.papers.length, included: 0, excluded: 0, notAccessible: 0 }
    };
    return { currentS1Run: newRun };
  }),

  updatePaperInCurrentRun: (paperId, update) => set((state) => {
    if (!state.currentS1Run) return state;

    const run = { ...state.currentS1Run };
    run.papers = { ...run.papers, [paperId]: { ...run.papers[paperId], ...update } };

    // Recalculate stats
    let inc = 0, exc = 0, na = 0;
    Object.values(run.papers).forEach(p => {
      if (p.s1Decision === 'INCLUDED') inc++;
      else if (p.s1Decision === 'EXCLUDED') exc++;
      else if (p.s1Decision === 'NOT ACCESSIBLE') na++;
    });
    run.stats = { total: Object.values(run.papers).length, included: inc, excluded: exc, notAccessible: na };

    return { currentS1Run: run };
  }),

  saveCurrentS1Run: () => set((state) => {
    if (!state.currentS1Run) return state;
    return {
      savedS1Runs: [...state.savedS1Runs, state.currentS1Run],
      /* We could clear it here, but keeping it in state allows continuing to view it until a new run starts */
    };
  }),

  deleteS1Run: (runId) => set((state) => ({
    savedS1Runs: state.savedS1Runs.filter(r => r.id !== runId)
  })),

  toggleS1ProcessingLoop: async () => {
    const state = get();
    if (state.isS1Running) {
      set({ isS1Running: false });
      return;
    }

    if (!state.currentS1Run || Object.keys(state.currentS1Run.papers).length === 0) {
      toast.warning("No Papers to Screen", { description: "Please upload an Excel file containing papers in the Setup page first." });
      return;
    }

    if (!state.apiKey || !state.provider || !state.model) {
      toast.error("API Key Missing", { id: "api-key-missing-toast", description: "Please return to the Setup page and configure your API Key and Model before starting the AI screening." });
      return;
    }

    set({ isS1Running: true });

    // Background loop detached from components
    while (get().isS1Running) {
      const currentState = get();
      const currentRun = currentState.currentS1Run;
      if (!currentRun) break;

      const allPapers = Object.values(currentRun.papers);
      let nextPaper = allPapers.find(p => p.s1Decision === 'PENDING');

      // If there are no pending papers, check if there are any that got stuck as 'ANALYZING'
      if (!nextPaper) {
        nextPaper = allPapers.find(p => p.s1Decision === 'ANALYZING');
      }

      if (!nextPaper) {
        set({ isS1Running: false });
        toast.success("Screening Complete!", { description: "All papers have been classified." });
        break;
      }

      currentState.updatePaperInCurrentRun(nextPaper.id, { s1Decision: 'ANALYZING' });

      try {
        const result = await processStep1(
          nextPaper,
          { apiKey: currentState.apiKey, provider: currentState.provider, model: currentState.model },
          {
            topic: currentState.topic,
            inclusionCriteria: currentState.inclusionCriteria,
            exclusionCriteria: currentState.exclusionCriteria,
            extraContext: currentState.extraContext
          }
        );
        get().updatePaperInCurrentRun(nextPaper.id, {
          s1Decision: result.decision,
          s1Reason: result.reason,
          s1Relevancy: result.relevancy
        });

      } catch (err: any) {
        console.error("Error processing paper:", nextPaper.id, err);

        if (err.name === 'QuotaError') {
          get().updatePaperInCurrentRun(nextPaper.id, { s1Decision: 'PENDING' });
          set({ isS1Running: false });
          toast.error("Daily Quota Reached", { id: "quota-error-toast", description: "The process has been paused because your API key lacks sufficient limits." });
          break;
        }

        if (err.name === 'RateLimitError') {
          const waitSeconds = err.retryAfterSeconds || 60;
          get().updatePaperInCurrentRun(nextPaper.id, { s1Decision: 'PENDING' });

          for (let i = waitSeconds; i > 0; i--) {
            if (!get().isS1Running) {
              set({ s1PauseTimeLeft: 0 });
              break;
            }
            set({ s1PauseTimeLeft: i });
            await new Promise(r => setTimeout(r, 1000));
          }
          set({ s1PauseTimeLeft: 0 });
          continue;
        }

        get().updatePaperInCurrentRun(nextPaper.id, { s1Decision: 'PENDING' });
        set({ isS1Running: false });
        toast.error("API Error", { id: "api-error-toast", description: `${err.message || 'Unknown error'}. Processing paused.` });
        break;
      }
    }
  },

  startS2Run: (fromS1RunId) => set((state) => {
    const parentRun = state.savedS1Runs.find(r => r.id === fromS1RunId) || state.currentS1Run;
    if (!parentRun) return state;

    const newRun: ReviewRun = {
      id: crypto.randomUUID(),
      name: `${parentRun.name} (S2)`,
      model: state.model,
      timestamp: new Date().toISOString(),
      papers: Object.values(parentRun.papers).reduce((acc, p) => {
        if (p.s1Decision === 'INCLUDED') {
          acc[p.id] = { ...p, s2Status: 'PENDING' };
        } else {
          acc[p.id] = { ...p, s2Status: 'SKIPPED' };
        }
        return acc;
      }, {} as Record<string, Paper>),
      stats: { total: Object.values(parentRun.papers).length, included: 0, excluded: 0, notAccessible: 0 }
    };
    return { currentS2Run: newRun };
  }),

  updatePaperInS2Run: (paperId, update) => set((state) => {
    if (!state.currentS2Run) return state;
    const run = { ...state.currentS2Run };
    if (run.papers[paperId]) {
      run.papers = { ...run.papers, [paperId]: { ...run.papers[paperId], ...update } };

      // We could update S2 stats here if needed
      let inc = 0, exc = 0;
      Object.values(run.papers).forEach(p => {
        if (p.s2Decision === 'INCLUDED') inc++;
        else if (p.s2Decision === 'EXCLUDED') exc++;
      });
      run.stats = { ...run.stats, included: inc, excluded: exc };
    }
    return { currentS2Run: run };
  }),

  saveCurrentS2Run: () => set((state) => {
    if (!state.currentS2Run) return state;
    return { savedS2Runs: [...state.savedS2Runs, state.currentS2Run] };
  }),

  fetchAvailableModels: async (apiKey: string) => {
    if (!apiKey) {
      set({ availableModels: [], provider: '' });
      return;
    }

    set({ isFetchingModels: true, apiKey });

    let detectedProvider = '';
    let models: string[] = [];

    try {
      if (apiKey.startsWith('sk-ant-')) {
        detectedProvider = 'anthropic';
        // Anthropic models endpoint: https://api.anthropic.com/v1/models
        // Note: Anthropic models endpoint usually requires a beta header or specialized access from browser in CORS.
        // For security and CORS reasons in standard browsers without a proxy, fetching directly might fail.
        // Assuming we can fetch it (or we mock the fetch if it fails CORS for the prototype):
        const res = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-beta': 'models-v1'
          }
        });

        if (res.ok) {
          const data = await res.json();
          models = data.data
            .filter((m: any) => m.type === 'model' && m.id.includes('claude'))
            .map((m: any) => m.id);
        } else {
          // Fallback for CORS in pure browser environment
          models = ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-opus-latest'];
        }

      } else if (apiKey.startsWith('AIza')) {
        detectedProvider = 'google';
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (res.ok) {
          const data = await res.json();
          models = data.models
            .filter((m: any) => m.supportedGenerationMethods.includes('generateContent') && m.name.includes('gemini'))
            .map((m: any) => m.name.replace('models/', ''));
        }
      } else if (apiKey.startsWith('sk-') || apiKey.startsWith('sk-proj-')) {
        detectedProvider = 'openai';
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (res.ok) {
          const data = await res.json();
          models = data.data
            .filter((m: any) => (m.id.startsWith('gpt-') || m.id.startsWith('o')) && !m.id.includes('vision') && !m.id.includes('audio') && !m.id.includes('instruct') && !m.id.includes('realtime') && !m.id.includes('embedding'))
            .map((m: any) => m.id)
            .sort(); // simple string sort for now
        } else {
          models = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'];
        }
      } else {
        throw new Error("Unknown API Key Format");
      }

      if (models.length > 0) {
        set({
          availableModels: models,
          provider: detectedProvider,
          model: models[0], // Auto-select first available
          isFetchingModels: false
        });
      } else {
        set({ availableModels: [], isFetchingModels: false });
      }

    } catch (err) {
      console.error("Failed to fetch models dynamically", err);
      // Fallback in case of strict CORS blocking pure browser fetching
      if (detectedProvider === 'google') models = ['gemini-1.5-pro-latest', 'gemini-1.5-flash-latest'];
      if (detectedProvider === 'anthropic') models = ['claude-3-5-sonnet-latest', 'claude-3-opus-latest'];
      if (detectedProvider === 'openai') models = ['gpt-4o', 'gpt-4o-mini', 'o1-preview'];

      set({
        availableModels: models,
        provider: detectedProvider || 'openai',
        model: models[0] || '',
        isFetchingModels: false
      });
    }
  }
}));
