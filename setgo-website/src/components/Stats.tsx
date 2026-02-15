'use client';

import { motion } from 'framer-motion';

const stats = [
    { label: 'Active Drivers', value: '5,000+' },
    { label: 'Monthly Trips', value: '1.2M+' },
    { label: 'On-Time Arrival', value: '99.8%' },
    { label: 'Cities Covered', value: '25+' },
];

export default function Stats() {
    return (
        <section className="py-20 bg-blue-600 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>

            <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.5 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <div className="text-4xl md:text-5xl font-black mb-2 tracking-tight">
                                {stat.value}
                            </div>
                            <div className="text-blue-200 font-medium text-lg uppercase tracking-wide">
                                {stat.label}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
