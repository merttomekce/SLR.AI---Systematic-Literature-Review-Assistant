'use client';

import { BookOpen, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { InteractiveBackground } from '@/components/interactive-background';

export default function SignUpPage() {
    return (
        <div className="relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-[#050505] text-slate-100 selection:bg-primary/30 selection:text-white font-sans items-center justify-center py-12">

            {/* Ambient Background Glows */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none opacity-40 z-0" />

            <InteractiveBackground />

            <div className="relative z-10 w-full max-w-[440px] p-6 flex flex-col items-center gap-8">

                {/* Logo & Header */}
                <Link href="/" className="flex flex-col items-center gap-4 cursor-pointer group animate-in fade-in slide-in-from-top-8 duration-1000 fill-mode-both">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-black transition-transform duration-300 group-hover:scale-110 group-active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                        <BookOpen className="w-6 h-6 font-bold" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-xl font-semibold text-white tracking-tight">Create an account</h1>
                        <p className="text-sm text-slate-400 mt-1">Join the next generation of academic research</p>
                    </div>
                </Link>

                {/* Glass Form Container */}
                <div className="w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-[200ms] fill-mode-both relative overflow-hidden">
                    {/* Inner subtle glow */}
                    <div className="absolute inset-0 pointer-events-none rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" />

                    <form className="flex flex-col gap-5 relative z-10" onSubmit={(e) => e.preventDefault()}>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label htmlFor="firstName" className="text-xs-caps pl-1">First Name</label>
                                <input
                                    type="text"
                                    id="firstName"
                                    placeholder="Jane"
                                    className="h-11 w-full rounded-lg bg-white/5 border border-white/10 px-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all shadow-inner"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label htmlFor="lastName" className="text-xs-caps pl-1">Last Name</label>
                                <input
                                    type="text"
                                    id="lastName"
                                    placeholder="Doe"
                                    className="h-11 w-full rounded-lg bg-white/5 border border-white/10 px-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all shadow-inner"
                                    required
                                />
                            </div>
                        </div>

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
                            <label htmlFor="password" className="text-xs-caps pl-1">Password</label>
                            <input
                                type="password"
                                id="password"
                                placeholder="Create a strong password"
                                className="h-11 w-full rounded-lg bg-white/5 border border-white/10 px-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all shadow-inner"
                                required
                            />
                            <p className="text-[10px] text-slate-500 pl-1">Must be at least 8 characters long.</p>
                        </div>

                        <button
                            type="button"
                            className="mt-4 h-11 w-full rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 button-hover-lift shadow-[0_0_20px_-5px_rgba(79,70,229,0.4)] group animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-[400ms] fill-mode-both border border-indigo-500/50"
                        >
                            Create Account
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </button>

                    </form>
                </div>

                {/* Footer Switch */}
                <div className="text-center text-sm text-slate-400 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-[600ms] fill-mode-both">
                    Already have an account?{' '}
                    <Link href="/sign-in" className="text-white font-medium hover:text-indigo-300 transition-colors link-underline">
                        Sign in instead
                    </Link>
                </div>

            </div>
        </div>
    );
}
