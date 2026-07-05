import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  Activity, Shield, Users, Clock, Brain, Stethoscope, 
  HeartPulse, ChevronRight, Sparkles, Zap, Globe, 
  ArrowRight, Star, CheckCircle2, Phone, Monitor
} from 'lucide-react';

const features = [
  { icon: Brain, title: 'AI-Powered Diagnostics', desc: 'Real-time intelligent analysis and clinical decision support powered by advanced AI.' },
  { icon: Shield, title: 'Military-Grade Security', desc: 'End-to-end encryption with HIPAA compliance and zero-trust architecture.' },
  { icon: Clock, title: 'Real-Time Collaboration', desc: 'Instant sync across all departments. Every update is live, everywhere.' },
  { icon: Users, title: 'Multi-Role Access', desc: 'Doctors, nurses, lab, pharmacy — everyone connected in one unified platform.' },
  { icon: HeartPulse, title: 'Emergency Response', desc: 'Critical alerts with instant doctor notifications. Every second counts.' },
  { icon: Globe, title: 'Cloud-Native Platform', desc: 'Access from any device, anywhere. Built for the modern hospital ecosystem.' },
];

const stats = [
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '50ms', label: 'Response Time' },
  { value: '10K+', label: 'Patients Managed' },
  { value: '24/7', label: 'Support Available' },
];

const testimonials = [
  { name: 'Dr. Sarah Chen', role: 'Chief Of Medicine', text: 'HospitalOS Transformed Our Entire Workflow. The AI Diagnostics Are Simply Phenomenal.' },
  { name: 'James Rodriguez', role: 'Hospital Administrator', text: 'We Cut Our Administrative Overhead By 60%. This Platform Is A Game-Changer.' },
  { name: 'Dr. Priya Sharma', role: 'Emergency Dept Head', text: 'The Emergency Alert System Has Literally Saved Lives. I Cannot Imagine Working Without It.' },
];

