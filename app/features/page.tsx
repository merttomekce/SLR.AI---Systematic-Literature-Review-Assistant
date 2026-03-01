'use client';

import {
    ArrowRight,
    Network,
    Database,
    CheckCircle2,
    FileText
} from 'lucide-react';
import Link from 'next/link';
import { useReviewStore } from '@/store/useReviewStore';
import { useRouter } from 'next/navigation';
import { InteractiveBackground } from '@/components/interactive-background';
import { SetupPreview } from '@/components/previews/setup-preview';
import { ScreeningPreview } from '@/components/previews/screening-preview';
import { ExtractionPreview } from '@/components/previews/extraction-preview';
import { ComparisonPreview } from '@/components/previews/comparison-preview';
import { Logo } from '@/components/logo';

export default function FeaturesPage() {
    const router = useRouter();
    const { currentS1Run, currentS2Run, savedS1Runs } = useReviewStore();

    const hasAnyRuns = !!currentS1Run || !!currentS2Run || savedS1Runs.length > 0;

    return (
        <div className="relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-[#050505] text-slate-100 selection:bg-primary/30 selection:text-white font-sans">

            {/* Ambient Background Glows */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none opacity-40 z-0" />
            <div className="fixed bottom-0 right-0 w-[600px] h-[500px] bg-indigo-900/10 blur-[100px] rounded-full pointer-events-none opacity-30 z-0" />

            <InteractiveBackground />

            {/* Navigation */}
            <nav className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#050505]/80 backdrop-blur-xl">
                <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 text-white transition-opacity hover:opacity-80">
                        <Logo className="w-5 h-5 text-white" />
                        <span className="text-base font-semibold tracking-tight text-white var(--font-outfit) font-outfit">SLR AI</span>
                    </Link>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-6">
                            <Link href="/features" className="text-[13px] font-medium text-white transition-colors duration-200">Features</Link>
                            <a href="https://github.com/merttomekce/SLR.AI---Systematic-Literature-Review-Assistant" target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium text-[#8A8F98] hover:text-white transition-colors duration-200">Docs</a>
                        </div>

                        <div className="hidden md:block w-px h-3 bg-[#333333] mx-1" />

                        <div className="flex items-center gap-4">
                            <Link href="/sign-in" className="hidden sm:block text-[13px] font-medium text-[#8A8F98] hover:text-white transition-colors cursor-pointer">
                                Log in
                            </Link>
                            {hasAnyRuns ? (
                                <Link href="/dashboard">
                                    <button className="flex h-8 items-center justify-center rounded-[6px] bg-[#EEEEEE] px-3.5 text-[13px] font-medium text-black transition-all hover:bg-white active:scale-95 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                                        Dashboard
                                    </button>
                                </Link>
                            ) : (
                                <Link href="/sign-up">
                                    <button className="flex h-8 items-center justify-center rounded-[6px] bg-[#EEEEEE] px-3.5 text-[13px] font-medium text-black transition-all hover:bg-white active:scale-95 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                                        Sign up
                                    </button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 flex flex-col items-center flex-1">
                {/* Hero Section */}
                <section className="w-full max-w-7xl mx-auto px-6 pt-32 pb-24 md:pt-48 md:pb-32 text-center">
                    <div className="flex flex-col items-center gap-6 max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-primary font-medium tracking-wide mb-2 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-[200ms] fill-mode-both">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                            </span>
                            V 2.0 AVAILABLE NOW
                        </div>
                        <h1 className="text-5xl md:text-7xl font-sans font-semibold text-white tracking-tight leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-[400ms] fill-mode-both">
                            Built for <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40">Academic Precision</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 max-w-xl font-light leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-[600ms] fill-mode-both">
                            Discover how SLR AI eliminates manual screening and automates data extraction with verifiable accuracy.
                        </p>
                    </div>
                </section>
                {/* Feature Row 0: Configuration & Setup */}
                <section className="w-full max-w-7xl mx-auto px-6 py-24 md:py-32 border-t border-white/5 animate-in fade-in slide-in-from-bottom-12 duration-[1500ms] delay-[800ms] fill-mode-both">
                    <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
                        {/* Image Left */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
                            <div className="bg-white/[0.02] backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_20px_40px_-10px_rgba(0,0,0,0.5)] rounded-xl aspect-[4/3] flex flex-col justify-center relative overflow-hidden p-0">
                                <SetupPreview />
                            </div>
                        </div>
                        {/* Text Right */}
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-3">
                                <FileText className="text-emerald-400 w-5 h-5" />
                                <span className="text-xs font-bold tracking-[0.2em] text-slate-500 uppercase">Configuration</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">Review Setup</h2>
                            <p className="text-slate-400 text-base leading-relaxed max-w-md">
                                Define your systematic review with plain English. Our specialized language models automatically parse your prompts into strict, hierarchical inclusion and exclusion criteria, ensuring no edge-cases are missed.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Feature Row 1: Intelligent Screening */}
                <section className="w-full max-w-7xl mx-auto px-6 py-24 md:py-32 border-t border-white/5 animate-in fade-in slide-in-from-bottom-12 duration-[1500ms] delay-[1000ms] fill-mode-both">
                    <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
                        {/* Text Left */}
                        <div className="flex flex-col gap-6 order-2 md:order-1">
                            <div className="flex items-center gap-3">
                                <Network className="text-primary w-5 h-5" />
                                <span className="text-xs font-bold tracking-[0.2em] text-slate-500 uppercase">Workflow</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">Intelligent Screening</h2>
                            <p className="text-slate-400 text-base leading-relaxed max-w-md">
                                Our Chain of Thought reasoning engine mimics human decision-making. Define your inclusion criteria and watch as the system parses thousands of abstracts in minutes, highlighting relevant evidence with citation-backed reasoning.
                            </p>
                            <div className="pt-4 flex gap-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-2xl font-bold text-white">98%</span>
                                    <span className="text-xs text-slate-500 uppercase tracking-wide">Recall Rate</span>
                                </div>
                                <div className="w-px h-10 bg-white/10" />
                                <div className="flex flex-col gap-1">
                                    <span className="text-2xl font-bold text-white">10x</span>
                                    <span className="text-xs text-slate-500 uppercase tracking-wide">Faster Screening</span>
                                </div>
                            </div>
                        </div>
                        {/* Image Right */}
                        <div className="order-1 md:order-2 relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-xl blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
                            <div className="bg-white/[0.02] backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_20px_40px_-10px_rgba(0,0,0,0.5)] rounded-xl aspect-[4/3] flex items-center justify-center relative overflow-hidden p-0">
                                <ScreeningPreview />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Feature Row 2: Targeted Extraction */}
                <section className="w-full max-w-7xl mx-auto px-6 py-24 md:py-32 border-t border-white/5">
                    <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
                        {/* Image Left */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
                            <div className="bg-white/[0.02] backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_20px_40px_-10px_rgba(0,0,0,0.5)] rounded-xl aspect-[4/3] flex items-center justify-center relative overflow-hidden p-0">
                                <ExtractionPreview />
                            </div>
                        </div>
                        {/* Text Right */}
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-3">
                                <Database className="text-primary w-5 h-5" />
                                <span className="text-xs font-bold tracking-[0.2em] text-slate-500 uppercase">Extraction</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">Targeted Extraction</h2>
                            <p className="text-slate-400 text-base leading-relaxed max-w-md">
                                Seamlessly import collections of PDFs. Our system identifies key variables, outcomes, and demographics, exporting structured, clean data directly to Excel formatting. Save hundreds of hours on manual data entry.
                            </p>
                            <ul className="space-y-3 pt-2">
                                <li className="flex items-center gap-3 text-sm text-slate-300">
                                    <CheckCircle2 className="text-primary w-4 h-4" />
                                    Structured JSON &amp; Excel Export
                                </li>
                                <li className="flex items-center gap-3 text-sm text-slate-300">
                                    <CheckCircle2 className="text-primary w-4 h-4" />
                                    Table Data parsing
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Feature Row 3: Verifiable Precision */}
                <section className="w-full max-w-7xl mx-auto px-6 py-24 md:py-32 border-t border-white/5 mb-20">
                    <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
                        {/* Text Left */}
                        <div className="flex flex-col gap-6 order-2 md:order-1">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                                <span className="text-xs font-bold tracking-[0.2em] text-slate-500 uppercase">Verification</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">Verifiable Precision</h2>
                            <p className="text-slate-400 text-base leading-relaxed max-w-md">
                                Trust but verify. SLR AI employs a multi-model consensus mechanism allowing you to compare runs from Claude 3.5 Sonnet, GPT-4o, and Gemini Pro 1.5 to cross-reference results. Discrepancies are flagged for human review, ensuring unparalleled accuracy.
                            </p>
                            <Link href="/review/comparison" className="mt-4 flex items-center gap-2 text-white text-sm font-medium group w-fit">
                                Compare models
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                        {/* Image Right */}
                        <div className="order-1 md:order-2 relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
                            <div className="bg-white/[0.02] backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_20px_40px_-10px_rgba(0,0,0,0.5)] rounded-xl aspect-[4/3] flex items-center justify-center relative overflow-hidden p-0">
                                <ComparisonPreview />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Bottom CTA */}
                <section className="w-full border-t border-white/5 bg-gradient-to-b from-[#050505] to-[#0a0a0a] py-32 px-6">
                    <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-8">
                        <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-tight">Ready to accelerate your research?</h2>
                        <p className="text-slate-400 text-lg">Join top researchers streamlining their literature reviews today.</p>
                        <div className="flex gap-4 flex-col sm:flex-row">
                            {hasAnyRuns ? (
                                <Link href="/dashboard">
                                    <button className="bg-white hover:bg-slate-200 transition-colors text-black font-semibold h-12 px-8 rounded flex items-center justify-center hover:scale-105 active:scale-95 duration-200">
                                        Resume Your Work
                                    </button>
                                </Link>
                            ) : (
                                <Link href="/sign-up">
                                    <button className="bg-white hover:bg-slate-200 transition-colors text-black font-semibold h-12 px-8 rounded flex items-center justify-center hover:scale-105 active:scale-95 duration-200">
                                        Start New Review
                                    </button>
                                </Link>
                            )}
                            <a href="https://github.com/merttomekce/SLR.AI---Systematic-Literature-Review-Assistant" target="_blank" rel="noopener noreferrer">
                                <button className="bg-transparent border border-white/20 hover:bg-white/5 transition-colors text-white font-medium h-12 px-8 rounded flex items-center justify-center">
                                    Read Documentation
                                </button>
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-white/5 py-12 px-6 bg-[#050505]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 opacity-80">
                        <div className="size-5 text-white">
                            <Logo className="w-5 h-5" />
                        </div>
                        <span className="text-white text-sm font-bold tracking-tight var(--font-outfit) font-outfit">SLR AI</span>
                    </div>
                    <div className="flex gap-6 text-sm text-slate-500">
                        <a className="hover:text-white transition-colors cursor-pointer">Privacy</a>
                        <a className="hover:text-white transition-colors cursor-pointer">Terms</a>
                        <a className="hover:text-white transition-colors cursor-pointer">Twitter</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
