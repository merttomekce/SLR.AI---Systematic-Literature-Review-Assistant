'use client';

import {
    FileText,
    BookOpen,
    BarChart3,
    ArrowRight,
    Brain,
    FileSearch,
    GitCompare,
    Twitter,
    Mail,
    Zap,
    Shield,
    Clock
} from 'lucide-react';
import Link from 'next/link';
import { useReviewStore } from '@/store/useReviewStore';
import { useRouter } from 'next/navigation';
import { InteractiveBackground } from '@/components/interactive-background';
import { InteractiveDashboardPreview } from '@/components/previews/interactive-dashboard-preview';
import { Logo } from '@/components/logo';

export default function LandingPage() {
    const router = useRouter();
    const { currentS1Run, currentS2Run, savedS1Runs } = useReviewStore();

    const hasAnyRuns = !!currentS1Run || !!currentS2Run || savedS1Runs.length > 0;

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-black text-slate-200 selection:bg-white/20 font-sans">

            {/* Background Glow Effects from Stitch */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none z-0 opacity-40 mix-blend-screen" />
            <div className="fixed bottom-0 right-0 w-[800px] h-[500px] bg-indigo-900/10 blur-[100px] rounded-full pointer-events-none z-0 opacity-30" />

            <InteractiveBackground />

            {/* Sticky Navigation */}
            <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-black/60 backdrop-blur-xl">
                <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6">
                    <Link href="/" className="flex items-center gap-2.5 text-white transition-opacity hover:opacity-80">
                        <Logo className="w-5 h-5 text-white" />
                        <span className="text-base font-semibold tracking-tight text-white var(--font-outfit) font-outfit">SLR AI</span>
                    </Link>

                    <div className="flex items-center gap-6">
                        <nav className="hidden md:flex items-center gap-6">
                            <Link href="/features" className="text-[13px] font-medium text-[#8A8F98] hover:text-white transition-colors duration-200">Features</Link>
                            <a href="https://github.com/merttomekce/SLR.AI---Systematic-Literature-Review-Assistant" target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium text-[#8A8F98] hover:text-white transition-colors duration-200">Docs</a>
                        </nav>

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
            </header>

            <main className="relative z-10 flex flex-col items-center">
                {/* Hero Section */}
                <section className="flex flex-col items-center justify-center px-6 py-24 md:py-32 max-w-[1000px] text-center">
                    <div className="mb-6 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-[200ms] fill-mode-both">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 mr-2 animate-pulse" />
                        v2.0 is now available
                    </div>

                    <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-7xl bg-clip-text text-transparent bg-gradient-to-br from-white to-zinc-500 pb-2 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-[400ms] fill-mode-both">
                        AI-Powered Systematic<br /> Literature Review
                    </h1>

                    <p className="mb-10 max-w-2xl text-lg text-slate-400 font-light leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-[600ms] fill-mode-both">
                        Accelerate your research with the next generation of systematic review tools.
                        Automated screening, precision extraction, and synthesis designed for speed.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-[800ms] fill-mode-both">
                        {hasAnyRuns ? (
                            <Link href="/dashboard">
                                <button className="h-12 w-full sm:w-auto px-8 rounded bg-white text-black text-sm font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 duration-200">
                                    Resume Your Work
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </Link>
                        ) : (
                            <Link href="/dashboard">
                                <button className="h-12 w-full sm:w-auto px-8 rounded bg-white text-black text-sm font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 duration-200">
                                    Start New Review
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </Link>
                        )}
                        <Link href="https://github.com/merttomekce/SLR.AI---Systematic-Literature-Review-Assistant" target="_blank" rel="noopener noreferrer">
                            <button className="h-12 w-full sm:w-auto px-8 rounded border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                                <FileText className="w-5 h-5" />
                                View Documentation
                            </button>
                        </Link>
                    </div>

                    {/* Abstract Dashboard Flow Preview */}
                    <div className="mt-20 w-full relative group animate-in fade-in slide-in-from-bottom-12 duration-[1500ms] delay-[1200ms] fill-mode-both">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                        <InteractiveDashboardPreview />
                    </div>
                </section>

                {/* Features Section */}
                <section className="w-full max-w-[1200px] px-6 py-24 animate-in fade-in slide-in-from-bottom-12 duration-[1500ms] delay-[1500ms] fill-mode-both">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-xs font-bold tracking-[0.2em] text-indigo-400 uppercase">Core Capabilities</h2>
                            <h3 className="text-3xl font-semibold text-white">Precision Engineered</h3>
                        </div>
                        <p className="text-slate-400 max-w-md text-sm leading-relaxed">
                            Designed for the rigorous demands of academic research, ensuring zero hallucinations and maximum traceability through structured reasoning.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Feature 1 */}
                        <div className="bg-white/[0.02] backdrop-blur-md border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.15] hover:-translate-y-1 transition-all duration-300 rounded-xl p-8 flex flex-col h-full">
                            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 text-white border border-white/10">
                                <Brain className="w-6 h-6" />
                            </div>
                            <h4 className="text-lg font-medium text-white mb-2">Intelligent Screening</h4>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                AI-assisted abstract screening uses Chain of Thought reasoning to evaluate criteria, reducing manual workload by up to 80% with high recall.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white/[0.02] backdrop-blur-md border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.15] hover:-translate-y-1 transition-all duration-300 rounded-xl p-8 flex flex-col h-full">
                            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 text-white border border-white/10">
                                <FileSearch className="w-6 h-6" />
                            </div>
                            <h4 className="text-lg font-medium text-white mb-2">Full-Text Extraction</h4>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Automatically extract structured data points, methodologies, and statistical results directly into an exportable Excel table from PDF full texts.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white/[0.02] backdrop-blur-md border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.15] hover:-translate-y-1 transition-all duration-300 rounded-xl p-8 flex flex-col h-full">
                            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 text-white border border-white/10">
                                <GitCompare className="w-6 h-6" />
                            </div>
                            <h4 className="text-lg font-medium text-white mb-2">Model Comparison</h4>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Compare results across different LLMs (GPT-4, Claude 3.5, Gemini Pro) simultaneously to validate precision and spot edge cases.
                            </p>
                        </div>
                    </div>
                </section>

                {/* KPI / Stats Grid */}
                <section className="w-full border-y border-white/5 bg-[#0a0a0a]/50 backdrop-blur-sm">
                    <div className="mx-auto flex max-w-[1200px] flex-wrap justify-center gap-12 py-12 px-6 md:justify-between text-center md:text-left">
                        <div>
                            <div className="text-3xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
                                <Shield className="w-6 h-6 text-indigo-400" />
                                Zero
                            </div>
                            <div className="text-xs font-medium uppercase tracking-wider text-slate-500 mt-1">Data Retention</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
                                <Zap className="w-6 h-6 text-amber-400" />
                                10x
                            </div>
                            <div className="text-xs font-medium uppercase tracking-wider text-slate-500 mt-1">Faster Reviews</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
                                <Clock className="w-6 h-6 text-green-400" />
                                Real-Time
                            </div>
                            <div className="text-xs font-medium uppercase tracking-wider text-slate-500 mt-1">Processing</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
                                Multiple
                            </div>
                            <div className="text-xs font-medium uppercase tracking-wider text-slate-500 mt-1">LLM Backends</div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-32 px-6 text-center w-full">
                    <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl bg-[#0a0a0a] border border-white/5 p-12 md:p-20 shadow-2xl">
                        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-purple-900/20 blur-3xl" />
                        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-indigo-900/20 blur-3xl" />
                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to accelerate your research?</h2>
                            <p className="text-slate-400 mb-8 max-w-lg mx-auto">Skip the spreadsheet manual labor. Screen thousands of papers with AI precision.</p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                {hasAnyRuns ? (
                                    <Link href="/dashboard">
                                        <button className="h-12 w-full sm:w-auto px-8 rounded bg-white text-black text-sm font-semibold hover:bg-slate-200 transition-colors shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 duration-200">
                                            Resume Your Work
                                        </button>
                                    </Link>
                                ) : (
                                    <Link href="/dashboard">
                                        <button className="h-12 w-full sm:w-auto px-8 rounded bg-white text-black text-sm font-semibold hover:bg-slate-200 transition-colors shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 duration-200">
                                            Get Started Free
                                        </button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 bg-black py-16">
                <div className="mx-auto flex max-w-[1200px] flex-col gap-12 px-6 md:flex-row md:justify-between">
                    <div className="flex flex-col gap-4 max-w-xs">
                        <div className="flex items-center gap-2 text-white">
                            <Logo className="w-5 h-5 font-bold" />
                            <span className="text-lg font-bold var(--font-outfit) font-outfit">SLR AI</span>
                        </div>
                        <p className="text-sm text-slate-500">
                            The standard for AI-assisted systematic literature reviews. Built for accuracy, designed for speed.
                        </p>
                        <div className="flex gap-4 mt-2">
                            <a className="text-slate-500 hover:text-white transition-colors cursor-pointer">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="mailto:mert.tomekce@bau.edu.tr" className="text-slate-500 hover:text-white transition-colors cursor-pointer">
                                <Mail className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 sm:grid-cols-3">
                        <div className="flex flex-col gap-4">
                            <h4 className="text-sm font-semibold text-white">Product</h4>
                            <Link href="/features" className="text-sm text-slate-500 hover:text-white transition-colors">Features</Link>
                            <Link href="/dashboard" className="text-sm text-slate-500 hover:text-white transition-colors">Start Review</Link>
                            <Link href="/dashboard" className="text-sm text-slate-500 hover:text-white transition-colors">Dashboard</Link>
                        </div>
                        <div className="flex flex-col gap-4">
                            <h4 className="text-sm font-semibold text-white">Resources</h4>
                            <a href="https://github.com/merttomekce/SLR.AI---Systematic-Literature-Review-Assistant" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-white transition-colors">Documentation</a>
                            <a href="#" className="text-sm text-slate-500 hover:text-white transition-colors cursor-pointer">Community</a>
                        </div>
                        <div className="flex flex-col gap-4">
                            <h4 className="text-sm font-semibold text-white">Legal</h4>
                            <a className="text-sm text-slate-500 hover:text-white transition-colors cursor-pointer">Privacy Policy</a>
                            <a className="text-sm text-slate-500 hover:text-white transition-colors cursor-pointer">Terms of Service</a>
                        </div>
                    </div>
                </div>
                <div className="mx-auto mt-12 max-w-[1200px] border-t border-white/5 px-6 pt-8 text-center md:text-left">
                    <p className="text-xs text-slate-600">© {new Date().getFullYear()} SLR AI Inc. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
