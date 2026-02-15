'use client';

export default function TrustedBy() {
    const logos = [
        'TechCorp', 'InnoSys', 'GlobalData', 'StreamLine', 'FutureNet', 'CloudNine',
        'AlphaWave', 'NextGen', 'BlueSky', 'UrbanMotion', 'SwiftLogistics'
    ];

    return (
        <section className="py-10 border-y border-slate-100 bg-slate-50/50 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-8 text-center text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Trusted by Innovative Companies
            </div>

            <div className="relative flex overflow-x-hidden group">
                <div className="animate-marquee whitespace-nowrap flex items-center gap-16">
                    {[...logos, ...logos].map((logo, i) => (
                        <div key={i} className="text-2xl font-black text-slate-300 flex items-center gap-2 hover:text-slate-800 transition-colors duration-300 cursor-pointer">
                            <div className="w-8 h-8 rounded bg-current opacity-20"></div>
                            {logo}
                        </div>
                    ))}
                </div>

                <div className="absolute top-0 animate-marquee2 whitespace-nowrap flex items-center gap-16 ml-16">
                    {[...logos, ...logos].map((logo, i) => (
                        <div key={i} className="text-2xl font-black text-slate-300 flex items-center gap-2 hover:text-slate-800 transition-colors duration-300 cursor-pointer">
                            <div className="w-8 h-8 rounded bg-current opacity-20"></div>
                            {logo}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
