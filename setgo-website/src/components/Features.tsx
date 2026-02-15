'use client';

import { MapPin, Shield, Zap, Clock, Smartphone, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: <MapPin className="w-6 h-6 text-blue-600" />,
    title: 'Real-Time Visibility',
    description: 'Track every vehicle in your fleet with sub-second latency. Know where your assets are instantly.'
  },
  {
    icon: <Shield className="w-6 h-6 text-green-600" />,
    title: 'Safety Compliance',
    description: 'Built-in checks for vehicle documents, driver verification, and trip adherence.'
  },
  {
    icon: <Zap className="w-6 h-6 text-orange-600" />,
    title: 'AI Optimization',
    description: 'Reduce operational costs by up to 30% with intelligent route planning and capacity management.'
  },
  {
    icon: <Clock className="w-6 h-6 text-purple-600" />,
    title: 'Schedule Management',
    description: 'Handle complex roster shifts with ease. Allow employees to reschedule within policy limits.'
  },
  {
    icon: <Smartphone className="w-6 h-6 text-indigo-600" />,
    title: 'Native Mobile Apps',
    description: 'Seamless experience for drivers and commuters on both Android and iOS platforms.'
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-red-600" />,
    title: 'Analytics Dashboard',
    description: 'Deep dive into performance metrics. Export custom reports for billing and audit compliance.'
  }
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-block px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wide mb-4">
            Platform Capabilities
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
            Everything you need to run a modern transport operation.
          </h2>
          <p className="text-lg text-slate-600">
            A comprehensive suite of tools designed to simplify simplicity and maximize efficiency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                {feature.title}
              </h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
