'use client';

import { useEffect, useState } from 'react';
import { Network, CheckCircle2, XCircle } from 'lucide-react';

export function ScreeningPreview() {
    const [scrolledIndex, setScrolledIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setScrolledIndex((prev) => (prev >= 4 ? 0 : prev + 1));
        }, 1200);
        return () => clearInterval(interval);
    }, []);

    const papers = [
        { status: 'included', reason: 'Matches RCT' },
        { status: 'excluded', reason: 'Wrong Population' },
        { status: 'included', reason: 'Meets outcomes' },
        { status: 'excluded', reason: 'In-vitro study' },
        { status: 'included', reason: 'Right drug class' }
    ];

    return (
        <div className="w-full h-full flex flex-col gap-4 opacity-90 p-2 font-sans relative">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs uppercase tracking-wider text-slate-300">Phase 2: High-Speed Screening</span>
                </div>
                <div className="flex gap-1 text-[10px] text-slate-500">
                    <span className="text-white">2,000</span> Papers Found
                </div>
            </div>

            <div className="flex gap-4 h-full">
                {/* Left: Rapid List */}
                <div className="w-1/3 h-full flex flex-col gap-2 overflow-hidden relative">
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#0a0a0a]/90 to-transparent z-10" />

                    <div className="flex flex-col gap-2 transition-transform duration-500" style={{ transform: `translateY(-${scrolledIndex * 36}px)` }}>
                        {papers.map((paper, i) => (
                            <div key={i} className={`h-7 w-full rounded border flexitems-center px-2 flex-shrink-0 transition-colors duration-300 ${i === scrolledIndex ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-white/5 border-white/5'}`}>
                                <div className={`w-full h-2 rounded ${i === scrolledIndex ? 'bg-indigo-400' : 'bg-white/20'}`} />
                            </div>
                        ))}
                        {/* Duplicate for infinite feel */}
                        {papers.map((paper, i) => (
                            <div key={`dup-${i}`} className="h-7 w-full rounded border bg-white/5 border-white/5 flexitems-center px-2 flex-shrink-0">
                                <div className="w-full h-2 rounded bg-white/20" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: AI Decision */}
                <div className="w-2/3 h-full flex flex-col gap-3 relative overflow-hidden bg-white/5 rounded-lg border border-white/10 p-4">

                    <div className="h-2 w-3/4 bg-white/20 rounded" />
                    <div className="h-2 w-full bg-white/10 rounded mt-2" />
                    <div className="h-2 w-5/6 bg-white/10 rounded" />
                    <div className="h-2 w-4/6 bg-white/10 rounded" />

                    <div className="mt-auto border-t border-white/10 pt-3">
                        {papers[scrolledIndex]?.status === 'included' ? (
                            <div className="flex flex-col gap-1 animate-in slide-in-from-bottom-2 fade-in duration-200">
                                <div className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> MATCHED
                                </div>
                                <span className="text-[9px] text-emerald-500/70 uppercase">{papers[scrolledIndex].reason}</span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1 animate-in slide-in-from-bottom-2 fade-in duration-200">
                                <div className="text-rose-400 text-xs font-bold flex items-center gap-1">
                                    <XCircle className="w-3 h-3" /> REJECTED
                                </div>
                                <span className="text-[9px] text-rose-500/70 uppercase">{papers[scrolledIndex].reason}</span>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
