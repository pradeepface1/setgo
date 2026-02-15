'use client';

import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

export default function WhyChooseUs() {
    return (
        <section id="why-us" className="py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">

                {/* Block 1 */}
                <div className="flex flex-col lg:flex-row items-center gap-16 mb-32">
                    <div className="lg:w-1/2">
                        <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 mb-6">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                            Automated Dispatching for Maximum Efficiency
                        </h2>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                            Stop wasting hours on manual rosters. Our AI engine automatically assigns the best driver based on location, traffic, and vehicle capacity.
                        </p>
                        <ul className="space-y-4">
                            {['Reduce waiting time by 40%', 'Optimize fuel consumption', 'Instant driver notifications'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                                    <CheckCircle2 className="text-blue-600 w-5 h-5" /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="lg:w-1/2 relative">
                        <div className="absolute inset-0 bg-orange-100/50 rounded-3xl transform rotate-3 scale-95"></div>
                        <div className="relative bg-slate-50 border border-slate-100 rounded-3xl p-8 shadow-xl">
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">👤</div>
                                            <div>
                                                <div className="font-bold text-sm">Trip #{2000 + i}</div>
                                                <div className="text-xs text-green-600 font-medium">Auto-assigned</div>
                                            </div>
                                        </div>
                                        <div className="text-xs font-bold bg-slate-100 px-2 py-1 rounded">08:00 AM</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Block 2 (Reversed) */}
                <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
                    <div className="lg:w-1/2">
                        <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 mb-6">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                            Enterprise-Grade Safety & Compliance
                        </h2>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                            Ensure safety of every employee with real-time tracking, SOS alerts, and mandatory driver verification checks.
                        </p>
                        <ul className="space-y-4">
                            {['24/7 Control Room View', 'One-touch SOS for employees', 'Digital Trip Sheets & Audit Logs'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                                    <CheckCircle2 className="text-blue-600 w-5 h-5" /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="lg:w-1/2 relative">
                        <div className="absolute inset-0 bg-purple-100/50 rounded-3xl transform -rotate-3 scale-95"></div>
                        <div className="relative bg-slate-900 rounded-3xl p-8 shadow-xl text-white">
                            <div className="flex items-center justify-between mb-8">
                                <div className="font-bold">Live Tracking</div>
                                <div className="text-xs bg-red-500 px-2 py-1 rounded animate-pulse">Live</div>
                            </div>
                            <div className="h-64 bg-slate-800 rounded-xl relative overflow-hidden flex items-center justify-center">
                                <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover"></div>
                                <div className="relative z-10 w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)]"></div>
                                <div className="absolute top-1/2 left-1/2 w-32 h-32 border border-blue-500/30 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
