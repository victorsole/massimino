'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { scrollRevealVariants } from '@/lib/animations/variants';
import { Shield, TrendingUp, Users, Dumbbell, ArrowRight } from 'lucide-react';

/* ─── Pexels fallback image URLs (stable, publicly accessible) ─── */
const FALLBACK_IMAGES = {
  hero: 'https://images.pexels.com/photos/416717/pexels-photo-416717.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
  about: 'https://images.pexels.com/photos/136409/pexels-photo-136409.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
  cta: 'https://images.pexels.com/photos/2403027/pexels-photo-2403027.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
  gallery: [
    'https://images.pexels.com/photos/4753892/pexels-photo-4753892.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',
    'https://images.pexels.com/photos/4944977/pexels-photo-4944977.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',
    'https://images.pexels.com/photos/5750963/pexels-photo-5750963.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',
    'https://images.pexels.com/photos/4854258/pexels-photo-4854258.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',
    'https://images.pexels.com/photos/5961847/pexels-photo-5961847.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400',
  ],
  features: [
    'https://images.pexels.com/photos/4058413/pexels-photo-4058413.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
    'https://images.pexels.com/photos/3757954/pexels-photo-3757954.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
    'https://images.pexels.com/photos/260447/pexels-photo-260447.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
  ],
};

/* ─── Featured programs ─── */
const FEATURED_PROGRAMS = [
  { name: 'The Golden Six', category: 'Classic', tag: 'Strength' },
  { name: 'HIIT Workout', category: 'Modality', tag: 'Cardio' },
  { name: 'Hyrox Training', category: 'Competition', tag: 'Endurance' },
  { name: 'NASM Fat Loss', category: 'Goal-Based', tag: 'Weight Loss' },
  { name: 'Classic Physique PPL', category: 'Classic', tag: 'Hypertrophy' },
  { name: 'Postpartum Recovery', category: 'Lifestyle', tag: 'Wellness' },
];

