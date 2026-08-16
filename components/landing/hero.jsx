'use client';

import Link from 'next/link';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { Reveal } from '@/components/reveal';

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Stripe-style Mesh Background */}
      <div className="mesh-bg"></div>
      <div className="mesh-colorful"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="max-w-3xl">
          <Reveal delay={0}>
            <h1 className="stripe-title mb-6">
              Financial infrastructure to grow your <span className="text-blurple-500">Minecraft Fleet</span>.
            </h1>
          </Reveal>
          
          <Reveal delay={100}>
            <p className="stripe-subtitle mb-10">
              Accept commands, offer advanced automation, and implement custom logic scripts—from your first bot to your thousandth.
            </p>
          </Reveal>
          
          <Reveal delay={200}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link href="/login" className="btn-primary group">
                Start building 
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
              
              <Link href="#docs" className="btn-secondary group text-brand-700">
                <PlayCircle className="w-4 h-4 mr-2" />
                Watch the demo
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Logo Cloud (Like Stripe Social Proof) */}
        <Reveal delay={300}>
          <div className="mt-20 pt-10 border-t border-black/5">
            <p className="text-sm font-medium text-brand-600 mb-6">
              Global fleet running on Native: 1.492M bots
            </p>
            <div className="flex flex-wrap items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
              <div className="text-2xl font-bold font-mono text-brand-800">Hypixel</div>
              <div className="text-2xl font-bold font-mono text-brand-800">Mineplex</div>
              <div className="text-2xl font-bold font-mono text-brand-800">2b2t</div>
              <div className="text-2xl font-bold font-mono text-brand-800">Wynncraft</div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
