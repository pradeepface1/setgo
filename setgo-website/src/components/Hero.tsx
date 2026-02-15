'use client';

import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle } from 'lucide-react';
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">

          {/* Content */}
          <div className="lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wide mb-8">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                Reimagining Corporate Mobility
              </div>

              <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]">
                Unified Transport <br />
                <span className="text-blue-600">Automation Platform.</span>
              </h1>

              <p className="text-lg text-slate-600 mb-10 max-w-lg leading-relaxed">
                Connect your employees, drivers, and transport managers on a single intelligent platform. Optimize routes, reduce costs, and ensure 100% safety.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full text-base font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-600/30">
                  Book a Demo
                  <ArrowRight size={18} />
                </button>
                <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-full text-base font-bold hover:bg-slate-50 transition-all">
                  <PlayCircle size={18} className="text-blue-600" />
                  Watch Video
                </button>
              </div>

              <div className="mt-10 flex items-center gap-4 text-sm text-slate-500">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                Trusted by 50+ Enterprises
              </div>
            </motion.div>
          </div>

          {/* Visual */}
          <div className="lg:w-1/2 relative">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative z-10"
            >
              {/* Abstract Modern Composition */}
              <div className="relative">
                {/* Main Dashboard Card */}
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 w-full max-w-lg mx-auto transform rotate-1 hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="text-lg font-bold text-slate-900">Live Fleet Overview</div>
                      <div className="text-sm text-slate-500">Bangalore Office • 24 Active Trips</div>
                    </div>
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Live</div>
                  </div>
                  {/* Mock Chart/Map */}
                  <div className="h-48 bg-slate-50 rounded-xl mb-4 relative overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="w-32 h-32 border-4 border-blue-500 rounded-full flex items-center justify-center">
                        <span className="font-bold text-2xl text-blue-600">98%</span>
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-0 w-full text-center text-xs text-slate-400">On-Time Arrival Rate</div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">🚚</div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">Vehicle #8291</div>
                          <div className="text-xs text-slate-500">Arriving in 5 mins</div>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-slate-400" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">📍</div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">Route A-12</div>
                          <div className="text-xs text-slate-500">Optimized Path Found</div>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Floating Element 1 - Mobile App */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-8 -bottom-12 bg-slate-900 text-white p-4 rounded-2xl shadow-xl w-48 hidden md:block"
                >
                  <div className="flex items-center gap-2 mb-2 opacity-80">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <div className="text-xs">Driver App</div>
                  </div>
                  <div className="text-sm font-medium mb-1">New Trip Assigned</div>
                  <div className="text-xs text-slate-400">Pickup at Sector 45</div>
                </motion.div>

                {/* Floating Element 2 - Badge */}
                <div className="absolute -left-8 top-12 bg-white p-3 rounded-xl shadow-lg border border-slate-100 hidden md:flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    AI
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Powered by</div>
                    <div className="text-sm font-bold text-slate-900">SetGo Engine</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
