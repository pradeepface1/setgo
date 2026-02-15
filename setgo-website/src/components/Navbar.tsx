'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl group-hover:scale-110 transition-transform">
              S
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              SetGo
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#solutions" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Solutions</Link>
            <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Platform</Link>
            <Link href="#why-us" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Why SetGo</Link>
            <Link href="#contact" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Contact</Link>

            <Link href="#demo" className="group flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-blue-600 transition-all">
              Request Demo
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-900 focus:outline-none"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="px-6 py-8 space-y-6 flex flex-col">
              <Link href="#solutions" className="text-lg font-medium text-slate-900" onClick={() => setIsOpen(false)}>Solutions</Link>
              <Link href="#features" className="text-lg font-medium text-slate-900" onClick={() => setIsOpen(false)}>Platform</Link>
              <Link href="#why-us" className="text-lg font-medium text-slate-900" onClick={() => setIsOpen(false)}>Why SetGo</Link>
              <div className="pt-4">
                <Link href="#demo" className="block w-full text-center bg-blue-600 text-white px-6 py-4 rounded-xl font-bold text-lg" onClick={() => setIsOpen(false)}>
                  Request Demo
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