// Floating 3D Card Component
function Float3DCard({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setRotateX((y - centerY) / 10 * -1);
    setRotateY((x - centerX) / 10);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7, delay }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transformStyle: 'preserve-3d',
        transition: 'transform 0.1s ease-out',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  
  // Parallax transforms
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  // Animated counter
  const [isVisible, setIsVisible] = useState(false);

  // Particle system
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div ref={containerRef} className="min-h-screen bg-[#030014] text-white overflow-x-hidden" style={{ textTransform: 'none' }}>
      
      {/* ═══════════════════ NAVIGATION ═══════════════════ */}
      <motion.nav 
        initial={{ y: -80 }} 
        animate={{ y: 0 }} 
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-4"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-black shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-lg font-black tracking-[0.2em]" style={{ textTransform: 'uppercase' }}>Hospital<span className="text-purple-400">OS</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#stats" className="hover:text-white transition-colors">Performance</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Reviews</a>
          </div>
          <button 
            onClick={() => navigate('/login')}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] active:scale-95"
          >
            Get Started
          </button>
        </div>
      </motion.nav>

      {/* ═══════════════════ PARTICLE FIELD ═══════════════════ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-purple-400/20"
            style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%` }}
            animate={{ 
              y: [0, -200, 0], 
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0, 0.6, 0] 
            }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'linear' }}
          />
        ))}
      </div>

      {/* ═══════════════════ HERO SECTION ═══════════════════ */}
      <motion.section 
        style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center px-4 pt-24 md:pt-0"
      >
        {/* Giant Gradient Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ scale: [1, 1.3, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute -top-[40%] -left-[20%] w-[80vw] h-[80vw] md:w-[50vw] md:h-[50vw] rounded-full bg-gradient-to-br from-purple-600/30 to-blue-600/10 blur-[120px]"
          />
          <motion.div 
            animate={{ scale: [1, 1.5, 1], rotate: [0, -60, 0] }}
            transition={{ duration: 15, repeat: Infinity, delay: 3 }}
            className="absolute -bottom-[30%] -right-[20%] w-[70vw] h-[70vw] md:w-[40vw] md:h-[40vw] rounded-full bg-gradient-to-bl from-cyan-500/20 to-purple-500/10 blur-[100px]"
          />
          <motion.div 
            animate={{ scale: [1.2, 1, 1.2], rotate: [0, 45, 0] }}
            transition={{ duration: 12, repeat: Infinity, delay: 1 }}
            className="absolute top-[20%] right-[10%] w-[30vw] h-[30vw] rounded-full bg-gradient-to-br from-pink-500/15 to-violet-500/10 blur-[80px]"
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold tracking-wider mb-8"
            style={{ textTransform: 'uppercase' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Next-Generation Hospital Management
          </motion.div>

          {/* Main Title - Netflix Style 3D */}
          <motion.h1 
            initial={{ opacity: 0, y: 50, rotateX: 20 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter mb-6"
            style={{ perspective: '1000px', textTransform: 'none' }}
          >
            <span className="block bg-gradient-to-b from-white via-white/90 to-white/40 bg-clip-text text-transparent">
              The Future Of
            </span>
            <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mt-2">
              Healthcare
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="max-w-2xl mx-auto text-base sm:text-lg text-white/50 font-medium leading-relaxed mb-10"
            style={{ textTransform: 'none' }}
          >
            An AI-powered, cloud-native hospital operating system that connects every department, 
            automates every workflow, and delivers insights that save lives.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button 
              onClick={() => navigate('/login')}
              className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold rounded-2xl text-base transition-all hover:shadow-[0_0_50px_rgba(168,85,247,0.5)] active:scale-95 flex items-center gap-3 w-full sm:w-auto justify-center"
            >
              <Zap className="w-5 h-5" />
              Launch Dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-white/5 border border-white/10 text-white/80 font-bold rounded-2xl text-base transition-all hover:bg-white/10 hover:border-white/20 active:scale-95 w-full sm:w-auto"
            >
              Explore Features
            </button>
          </motion.div>

          {/* 3D Floating Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 80, rotateX: 15 }}
            animate={{ opacity: 1, y: 0, rotateX: 8 }}
            transition={{ duration: 1.2, delay: 1.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 md:mt-20 relative mx-auto max-w-4xl"
            style={{ perspective: '1200px' }}
          >
            <div className="relative rounded-2xl border border-white/10 overflow-hidden bg-gradient-to-b from-white/5 to-transparent shadow-[0_20px_80px_rgba(168,85,247,0.2)]" style={{ transform: 'rotateX(5deg)', transformStyle: 'preserve-3d' }}>
              {/* Mock Dashboard Content */}
              <div className="p-4 md:p-6 space-y-4">
                {/* Fake topbar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30" />
                    <div className="h-3 w-24 bg-white/10 rounded-full" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-32 bg-white/5 border border-white/10 rounded-lg" />
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10" />
                  </div>
                </div>
                {/* Fake stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['#a855f7', '#3b82f6', '#10b981', '#f59e0b'].map((color, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.8 + i * 0.15 }}
                      className="p-4 rounded-xl border border-white/5 bg-white/[0.02]"
                    >
                      <div className="h-2 w-12 rounded-full mb-3" style={{ backgroundColor: `${color}30` }} />
                      <div className="h-5 w-16 rounded bg-white/10 mb-2" />
                      <div className="h-2 w-20 rounded-full bg-white/5" />
                    </motion.div>
                  ))}
                </div>
                {/* Fake chart area */}
                <div className="flex gap-3">
                  <div className="flex-1 h-32 md:h-40 rounded-xl bg-white/[0.02] border border-white/5 p-4">
                    <div className="h-2 w-20 bg-white/10 rounded-full mb-4" />
                    <div className="flex items-end gap-1 h-20">
                      {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((h, i) => (
                        <motion.div 
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 2.2 + i * 0.08, duration: 0.5 }}
                          className="flex-1 rounded-t bg-gradient-to-t from-purple-500/40 to-purple-400/10"
                        />
                      ))}
                    </div>
                  </div>
                  <div className="hidden md:block w-48 h-40 rounded-xl bg-white/[0.02] border border-white/5 p-4">
                    <div className="h-2 w-16 bg-white/10 rounded-full mb-3" />
                    <div className="space-y-2">
                      {[75, 60, 45, 30].map((w, i) => (
                        <motion.div 
                          key={i}
                          initial={{ width: 0 }}
                          animate={{ width: `${w}%` }}
                          transition={{ delay: 2.5 + i * 0.1 }}
                          className="h-3 rounded-full bg-gradient-to-r from-cyan-500/30 to-purple-500/30"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* Glow overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#030014] via-transparent to-transparent pointer-events-none" />
            </div>
            {/* Reflection */}
            <div className="absolute -bottom-20 left-0 right-0 h-20 bg-gradient-to-b from-purple-500/5 to-transparent blur-2xl" />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30"
        >
          <span className="text-[10px] font-bold tracking-[0.3em]" style={{ textTransform: 'uppercase' }}>Scroll</span>
          <div className="w-5 h-8 rounded-full border-2 border-white/20 flex items-start justify-center pt-1.5">
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1 h-1.5 rounded-full bg-white/50" />
          </div>
        </motion.div>
      </motion.section>

      {/* ═══════════════════ FEATURES SECTION ═══════════════════ */}
      <section id="features" className="relative py-24 md:py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 md:mb-20"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold tracking-wider mb-6" style={{ textTransform: 'uppercase' }}>
              <Sparkles className="w-3.5 h-3.5" />
              Platform Capabilities
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight" style={{ textTransform: 'none' }}>
              <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Everything You Need.</span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Nothing You Don't.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {features.map((feature, i) => (
              <Float3DCard key={i} delay={i * 0.1}>
                <div className="group relative p-6 md:p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-purple-500/30 transition-all duration-500 hover:bg-white/[0.05] h-full">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/10 border border-purple-500/20 flex items-center justify-center mb-5 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-shadow">
                      <feature.icon className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2" style={{ textTransform: 'none' }}>{feature.title}</h3>
                    <p className="text-sm text-white/40 leading-relaxed" style={{ textTransform: 'none' }}>{feature.desc}</p>
                  </div>
                </div>
              </Float3DCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ STATS SECTION ═══════════════════ */}
      <section id="stats" className="relative py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            onViewportEnter={() => setIsVisible(true)}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {stats.map((stat, i) => (
              <Float3DCard key={i} delay={i * 0.1}>
                <div className="text-center p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15, type: 'spring', stiffness: 200 }}
                    className="text-3xl md:text-5xl font-black bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2"
                  >
                    {stat.value}
                  </motion.div>
                  <p className="text-xs md:text-sm text-white/40 font-medium" style={{ textTransform: 'uppercase', letterSpacing: '0.15em' }}>{stat.label}</p>
                </div>
              </Float3DCard>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ DEVICE SHOWCASE ═══════════════════ */}
      <section className="relative py-20 md:py-32 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black tracking-tight" style={{ textTransform: 'none' }}>
              <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Works Everywhere.</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Feels Native.</span>
            </h2>
          </motion.div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            {/* Phone Mockup */}
            <Float3DCard delay={0.2}>
              <div className="relative w-[220px] md:w-[260px]">
                <div className="relative rounded-[2rem] border-4 border-white/10 bg-black overflow-hidden shadow-[0_30px_80px_rgba(168,85,247,0.3)]" style={{ aspectRatio: '9/19.5' }}>
                  {/* Phone notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-b-2xl z-10" />
                  {/* Phone screen content */}
                  <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D17] to-[#030014] p-3 pt-8">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-5 h-5 rounded-md overflow-hidden bg-black">
                        <img src="/logo.png" alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="h-2 w-14 bg-white/10 rounded-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {['#a855f7', '#3b82f6', '#10b981', '#f59e0b'].map((c, i) => (
                        <div key={i} className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                          <div className="h-1.5 w-8 rounded-full mb-1.5" style={{ backgroundColor: `${c}40` }} />
                          <div className="h-3 w-10 bg-white/10 rounded" />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {[1, 2, 3].map((_, i) => (
                        <div key={i} className="p-2 rounded-lg bg-white/[0.02] border border-white/5 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-purple-500/20" />
                          <div className="flex-1">
                            <div className="h-1.5 w-full bg-white/10 rounded-full mb-1" />
                            <div className="h-1 w-2/3 bg-white/5 rounded-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Phone icons */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-white/40 font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mobile</span>
                </div>
              </div>
            </Float3DCard>

            {/* Laptop Mockup */}
            <Float3DCard delay={0.4}>
              <div className="relative w-[320px] md:w-[500px]">
                <div className="rounded-t-xl border-2 border-b-0 border-white/10 bg-black overflow-hidden shadow-[0_30px_80px_rgba(168,85,247,0.2)]" style={{ aspectRatio: '16/10' }}>
                  {/* Webcam dot */}
                  <div className="flex items-center justify-center h-4 bg-black/80 border-b border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  </div>
                  {/* Screen content */}
                  <div className="bg-gradient-to-b from-[#0B0D17] to-[#030014] p-3 md:p-4 flex gap-3">
                    {/* Sidebar */}
                    <div className="hidden md:block w-14 space-y-3 py-2">
                      <div className="w-8 h-8 mx-auto rounded-lg overflow-hidden bg-black">
                        <img src="/logo.png" alt="" className="w-full h-full object-cover" />
                      </div>
                      {[1, 2, 3, 4, 5].map((_, i) => (
                        <div key={i} className={`w-8 h-8 mx-auto rounded-lg ${i === 0 ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-white/5'}`} />
                      ))}
                    </div>
                    {/* Main */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="h-3 w-24 bg-white/10 rounded-full" />
                        <div className="flex gap-2">
                          <div className="h-6 w-20 bg-white/5 border border-white/10 rounded-md" />
                          <div className="w-6 h-6 rounded-full bg-white/5" />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {['#a855f7', '#3b82f6', '#10b981', '#f59e0b'].map((c, i) => (
                          <div key={i} className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                            <div className="h-1.5 w-6 rounded-full mb-1" style={{ backgroundColor: `${c}40` }} />
                            <div className="h-2.5 w-8 bg-white/10 rounded" />
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 h-20 rounded-lg bg-white/[0.02] border border-white/5 p-2">
                          <div className="flex items-end gap-0.5 h-12">
                            {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85].map((h, i) => (
                              <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-purple-500/30 to-purple-400/5" style={{ height: `${h}%` }} />
                            ))}
                          </div>
                        </div>
                        <div className="w-24 h-20 rounded-lg bg-white/[0.02] border border-white/5 p-2">
                          <div className="w-12 h-12 mx-auto rounded-full border-4 border-purple-500/30 border-t-purple-400 mt-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Laptop base */}
                <div className="h-3 bg-white/5 border-2 border-t-0 border-white/10 rounded-b-lg mx-4" />
                <div className="h-1 bg-white/5 rounded-b-xl mx-12" />
                {/* Label */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-white/40 font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Desktop</span>
                </div>
              </div>
            </Float3DCard>
          </div>
        </div>
      </section>

      {/* ═══════════════════ TESTIMONIALS ═══════════════════ */}
      <section id="testimonials" className="relative py-20 md:py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black tracking-tight" style={{ textTransform: 'none' }}>
              <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Trusted By</span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Healthcare Leaders</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {testimonials.map((t, i) => (
              <Float3DCard key={i} delay={i * 0.15}>
                <div className="p-6 md:p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-purple-500/20 transition-all h-full flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
                  </div>
                  <p className="text-sm md:text-base text-white/60 leading-relaxed flex-1 mb-6" style={{ textTransform: 'none' }}>"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/30 to-cyan-500/20 flex items-center justify-center text-white/80 text-sm font-bold">
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white" style={{ textTransform: 'none' }}>{t.name}</p>
                      <p className="text-xs text-white/40" style={{ textTransform: 'none' }}>{t.role}</p>
                    </div>
                  </div>
                </div>
              </Float3DCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ FINAL CTA ═══════════════════ */}
      <section className="relative py-24 md:py-32 px-4">
        <div className="max-w-4xl mx-auto text-center relative">
          {/* Background glow */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] md:w-[30vw] md:h-[30vw] rounded-full bg-purple-500/10 blur-[100px]" />
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-6xl font-black tracking-tight mb-6" style={{ textTransform: 'none' }}>
              <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Ready To Transform</span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">Your Hospital?</span>
            </h2>
            <p className="text-base md:text-lg text-white/40 mb-10 max-w-xl mx-auto" style={{ textTransform: 'none' }}>
              Join The Healthcare Revolution. Set Up Your Entire Hospital In Under 5 Minutes.
            </p>
            <button 
              onClick={() => navigate('/login')}
              className="group relative px-10 py-5 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-white font-bold rounded-2xl text-lg transition-all hover:shadow-[0_0_60px_rgba(168,85,247,0.5)] active:scale-95 inline-flex items-center gap-3"
            >
              <Sparkles className="w-5 h-5" />
              Start For Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg overflow-hidden bg-black">
              <img src="/logo.png" alt="" className="w-full h-full object-cover" />
            </div>
            <span className="text-sm font-bold tracking-[0.15em] text-white/40" style={{ textTransform: 'uppercase' }}>Hospital<span className="text-purple-400">OS</span></span>
          </div>
          <p className="text-xs text-white/20" style={{ textTransform: 'none' }}>© 2026 HospitalOS. All Rights Reserved. Built With ❤️</p>
        </div>
      </footer>
    </div>
  );
}