/* ─── Animated counter hook ─── */
function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            setCount(Math.floor(progress * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

/* ─── Main Page ─── */
export default function HomePage() {
  const [partners, setPartners] = useState<Array<any>>([]);
  const [pexelsImages, setPexelsImages] = useState<{
    hero?: string;
    about?: string;
    cta?: string;
    gallery: string[];
    features: string[];
  }>({
    hero: FALLBACK_IMAGES.hero,
    about: FALLBACK_IMAGES.about,
    cta: FALLBACK_IMAGES.cta,
    gallery: FALLBACK_IMAGES.gallery,
    features: FALLBACK_IMAGES.features,
  });

  /* Load partners */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/partners');
        const data = await res.json();
        setPartners(data.partners || []);
      } catch {
        setPartners([
          { name: 'Amix', url: 'https://amix.com/?utm_source=massimino&utm_medium=partner_band&utm_campaign=amix', logoUrl: '/images/amix-logo.png' },
          { name: 'Bo', url: 'http://app.hellobo.eu?utm_source=massimino&utm_medium=partner_band&utm_campaign=bo', logoUrl: '/images/Bo_logo.png' },
          { name: 'Quota Vita', url: 'https://www.quotavita.com/en?utm_source=massimino&utm_medium=partner_band&utm_campaign=quotavita', logoUrl: '/images/quotavitalogo.jpg' },
        ]);
      }
    })();
  }, []);

  /* Load Pexels images */
  useEffect(() => {
    async function fetchPexels(query: string, count: number) {
      try {
        const res = await fetch(`/api/pexels?query=${encodeURIComponent(query)}&per_page=${count}`);
        const data = await res.json();
        return (data.photos || []).map((p: any) => p.src.large2x);
      } catch {
        return [];
      }
    }

    (async () => {
      const [heroImgs, aboutImgs, galleryImgs, featureImgs, ctaImgs] = await Promise.all([
        fetchPexels('fitness gym workout', 1),
        fetchPexels('personal trainer coaching', 1),
        fetchPexels('sport fitness training exercise', 5),
        fetchPexels('gym equipment weights', 3),
        fetchPexels('running athlete outdoor', 1),
      ]);
      setPexelsImages(prev => ({
        hero: heroImgs[0] || prev.hero,
        about: aboutImgs[0] || prev.about,
        cta: ctaImgs[0] || prev.cta,
        gallery: galleryImgs.length >= 5 ? galleryImgs : prev.gallery,
        features: featureImgs.length >= 3 ? featureImgs : prev.features,
      }));
    })();
  }, []);

  const normalizeLogo = (logoUrl: string | null | undefined) =>
    (logoUrl || '').replace(/^\/assets\/images\//, '/images/');

  /* Stat counters */
  const statAthletes = useCountUp(500);
  const statPrograms = useCountUp(30);
  const statExercises = useCountUp(1200);
  const statCountries = useCountUp(12);

  return (
    <>
      {/* ════════ HERO ════════ */}
      <section className="relative min-h-screen flex items-center justify-center text-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src={pexelsImages.hero!}
            alt="Fitness training"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#2b5069]/50 via-[#2b5069]/30 to-[#2b5069]/90" />
        </div>

        {/* Content */}
        <motion.div
          className="relative z-10 max-w-3xl sm:max-w-4xl px-4 sm:px-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="font-display text-sm md:text-base font-medium uppercase tracking-[0.25em] text-[#fcfaf5]/80 mb-5">
            Safe Workouts for Everyone
          </p>
          <h1 className="font-display text-5xl sm:text-7xl lg:text-[7.5rem] font-bold uppercase tracking-tight leading-[0.95] text-white mb-3">
            MASSIMINO
          </h1>
          <div className="inline-block px-6 py-2 border border-[#fcfaf5]/40 text-xs sm:text-sm font-display font-medium uppercase tracking-[0.15em] text-[#fcfaf5]/80 mb-8">
            Evidence-Based Fitness &bull; NASM-Aligned
          </div>
          <br />
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-brand-primary text-white font-display text-sm font-semibold uppercase tracking-wider hover:bg-brand-primary-light transition-all hover:-translate-y-0.5"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 border border-white/40 text-white font-display text-sm font-semibold uppercase tracking-wider hover:bg-white/10 transition-all"
            >
              Sign In
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ════════ MARQUEE ════════ */}
      <div className="py-4 overflow-hidden bg-brand-primary">
        <div className="flex animate-marquee-scroll w-max">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-6 px-6 whitespace-nowrap">
              {['#TrainSafe', '#MassiminoFitness', '#ExpertGuidance', '#TrackProgress', '#NASMAligned', '#FitnessForAll'].map((tag) => (
                <span key={tag} className="flex items-center gap-6">
                  <span className="font-display text-sm font-semibold uppercase tracking-[0.15em] text-white">{tag}</span>
                  <span className="w-1.5 h-1.5 bg-[#fcfaf5] rounded-full flex-shrink-0" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ════════ STATS ════════ */}
      <section className="py-20 px-6 md:px-12 bg-[#2b5069] text-center">
        <motion.p
          className="font-display text-sm font-medium uppercase tracking-[0.2em] text-[#fcfaf5]/60 mb-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={scrollRevealVariants}
        >
          Trusted by Athletes Worldwide
        </motion.p>
        <div className="flex flex-wrap justify-center gap-8 md:gap-16">
          {[
            { ref: statAthletes.ref, count: statAthletes.count, suffix: '+', label: 'Athletes' },
            { ref: statPrograms.ref, count: statPrograms.count, suffix: '+', label: 'Programs' },
            { ref: statExercises.ref, count: statExercises.count, suffix: '+', label: 'Exercises' },
            { ref: statCountries.ref, count: statCountries.count, suffix: '', label: 'Countries' },
          ].map((stat) => (
            <div key={stat.label} ref={stat.ref} className="flex flex-col items-center">
              <span className="font-display text-5xl md:text-7xl font-bold text-white leading-none">
                {stat.count}{stat.suffix}
              </span>
              <span className="font-body text-xs uppercase tracking-[0.12em] text-[#fcfaf5]/50 mt-2">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ ABOUT / INTRO ════════ */}
      <section id="about" className="py-24 px-6 md:px-12 bg-[#fcfaf5]">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={scrollRevealVariants}
          >
            <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-brand-primary/60 mb-3">
              About Massimino
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-bold uppercase tracking-tight leading-[1.05] text-[#2b5069] mb-5">
              The Safety-First Fitness Platform
            </h2>
            <p className="font-body text-base text-[#2b5069]/60 leading-relaxed mb-4">
              Massimino is the professional-grade fitness platform built to protect personal trainers and athletes while enabling evidence-based, NASM-aligned programming. Our mission is to foster a respectful, secure, and effective training environment for all.
            </p>
            <p className="font-body text-base text-[#2b5069]/60 leading-relaxed mb-6">
              Connect with verified trainers, access 30+ curated training programs, and track your progress with our intelligent workout logging system.
            </p>
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2b5069]/10 border border-[#2b5069]/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-brand-primary" />
                </div>
                <span className="font-body text-sm text-[#2b5069]/60">Anti-Harassment Protection</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2b5069]/10 border border-[#2b5069]/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-brand-primary" />
                </div>
                <span className="font-body text-sm text-[#2b5069]/60">Evidence-Based Programs</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="relative overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={scrollRevealVariants}
          >
            <Image
              src="/victor/13_bicepbarbell.jpeg"
              alt="Personal training session"
              width={600}
              height={750}
              className="w-full aspect-[4/5] object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#2b5069]/90 to-transparent">
              <p className="font-display text-lg font-semibold uppercase tracking-wider text-white">
                NASM Certified &bull; Evidence Based
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════ FEATURED PROGRAMS (Schedule-style) ════════ */}
      <section id="programs" className="py-24 px-6 md:px-12 bg-[#2b5069]/[0.04]">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scrollRevealVariants}
          >
            <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-brand-primary/60 mb-3">
              Browse Programs
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-bold uppercase tracking-tight text-[#2b5069]">
              Featured Programs
            </h2>
          </motion.div>

          <div className="flex flex-col gap-0.5">
            {FEATURED_PROGRAMS.map((program, i) => (
              <motion.div
                key={program.name}
                className="grid grid-cols-1 md:grid-cols-[180px_1fr_180px] items-center p-5 md:px-8 bg-white/80 hover:bg-brand-primary/[0.06] transition-colors cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <span className="font-display text-xs font-medium uppercase tracking-wider text-brand-primary/60 mb-1 md:mb-0">
                  {program.category}
                </span>
                <span className="font-display text-lg md:text-xl font-semibold uppercase tracking-wide text-[#2b5069] text-center">
                  {program.name}
                </span>
                <span className="font-body text-xs uppercase tracking-wider text-[#2b5069]/40 text-right mt-1 md:mt-0">
                  {program.tag}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/massiminos"
              className="inline-flex items-center gap-2 px-8 py-3 border border-brand-primary text-brand-primary font-display text-sm font-semibold uppercase tracking-wider hover:bg-brand-primary hover:text-white transition-all"
            >
              View All Programs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════ GALLERY ════════ */}
      <section id="gallery" className="py-20">
        <motion.div
          className="text-center mb-10 px-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={scrollRevealVariants}
        >
          <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-brand-primary/60 mb-2">
            Movement in Action
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold uppercase text-[#2b5069]">
            Stay Inspired
          </h2>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-1 sm:gap-2">
          {pexelsImages.gallery.map((src, i) => (
            <div key={i} className="overflow-hidden aspect-square">
              <Image
                src={i === 0 ? '/victor/16_assistedpullup.png' : src}
                alt={`Fitness gallery ${i + 1}`}
                width={400}
                height={400}
                className="w-full h-full object-cover grayscale-[30%] hover:grayscale-0 hover:scale-[1.08] transition-all duration-500"
                sizes="(max-width: 768px) 50vw, 20vw"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ════════ FEATURE CARDS (Venues-style) ════════ */}
      <section className="py-24 px-6 md:px-12 bg-[#2b5069]/[0.04]">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scrollRevealVariants}
          >
            <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-brand-primary/60 mb-3">
              Why Massimino
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-bold uppercase tracking-tight text-[#2b5069]">
              Built Different
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Safety First', detail: 'AI moderation & anti-harassment', tag: 'Protection', icon: Shield, img: pexelsImages.features[0] },
              { title: 'Expert Guidance', detail: 'NASM-certified programming', tag: 'Coaching', icon: Users, img: pexelsImages.features[1] },
              { title: 'Smart Tracking', detail: 'Intelligent workout logging', tag: 'Analytics', icon: Dumbbell, img: pexelsImages.features[2] },
            ].map((feature, i) => (
              <motion.article
                key={feature.title}
                className="relative overflow-hidden cursor-pointer group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="aspect-[3/4] overflow-hidden">
                  <Image
                    src={feature.img}
                    alt={feature.title}
                    width={400}
                    height={533}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[#2b5069]/95 to-transparent">
                  <h3 className="font-display text-2xl font-bold uppercase tracking-wide text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="font-body text-sm text-white/60">{feature.detail}</p>
                </div>
                <span className="absolute top-4 left-4 px-3 py-1.5 bg-brand-primary text-white font-display text-[0.65rem] font-bold uppercase tracking-wider">
                  {feature.tag}
                </span>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ PARTNERS ════════ */}
      <div className="py-12 px-6 border-t border-b border-[#2b5069]/10 overflow-hidden bg-[#fcfaf5]">
        <p className="text-center font-display text-xs uppercase tracking-[0.15em] text-[#2b5069]/40 mb-8">
          Trusted Partners
        </p>
        <div className="flex animate-partners-scroll w-max">
          {[...Array(4)].map((_, setIndex) => (
            <div key={setIndex} className="flex items-center">
              {partners.map((p: any) => (
                <Link
                  key={`${setIndex}-${p.name || p.id}`}
                  href={p.url || '#'}
                  target="_blank"
                  rel="noopener"
                  className="flex-shrink-0 w-32 sm:w-40 h-10 sm:h-14 mx-2 sm:mx-5 flex items-center justify-center border border-[#2b5069]/10 px-3 sm:px-5 py-2 sm:py-2.5 opacity-40 hover:opacity-70 transition-opacity"
                >
                  <Image
                    src={normalizeLogo(p.logoUrl)}
                    alt={p.name || 'Partner'}
                    width={120}
                    height={40}
                    className="object-contain max-h-8"
                  />
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ════════ NEWSLETTER ════════ */}
      <section id="contact" className="py-24 px-6 bg-[#fcfaf5]">
        <motion.div
          className="max-w-[700px] mx-auto text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={scrollRevealVariants}
        >
          <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-brand-primary/60 mb-3">
            Stay Updated
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-bold uppercase tracking-tight text-[#2b5069] mb-4">
            Join the Community
          </h2>
          <p className="font-body text-base text-[#2b5069]/50 leading-relaxed mb-10">
            Get the latest training tips, new program launches, and platform updates delivered to your inbox.
          </p>
          <form
            className="flex flex-col sm:flex-row gap-0 max-w-md mx-auto"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="your@email.com"
              aria-label="Email address"
              className="flex-1 px-5 py-3.5 bg-white border border-[#2b5069]/15 sm:border-r-0 text-[#2b5069] font-body text-sm outline-none focus:border-brand-primary transition-colors"
            />
            <button
              type="submit"
              className="px-7 py-3.5 bg-brand-primary text-white font-display text-sm font-semibold uppercase tracking-wider border border-brand-primary hover:bg-brand-primary-light transition-colors"
            >
              Subscribe
            </button>
          </form>
        </motion.div>
      </section>

      {/* ════════ CTA ════════ */}
      <section className="relative py-32 px-6 text-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={pexelsImages.cta!}
            alt="Start your fitness journey"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#2b5069]/85 to-brand-primary/50" />
        </div>
        <motion.div
          className="relative z-10 max-w-[700px] mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={scrollRevealVariants}
        >
          <h2 className="font-display text-4xl md:text-6xl font-bold uppercase tracking-tight text-white leading-none mb-4">
            Start Your <br /><span className="text-[#fcfaf5]/70">Fitness Journey</span>
          </h2>
          <p className="font-body text-base text-white/60 mb-8">
            Join hundreds of athletes and trainers already using Massimino to train smarter, safer, and together.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-12 py-4 bg-[#fcfaf5] text-[#2b5069] font-display text-base font-bold uppercase tracking-wider hover:bg-white hover:-translate-y-0.5 transition-all"
          >
            Get Started Today
          </Link>
        </motion.div>
      </section>

      {/* ════════ FOOTER RUNNER ════════ */}
      <div className="py-3 overflow-hidden bg-brand-primary">
        <div className="flex animate-marquee-scroll w-max">
          {[...Array(2)].map((_, i) => (
            <span key={i} className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-white/80 px-12 whitespace-nowrap">
              #MassiminoFitness &bull; #TrainSafe &bull; #ExpertGuidance &bull; #TrackProgress &bull; #NASMAligned &bull; #FitnessForAll &bull; #SafeWorkouts &bull; #BuildStrength
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
