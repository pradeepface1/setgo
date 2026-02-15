import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import TrustedBy from '@/components/TrustedBy';
import Features from '@/components/Features';
import Stats from '@/components/Stats';
import WhyChooseUs from '@/components/WhyChooseUs';
import Testimonials from '@/components/Testimonials';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-white font-sans">
      <Navbar />
      <Hero />
      <TrustedBy />
      <WhyChooseUs />
      <Stats />
      <Features />
      <Testimonials />

      {/* Final CTA */}
      <section id="demo" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to upgrade your fleet?
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Join the fastest-growing companies using SetGo to modernize their transport operations.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="bg-blue-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-600/50">
              Get Started Now
            </button>
            <button className="bg-transparent border border-slate-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-slate-800 transition-all">
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
