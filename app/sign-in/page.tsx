'use client';

import { ArrowRight } from 'lucide-react';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { InteractiveBackground } from '@/components/interactive-background';

export default function SignInPage() {
    return (
        <div className="relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-[#050505] text-slate-100 selection:bg-primary/30 selection:text-white font-sans items-center justify-center">

            {/* Ambient Background Glows */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none opacity-40 z-0" />

            <InteractiveBackground />

            <div className="relative z-10 w-full max-w-[400px] p-6 flex flex-col items-center gap-8">

                {/* Logo & Header */}
                <Link href="/" className="flex flex-col items-center gap-4 cursor-pointer group animate-in fade-in slide-in-from-top-8 duration-1000 fill-mode-both">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-transparent transition-transform duration-300 group-hover:scale-110 group-active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                        <Logo className="w-12 h-12" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-xl font-semibold text-white tracking-tight var(--font-outfit) font-outfit">Welcome back</h1>
                        <p className="text-sm text-slate-400 mt-1">Sign in to your account to continue</p>
                    </div>
                </Link>

                {/* Glass Form Container */}
                <div className="w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-[200ms] fill-mode-both relative overflow-hidden">
                    {/* Inner subtle glow */}
                    <div className="absolute inset-0 pointer-events-none rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" />

                    <form className="flex flex-col gap-5 relative z-10" onSubmit={(e) => e.preventDefault()}>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="email" className="text-xs-caps pl-1">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                placeholder="name@organization.edu"
                                className="h-11 w-full rounded-lg bg-white/5 border border-white/10 px-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all shadow-inner"
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between pl-1">
                                <label htmlFor="password" className="text-xs-caps">Password</label>
                                <a href="#" className="text-[10px] uppercase tracking-widest font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">Forgot?</a>
                            </div>
                            <input
                                type="password"
                                id="password"
                                placeholder="••••••••"
                                className="h-11 w-full rounded-lg bg-white/5 border border-white/10 px-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all shadow-inner"
                                required
                            />
                        </div>

                        <button
                            type="button"
                            className="mt-2 h-11 w-full rounded-lg bg-white text-black text-sm font-semibold hover:bg-slate-200 transition-all flex items-center justify-center gap-2 button-hover-lift shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] group animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-[400ms] fill-mode-both"
                        >
                            Sign In
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </button>

                    </form>
                </div>

                {/* Footer Switch */}
                <div className="text-center text-sm text-slate-400 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-[600ms] fill-mode-both">
                    Don't have an account?{' '}
                    <Link href="/sign-up" className="text-white font-medium hover:text-indigo-300 transition-colors link-underline">
                        Sign up instead
                    </Link>
                </div>

            </div>
        </div>
    );
}
