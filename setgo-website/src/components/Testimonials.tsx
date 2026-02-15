'use client';

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const testimonials = [
    {
        quote: "SetGo completely transformed how we manage our 500-employee fleet. The automated dispatch alone saved us 20 hours a week.",
        author: "Sarah Jenkins",
        role: "Transport Manager, TechCorp",
        image: "https://randomuser.me/api/portraits/women/44.jpg"
    },
    {
        quote: "The safety features are unmatched. Real-time tracking and emergency SOS give our employees peace of mind during late-night shifts.",
        author: "Michael Chen",
        role: "Operations Director, GlobalSystems",
        image: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
        quote: "Finally, a dashboard that makes sense. We can see every trip, every cost, and every delay instantly. Highly recommended.",
        author: "Priya Sharma",
        role: "Admin Head, FutureNet India",
        image: "https://randomuser.me/api/portraits/women/68.jpg"
    }
];

export default function Testimonials() {
    return (
        <section className="py-24 bg-slate-50">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Trusted by Industry Leaders</h2>
                    <p className="text-slate-600">Don't just take our word for it.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.2 }}
                            className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative"
                        >
                            <Quote className="text-blue-100 w-12 h-12 absolute top-6 left-6 -z-10" />
                            <p className="text-slate-700 mb-6 italic relative z-10 leading-relaxed">
                                "{t.quote}"
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden">
                                    {/* Placeholder for actual image if remote patterns allowed, else color block */}
                                    {/* <Image src={t.image} width={48} height={48} alt={t.author} /> */}
                                    <div className="w-full h-full bg-slate-300 flex items-center justify-center text-slate-500 font-bold">
                                        {t.author[0]}
                                    </div>
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900">{t.author}</div>
                                    <div className="text-xs text-slate-500">{t.role}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
