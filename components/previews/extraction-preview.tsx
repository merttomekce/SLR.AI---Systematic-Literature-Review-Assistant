'use client';

import { useEffect, useState } from 'react';
import { FileSearch, Database, ArrowRight } from 'lucide-react';

export function ExtractionPreview() {
    const [phase, setPhase] = useState<'idle' | 'scanning' | 'extracting'>('idle');

    useEffect(() => {
        const runLoop = () => {
            setPhase('idle');
            setTimeout(() => setPhase('scanning'), 1000);
            setTimeout(() => setPhase('extracting'), 2500);
            setTimeout(runLoop, 6000);
        };
        runLoop();
    }, []);

    return (
        <div className="w-full h-full flex flex-col gap-4 opacity-90 p-2 font-sans overflow-hidden">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                    <FileSearch className="w-4 h-4 text-amber-400" />
                    <span className="text-xs uppercase tracking-wider text-slate-300">Phase 3: Deep Extraction</span>
                </div>
                <div className="h-2 w-16 bg-white/10 rounded-full" />
            </div>

            <div className="flex gap-4 h-full relative">

                {/* Left: Raw PDF Mock */}
                <div className="w-1/2 h-full bg-slate-900 rounded-lg border border-white/5 p-4 flex flex-col gap-3 relative overflow-hidden shadow-inner">
                    <div className="w-full flex justify-between items-center mb-2">
                        <div className="w-20 h-2 bg-white/20 rounded" />
                        <span className="text-[8px] text-slate-500 font-mono">PDF Viewer</span>
                    </div>

                    <div className="h-2 w-full bg-white/10 rounded" />
                    <div className="h-2 w-full bg-white/10 rounded" />
                    <div className="h-2 w-5/6 bg-white/10 rounded mb-2" />

                    {/* Target Data Paragraph */}
                    <div className="relative">
                        <div className={`absolute inset-0 bg-amber-500/20 mix-blend-screen transition-all duration-1000 ease-out z-10 ${phase === 'idle' ? 'w-0' : 'w-full'}`} />
                        <div className="h-2 w-full bg-white/20 rounded" />
                        <div className="h-2 w-3/4 bg-white/20 rounded mt-2" />
                    </div>

                    <div className="mt-2 h-2 w-full bg-white/10 rounded" />
                    <div className="h-2 w-full bg-white/10 rounded mt-2" />
                    <div className="h-2 w-4/6 bg-white/10 rounded mt-2" />
                </div>

                {/* Arrow connector */}
                <div className="absolute left-[47%] top-1/2 -translate-y-1/2 z-20 bg-[#0a0a0a] rounded-full p-1 border border-white/10">
                    <ArrowRight className={`w-4 h-4 transition-colors duration-500 ${phase === 'extracting' ? 'text-amber-400' : 'text-slate-600'}`} />
                </div>

                {/* Right: Structured JSON/Form Output */}
                <div className="w-1/2 h-full bg-white/5 rounded-lg border border-white/10 p-4 flex flex-col gap-4 relative">
                    <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                        <Database className="w-3 h-3 text-slate-400" />
                        <span className="text-[9px] uppercase tracking-widest text-slate-500">Structured Data</span>
                    </div>

                    <div className="flex flex-col gap-3">
                        {/* Demographic Row */}
                        <div className="flex flex-col gap-1">
                            <span className="text-[8px] text-slate-500 uppercase">Mean Age</span>
                            <div className="h-6 w-full rounded bg-black/40 border border-white/5 flex items-center px-2">
                                {phase === 'extracting' ? (
                                    <span className="text-xs text-amber-400 font-mono animate-in slide-in-from-left-2 fade-in duration-300">62.4 ± 5.2</span>
                                ) : (
                                    <div className="w-2 h-3 bg-white/20 rounded animate-pulse" />
                                )}
                            </div>
                        </div>

                        {/* Outcomes Row */}
                        <div className="flex flex-col gap-1">
                            <span className="text-[8px] text-slate-500 uppercase">Primary Outcome</span>
                            <div className="h-10 w-full rounded bg-black/40 border border-white/5 flex items-start p-2">
                                {phase === 'extracting' ? (
                                    <span className="text-[10px] text-white leading-tight animate-in slide-in-from-left-2 fade-in duration-300 delay-100 fill-mode-both">
                                        Significant reduction in systolic pressure (p&lt;0.01)
                                    </span>
                                ) : (
                                    <div className="w-2 h-3 bg-white/20 rounded animate-pulse" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
