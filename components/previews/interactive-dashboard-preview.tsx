'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Database, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export function InteractiveDashboardPreview() {
    const [phase, setPhase] = useState<'idle' | 'scanning' | 'extracted'>('idle');

    useEffect(() => {
        const runAnimationLoop = () => {
            setPhase('idle');

            setTimeout(() => {
                setPhase('scanning');
            }, 800);

            setTimeout(() => {
                setPhase('extracted');
            }, 2500);

            setTimeout(() => {
                runAnimationLoop();
            }, 5500);
        };

        runAnimationLoop();

        // Cleanup not strictly necessary for this infinite unmounted loop, but good practice
        return () => {
            // In a real app we'd attach timeouts to refs to clear them, 
            // but this is fine for a purely visual looping preview component.
        };
    }, []);

    return (
        <div className="relative rounded-xl border border-white/10 bg-[#0a0a0a] overflow-hidden shadow-2xl aspect-[16/9] w-full flex items-center justify-center font-sans">

            {/* Ambient Background Glow inside the dashboard */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full" />

            <div className="absolute inset-0 p-6 flex flex-col gap-4">

                {/* Mock Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex gap-3 items-center">
                        <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center">
                            <Database className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="w-32 h-3 bg-white/20 rounded" />
                            <div className="w-20 h-2 bg-white/10 rounded" />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <div className="w-16 h-6 bg-white/5 rounded-full border border-white/10" />
                        <div className="w-6 h-6 bg-white/5 rounded-full border border-white/10" />
                    </div>
                </div>

                {/* Grid Content */}
                <div className="grid grid-cols-12 gap-4 h-full pb-2">

                    {/* Left Column: The "Document" being scanned */}
                    <div className="col-span-7 bg-white/[0.02] border border-white/5 rounded-xl p-5 relative overflow-hidden flex flex-col gap-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            <span className="text-[10px] font-mono tracking-wider text-indigo-400 uppercase">Input Source</span>
                        </div>

                        <div className="w-3/4 h-4 bg-white/20 rounded" />

                        {/* Abstract text lines */}
                        <div className="flex flex-col gap-2 mt-2 opacity-50">
                            <div className="w-full h-2 bg-white/20 rounded" />
                            <div className="w-full h-2 bg-white/20 rounded" />
                            <div className="w-5/6 h-2 bg-white/20 rounded" />
                            <div className="w-full h-2 bg-white/20 rounded" />
                            <div className="w-4/6 h-2 bg-white/20 rounded" />
                        </div>

                        {/* The Scanner Beam */}
                        <div
                            className={`absolute left-0 right-0 h-32 bg-gradient-to-b from-transparent via-indigo-500/20 to-indigo-500/50 border-b border-indigo-400 transition-all duration-[1500ms] ease-linear z-10 ${phase === 'idle' ? '-top-32 opacity-0' :
                                    phase === 'scanning' ? 'top-full opacity-100' :
                                        'top-full opacity-0 duration-300'
                                }`}
                        />
                    </div>

                    {/* Right Column: Extracted Data Bento Boxes */}
                    <div className="col-span-5 flex flex-col gap-4">

                        {/* Bento 1: Status */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl block p-4 flex-1 relative overflow-hidden transition-all duration-500">
                            {phase === 'extracted' && <div className="absolute inset-0 bg-emerald-500/10 animate-in fade-in duration-500" />}

                            <div className="flex items-center gap-2 mb-3">
                                <ShieldCheck className={`w-4 h-4 transition-colors duration-500 ${phase === 'extracted' ? 'text-emerald-400' : 'text-slate-600'}`} />
                                <span className="text-[10px] uppercase tracking-wider text-slate-500">Eligibility</span>
                            </div>

                            <div className="flex flex-col gap-2">
                                {phase === 'idle' || phase === 'scanning' ? (
                                    <>
                                        <div className="w-24 h-5 bg-white/10 rounded animate-pulse" />
                                        <div className="w-32 h-3 bg-white/5 rounded mt-1" />
                                    </>
                                ) : (
                                    <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
                                        <div className="text-emerald-400 font-bold text-lg flex items-center gap-2">
                                            INCLUDED
                                            <CheckCircle2 className="w-3 h-3" />
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1 line-clamp-2">
                                            Matches RCT study design and XYZ population criteria.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bento 2: Metrics */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl block p-4 flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap className={`w-4 h-4 transition-colors duration-500 ${phase === 'extracted' ? 'text-indigo-400' : 'text-slate-600'}`} />
                                <span className="text-[10px] uppercase tracking-wider text-slate-500">Extraction</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <div className="bg-black/40 rounded p-2 flex flex-col gap-1 border border-white/5">
                                    <span className="text-[9px] text-slate-500 uppercase">Cohort Size</span>
                                    {phase === 'extracted' ? (
                                        <span className="text-white text-sm font-mono animate-in zoom-in duration-300">N=450</span>
                                    ) : (
                                        <div className="w-8 h-4 bg-white/10 rounded" />
                                    )}
                                </div>
                                <div className="bg-black/40 rounded p-2 flex flex-col gap-1 border border-white/5">
                                    <span className="text-[9px] text-slate-500 uppercase">Age</span>
                                    {phase === 'extracted' ? (
                                        <span className="text-white text-sm font-mono animate-in zoom-in duration-300 delay-100">42.5y</span>
                                    ) : (
                                        <div className="w-8 h-4 bg-white/10 rounded" />
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </div>

            {/* Gradient Overlay for bottom fade */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
        </div>
    );
}
