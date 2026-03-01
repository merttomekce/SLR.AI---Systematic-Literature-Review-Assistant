'use client';

import { useEffect, useState } from 'react';
import { Settings, Plus, Sparkles } from 'lucide-react';

export function SetupPreview() {
    const [phase, setPhase] = useState<'typing' | 'analyzing' | 'done'>('typing');
    const [textLength, setTextLength] = useState(0);

    const fullPrompt = "Must include RCTs published after 2018 with cohorts > 400.";

    useEffect(() => {
        let typingInterval: NodeJS.Timeout;

        const runLoop = () => {
            setPhase('typing');
            setTextLength(0);

            // Typing simulation
            let currentLen = 0;
            typingInterval = setInterval(() => {
                currentLen += 2;
                setTextLength(currentLen);
                if (currentLen >= fullPrompt.length) {
                    clearInterval(typingInterval);
                    setTimeout(() => setPhase('analyzing'), 500);
                    setTimeout(() => setPhase('done'), 1500);
                    setTimeout(runLoop, 4500);
                }
            }, 30);
        };

        runLoop();

        return () => clearInterval(typingInterval);
    }, []);

    return (
        <div className="w-full h-full flex flex-col gap-4 opacity-90 p-2 font-sans">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs uppercase tracking-wider text-slate-300">Phase 1: Setup</span>
                </div>
                <div className="h-2 w-24 bg-white/10 rounded-full" />
            </div>

            {/* Prompt Box */}
            <div className="bg-white/5 rounded-lg border border-white/10 p-4 flex flex-col gap-3 relative overflow-hidden">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Inclusion Prompt</span>

                <div className="text-sm font-light text-slate-300 leading-relaxed min-h-[40px] flex gap-1">
                    {fullPrompt.substring(0, textLength)}
                    {phase === 'typing' && <span className="w-1.5 h-4 bg-indigo-400 animate-pulse" />}
                </div>

                {/* AI Analysis Overlay */}
                <div className={`absolute inset-0 bg-indigo-500/10 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 ${phase === 'analyzing' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                </div>
            </div>

            {/* Extracted Badges */}
            <div className="flex flex-col gap-2 mt-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest pl-1">Extracted Criteria</span>
                <div className="flex flex-wrap gap-2">
                    {phase === 'done' ? (
                        <>
                            <div className="px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-xs animate-in zoom-in duration-300">
                                RCT Design
                            </div>
                            <div className="px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-xs animate-in zoom-in duration-300 delay-100 fill-mode-both">
                                Year {'>'} 2018
                            </div>
                            <div className="px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-xs animate-in zoom-in duration-300 delay-200 fill-mode-both">
                                Cohort {'>'} 400
                            </div>
                        </>
                    ) : (
                        <div className="px-2 py-1 border border-white/5 rounded flex items-center gap-1 text-slate-600 text-xs text-opacity-50">
                            <Plus className="w-3 h-3" /> Waiting for prompt...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
