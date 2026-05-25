import Image from "next/image";
import { Camera, MapPin } from 'lucide-react';

export default function Hero() {
    return (
        <section className="relative w-full min-h-[90vh] flex items-center justify-center bg-offwhite dark:bg-charcoal overflow-hidden pt-20">

            {/* Dynamic Background Elements */}
            <div className="absolute top-1/4 -right-20 w-96 h-96 bg-saffron rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse" />
            <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-gold rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse animation-delay-2000" />
            <div className="absolute bottom-1/2 left-1/2 w-96 h-96 bg-saffron rounded-full mix-blend-multiply filter blur-[128px] opacity-20" />

            {/* Decorative Kathamandu Skyline/Silhouette Hint (Abstract Line) */}
            <div className="absolute bottom-0 w-full h-32 border-t border-saffron/10 dark:border-white/5 opacity-30 flex items-end">
                <svg className="w-full h-full text-saffron" viewBox="0 0 1440 320" preserveAspectRatio="none">
                    <path fill="currentColor" fillOpacity="0.1" d="M0,288L48,272C96,256,192,224,288,208C384,192,480,192,576,213.3C672,235,768,277,864,282.7C960,288,1056,256,1152,240C1248,224,1344,224,1392,224L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                </svg>
            </div>

            <div className="container relative z-10 px-4 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                {/* Text Content */}
                <div className="flex flex-col gap-6 max-w-2xl mx-auto lg:mx-0 text-center lg:text-left pt-12 lg:pt-0">
                    <div className="inline-flex items-center gap-2 self-center lg:self-start bg-white dark:bg-gray-800 px-4 py-2 rounded-full border border-saffron/30 shadow-sm backdrop-blur-sm">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-saffron opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-saffron"></span>
                        </span>
                        <span className="text-xs font-bold tracking-widest uppercase text-saffron flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Born in Kathmandu
                        </span>
                    </div>

                    <h1 className="font-heading font-bold text-5xl md:text-7xl leading-[1.1] tracking-tight">
                        Discover <span className="text-gradient hover:scale-105 transition-transform inline-block duration-300">South Asian</span> Fashion
                    </h1>

                    <p className="text-lg md:text-xl text-charcoal/80 dark:text-offwhite/80 leading-relaxed font-medium">
                        The premier marketplace connecting local Nepalese vendors with fashion enthusiasts worldwide. Use our AI tools to visualize your perfect outfit.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 mt-4 justify-center lg:justify-start">
                        <button className="btn-primary flex items-center justify-center gap-2 group">
                            Start Shopping
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </button>
                        <button className="btn-secondary flex items-center justify-center gap-2 group border-gold text-charcoal dark:text-offwhite hover:bg-gold hover:text-charcoal hover:border-gold">
                            <Camera className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            AI Outfit Try-on
                        </button>
                    </div>

                    <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm font-medium text-charcoal/60 dark:text-offwhite/60">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className={`relative w-8 h-8 rounded-full border-2 border-offwhite dark:border-charcoal bg-gray-300 flex items-center justify-center shadow-sm overflow-hidden`}>
                                    <Image src={`https://api.dicebear.com/7.x/notionists/svg?seed=${i + 10}&backgroundColor=FF6B35`} alt="avatar" fill className="object-cover" sizes="32px" />
                                </div>
                            ))}
                        </div>
                        <p>Joined by <span className="text-saffron font-bold text-base">5,000+</span> fashion lovers.</p>
                    </div>
                </div>

                {/* Imagery */}
                <div className="relative w-full h-[500px] lg:h-[700px] group">
                    {/* Main Hero Image Placeholder / Collage */}
                    <div className="absolute inset-0 z-10 w-full h-full p-4 transform lg:translate-x-8 lg:-translate-y-8 group-hover:translate-x-4 transition-transform duration-700">
                        <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-saffron to-gold shadow-2xl overflow-hidden relative border-4 border-offwhite dark:border-charcoal isolate">
                            {/* Stand-in for generated apparel image */}
                            <Image src="https://images.unsplash.com/photo-1610486744865-c81cae933d1c?q=80&w=1280&auto=format&fit=crop" priority className="absolute inset-0 object-cover mix-blend-overlay opacity-80" alt="South Asian Fashion" fill sizes="(max-width: 1024px) 100vw, 50vw" />
                            <Image src="https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=1600&auto=format&fit=crop" priority className="absolute inset-0 object-cover z-20 hover:scale-105 transition-transform duration-1000 origin-bottom" alt="Fashion model" fill sizes="(max-width: 1024px) 100vw, 50vw" />
                        </div>
                    </div>

                    {/* Floating UI Card - AI Try On Hint */}
                    <div className="absolute top-1/4 -left-8 md:-left-12 z-20 glass-panel rounded-xl p-4 shadow-xl flex items-center gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
                        <div className="w-12 h-12 rounded-full bg-charcoal text-white flex items-center justify-center">
                            <Camera className="w-6 h-6 text-saffron" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-charcoal dark:text-offwhite uppercase tracking-wider mb-1">AI Recommendation</p>
                            <p className="text-sm font-medium text-green-600 dark:text-green-400">98% Match for you</p>
                        </div>
                    </div>

                    {/* Floating UI Card - Vendor Mention */}
                    <div className="absolute bottom-1/4 -right-4 md:-right-8 z-20 glass-panel rounded-xl p-4 shadow-xl flex items-center gap-4 hover:-translate-y-2 transition-transform duration-300">
                        <div className="w-12 h-12 rounded-full border-2 border-gold flex items-center justify-center overflow-hidden bg-white">
                            <span className="font-heading font-black text-gold text-lg italic">FB</span>
                        </div>
                        <div>
                            <p className="font-heading font-bold text-charcoal dark:text-offwhite text-lg">Himalayan Loom</p>
                            <p className="text-xs font-semibold uppercase text-text-muted">Vendor in Thamel</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
