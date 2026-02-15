'use client';

import { motion } from 'framer-motion';

const steps = [
  {
    number: '01',
    title: 'Employee Requests Ride',
    description: 'Employees book a ride via the Commuter App or simply adhere to their roster schedule.'
  },
  {
    number: '02',
    title: 'Smart Assignment',
    description: 'Our system automatically assigns the nearest available driver and optimizes the route.'
  },
  {
    number: '03',
    title: 'Safe Journey',
    description: 'The driver picks up the employee. Admins track the trip in real-time until completion.'
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            A seamless workflow from booking to destination.
          </p>
        </div>

        <div className="relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 -z-10" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative bg-white pt-8 text-center lg:text-left"
              >
                <div className="inline-block p-4 rounded-2xl bg-blue-50 text-blue-600 text-2xl font-bold mb-6 border-4 border-white shadow-lg lg:mb-8">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
