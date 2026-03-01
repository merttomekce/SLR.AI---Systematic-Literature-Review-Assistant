'use client';

import { useEffect, useState } from 'react';
import { GitCompare, Check, Minus } from 'lucide-react';

export function ComparisonPreview() {
    const [phase, setPhase] = useState<'loading' | 'populated'>('loading');

    useEffect(() => {
        const interval = setInterval(() => {
            setPhase((prev) => (prev === 'loading' ? 'populated' : 'loading'));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const studies = [
        { author: 'Smith et al.', cohort: 'N=245', doubleBlind: true, bias: 'Low' },
        { author: 'Chen, 2023', cohort: 'N=890', doubleBlind: true, bias: 'Low' },
        { author: 'Gupta et al.', cohort: 'N=120', doubleBlind: false, bias: 'High' },
    ];

    return (
        <div className="w-full h-full flex flex-col gap-4 opacity-90 p-2 font-sans bg-[#0a0a0a] rounded-xl border border-white/5 shadow-2xl relative overflow-hidden">

            <div className="absolute top-0 right-1/4 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 z-10">
                    <GitCompare className="w-4 h-4 text-purple-400" />
                    <span className="text-xs uppercase tracking-wider text-slate-300">Phase 4: Synthesis Grid</span>
                </div>
                <div className="flex gap-1">
                    <div className="w-4 h-4 rounded bg-white/5 border border-white/10" />
                    <div className="w-4 h-4 rounded bg-white/5 border border-white/10" />
                </div>
            </div>

            {/* Grid Area */}
            <div className="flex flex-col gap-2 h-full z-10 mt-2">

                {/* Headers */}
                <div className="grid grid-cols-4 gap-2 mb-2 px-2 bg-white/5 py-2 rounded text-[9px] uppercase tracking-widest text-slate-500">
                    <div>Study</div>
                    <div>Cohort Size</div>
                    <div>Dbl-Blind</div>
                    <div>RoB Bias</div>
                </div>

                {/* Rows */}
                {studies.map((study, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 px-2 py-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center">
                        {/* Author */}
                        <div className="text-xs text-white  animate-in fade-in slide-in-from-left-2 duration-300 fill-mode-both" style={{ animationDelay: `${index * 100}ms` }}>
                            {study.author}
                        </div>

                        {/* Status columns */}
                        {['cohort', 'blind', 'bias'].map((colType, colIndex) => (
                            <div key={colIndex} className="flex items-center">
                                {phase === 'loading' ? (
                                    <div className="w-full max-w-[40px] h-3 bg-white/10 rounded animate-pulse" />
                                ) : (
                                    <div className="animate-in fade-in zoom-in-95 duration-500 fill-mode-both" style={{ animationDelay: `${(index * 100) + (colIndex * 150)}ms` }}>
                                        {colType === 'cohort' && <span className="text-xs text-slate-300 font-mono bg-white/5 px-2 py-0.5 rounded">{study.cohort}</span>}
                                        {colType === 'blind' && (
                                            study.doubleBlind ?
                                                <Check className="w-3 h-3 text-emerald-400" /> :
                                                <Minus className="w-3 h-3 text-slate-600" />
                                        )}
                                        {colType === 'bias' && (
                                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${study.bias === 'Low' ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}>
                                                {study.bias}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Gradient bottom mask */}
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
        </div>
    );
}
