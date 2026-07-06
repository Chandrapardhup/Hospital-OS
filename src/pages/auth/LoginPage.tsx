import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Mail, Lock, Loader2, User as UserIcon, Building2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/useAuthStore';
import { useHospitalStore } from '../../store/useHospitalStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Role } from '../../types/auth';
import { supabase } from '../../lib/supabase';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'doctor', 'user', 'receptionist', 'nurse', 'laboratory', 'pharmacy'] as const),
  department: z.string().optional(),
  specialization: z.string().optional(),
  experienceYears: z.number().optional(),
  consultationFee: z.number().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth, registerUser } = useAuthStore();
  const { addPatient, addDoctor, addNotification } = useHospitalStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(null);

  const { register: loginReg, handleSubmit: handleLoginSubmit, formState: { errors: loginErrors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const { register: regReg, handleSubmit: handleRegSubmit, watch, setValue, formState: { errors: regErrors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'user' }
  });

  const selectedRole = watch('role');

  const onLogin = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      setError(null);
      const { user, token } = await authService.login(data.email, data.password);
      setAuth(user, token);
      redirectUser(user.role);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: RegisterForm) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newUserId = `usr_${Date.now()}`;
      const newUser = {
        id: newUserId,
        email: data.email,
        password: data.password, // Only storing here to simulate a real DB sign in next time
        name: data.name,
        role: data.role as Role,
        department: data.department
      };

      // 1. Register in Auth Store (our simulated backend DB for logins)
      registerUser(newUser);

      // 2. Register in Hospital Store (our domain data)
      if (data.role === 'user') {
        const newPatientId = `usr_${Date.now()}`;
        addPatient({
          id: newPatientId,
          name: data.name,
          email: data.email,
          phone: '',
          dob: '2000-01-01',
          gender: 'Other',
          bloodGroup: 'Unknown',
          address: '',
          status: 'Outpatient',
          createdAt: new Date().toISOString()
        });
        
        addNotification({
          userId: 'usr_1', // Send to admin
          title: 'New User Registered',
          message: `${data.name} just registered via the portal.`,
          type: 'info'
        });
        
      } else if (data.role === 'doctor') {
        const newDoctorId = `doc_${Date.now()}`;
        addDoctor({
          id: newDoctorId,
          name: `Dr. ${data.name}`,
          email: data.email,
          phone: '',
          department: data.department || 'General',
          specialization: data.specialization || 'General Medicine',
          experienceYears: data.experienceYears || 0,
          consultationFee: data.consultationFee || 100,
          availableDays: ['Monday', 'Wednesday', 'Friday'],
          status: 'Available',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`,
          patientsPerDay: 20
        });
        
        addNotification({
          userId: 'usr_1', // admin
          title: 'New Doctor Registered',
          message: `Dr. ${data.name} has joined the ${data.department || 'General'} department.`,
          type: 'success'
        });
      }

      // Auto-login
      const { user, token } = await authService.login(data.email, data.password);
      setAuth(user, token);
      redirectUser(user.role);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for Supabase native OAuth redirects
  React.useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session && !useAuthStore.getState().isAuthenticated) {
        try {
          setIsLoading(true);
          setError(null);
          const email = session.user.email!;
          const name = session.user.user_metadata?.full_name || email;
          const googleId = session.user.id;

          const { data: existingUser } = await supabase.from('users').select('*').eq('email', email).single();

          if (existingUser) {
            const passwordToUse = existingUser.password || `google_${googleId}`;
            const { user, token } = await authService.login(email, passwordToUse);
            setAuth(user, token);
            redirectUser(user.role);
          } else {
            // User does not exist in mock, show role modal
            setGoogleUser({ email, name, googleId });
            setValue('name', name);
            setShowRoleModal(true);
          }
        } catch (err) {
          setError("Google authentication failed.");
        } finally {
          setIsLoading(false);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Failed to initialize Google Login");
      setIsLoading(false);
    }
  };

  const handleCompleteGoogleRegistration = async () => {
    if (!googleUser || !selectedRole) return;
    const mockPassword = `google_${googleUser.googleId}`;
    
    const formValues = watch();
    
    await onRegister({
      name: formValues.name || googleUser.name,
      email: googleUser.email,
      password: mockPassword,
      role: selectedRole as Role,
      department: formValues.department,
      specialization: formValues.specialization,
      experienceYears: Number(formValues.experienceYears) || 0,
      consultationFee: Number(formValues.consultationFee) || 0
    });
    setShowRoleModal(false);
  };

  const redirectUser = (role: string) => {
    switch(role) {
      case 'admin': navigate('/admin'); break;
      case 'doctor': navigate('/doctor'); break;
      case 'user': navigate('/user'); break;
      case 'receptionist': navigate('/reception'); break;
      case 'nurse': navigate('/nurse'); break;
      case 'laboratory': navigate('/laboratory'); break;
      case 'pharmacy': navigate('/pharmacy'); break;
      default: navigate('/admin');
    }
  };

  const [showSplash, setShowSplash] = useState(() => {
    if (sessionStorage.getItem('Apollo Hospitals_splash_shown')) return false;
    return true;
  });

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [logoPhase, setLogoPhase] = useState(false);

  useEffect(() => {
    if (!showSplash) return;
    sessionStorage.setItem('Apollo Hospitals_splash_shown', 'true');

    const tLogo = setTimeout(() => setLogoPhase(true), 3500);
    const tEnd = setTimeout(() => setShowSplash(false), 5500);

    return () => {
      clearTimeout(tLogo);
      clearTimeout(tEnd);
    };
  }, [showSplash]);

  // High-Performance DNA -> Heartbeat Morphing System
  useEffect(() => {
    if (!showSplash) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    const isMobile = width < 768;
    const numParticles = isMobile ? 1500 : 4000;
    const particles: any[] = [];
    
    // Math helpers for DNA and Heartbeat
    const dnaRadiusX = isMobile ? 80 : 150;
    
    for (let i = 0; i < numParticles; i++) {
      // Random starting positions far away
      particles.push({
        x: (Math.random() - 0.5) * width * 3 + width / 2,
        y: (Math.random() - 0.5) * height * 3 + height / 2,
        baseX: 0,
        baseY: 0,
        color: i % 2 === 0 ? '#22d3ee' : '#a855f7',
        size: Math.random() * 1.5 + 0.5,
        phaseOffset: Math.random() * Math.PI * 2, // Used for DNA positioning
        layer: Math.random(), // 0 to 1 along the DNA strand
        strand: i % 2, // 0 or 1 for double helix
        vx: 0,
        vy: 0,
        exploded: false,
        currentSize: 0
      });
    }

    let animationId: number;
    let startTime = Date.now();

    const render = () => {
      const elapsed = (Date.now() - startTime) / 1000; // in seconds

      // Dark trail effect for smooth motion blur
      ctx.fillStyle = 'rgba(2, 0, 8, 0.2)';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      
      const phase = elapsed < 2 ? 'dna' : elapsed < 3.5 ? 'heartbeat' : 'explode';
      
      // Global rotation for DNA
      const globalRot = elapsed * 1.5;

      for (let i = 0; i < numParticles; i++) {
        const p = particles[i];
        
        let targetX = p.x;
        let targetY = p.y;
        let speed = 0.08;

        if (phase === 'dna') {
          // Phase 1: DNA Helix (Rotated 90 degrees to be horizontal)
          const xPos = (p.layer - 0.5) * (isMobile ? width * 0.8 : width * 0.6); // Spread horizontally
          const strandOffset = p.strand === 0 ? 0 : Math.PI;
          
          // Helix math: y = sin(x + time), z = cos(x + time)
          // Speed up the rotation slightly for more visual impact
          const angle = p.layer * Math.PI * 6 + (elapsed * 2.5) + strandOffset; 
          const yPos = Math.sin(angle) * dnaRadiusX;
          const zPos = Math.cos(angle) * dnaRadiusX;
          
          // Add 3D perspective sizing based on Z
          const scale = (zPos + dnaRadiusX * 2) / (dnaRadiusX * 3);
          p.currentSize = p.size * scale * 2;
          
          targetX = cx + xPos;
          targetY = cy + yPos;
          speed = 0.12; // Smoothly drift into place
          
          // Add connecting rungs occasionally
          if (i % 40 === 0) {
             p.color = '#ffffff';
          } else {
             p.color = p.strand === 0 ? '#22d3ee' : '#a855f7';
          }

        } else if (phase === 'heartbeat') {
          // Phase 2: Heartbeat Line (Static clear shape)
          const span = isMobile ? width * 0.9 : width * 0.6;
          const localX = (p.layer - 0.5) * span;
          targetX = cx + localX;
          
          // Heartbeat math (Static QRS complex in center)
          let yOffset = 0;
          
          if (localX > -60 && localX <= -20) {
             // Flat to Q dip
             yOffset = ((localX + 60) / 40) * 30; // 0 to 30
          } else if (localX > -20 && localX <= 0) {
             // Q dip to R spike
             yOffset = 30 - ((localX + 20) / 20) * 180; // 30 to -150
          } else if (localX > 0 && localX <= 20) {
             // R spike to S dip
             yOffset = -150 + (localX / 20) * 200; // -150 to 50
          } else if (localX > 20 && localX <= 60) {
             // S dip back to flat
             yOffset = 50 - ((localX - 20) / 40) * 50; // 50 to 0
          } else if (localX > 80 && localX <= 140) {
             // T wave
             yOffset = -40 * Math.sin(((localX - 80) / 60) * Math.PI);
          }
          
          // Add a sweeping highlight pulse across the heartbeat
          const pulsePosition = ((elapsed - 2) / 1.5) * span - span/2; 
          const distToPulse = Math.abs(localX - pulsePosition);
          
          if (distToPulse < (isMobile ? 30 : 60)) {
             p.color = '#ffffff';
             p.currentSize = p.size * 3;
          } else {
             // Dimmer standard color
             p.color = p.strand === 0 ? '#0891b2' : '#7e22ce'; 
             p.currentSize = p.size;
          }
          
          targetY = cy + yOffset + (Math.random()-0.5)*3; // minimal fuzz for clean line
          speed = 0.08; // Slower speed = much smoother, cinematic morph from DNA

        } else {
          // Phase 3: Explode / Disperse
          if (!p.exploded) {
            // Explode outwards from their current heartbeat position
            const dx = p.x - cx;
            const dy = p.y - cy;
            const dist = Math.sqrt(dx*dx + dy*dy) || 1;
            
            p.vx = (dx / dist) * (Math.random() * 40 + 20);
            p.vy = (dy / dist) * (Math.random() * 40 + 20);
            p.exploded = true;
          }
          
          targetX = p.x + p.vx;
          targetY = p.y + p.vy;
          
          // Add friction
          p.vx *= 0.95;
          p.vy *= 0.95;
          
          speed = 1; // Direct physics
          p.currentSize *= 0.93; // Shrink away fast
        }

        // Apply easing to target
        p.x += (targetX - p.x) * speed;
        p.y += (targetY - p.y) * speed;

        // Draw particle
        if (p.currentSize > 0.1) {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.currentSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [showSplash]);

  return (
    <>
      {/* ═══════ CINEMATIC SPLASH SCREEN ═══════ */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="cinematic-splash"
            exit={{ opacity: 0, filter: "blur(20px)" }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[200] bg-[#020008] flex items-center justify-center overflow-hidden"
          >
            {/* The Morphing Canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10 pointer-events-none mix-blend-screen" />

            {/* Final Logo Reveal (Syncs with Explode Phase) */}
            <AnimatePresence>
              {logoPhase && (
                <motion.div
                  key="reveal"
                  initial={{ opacity: 0, scale: 0.5, filter: "blur(20px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 1, type: "spring", bounce: 0.4 }}
                  className="relative z-20 flex flex-col items-center justify-center"
                >
                  <div className="w-24 h-24 md:w-32 md:h-32 mb-6 rounded-3xl bg-black border border-cyan-400/40 flex items-center justify-center shadow-[0_0_60px_rgba(34,211,238,0.3)] relative overflow-hidden">
                    <Activity className="w-12 h-12 md:w-16 md:h-16 text-cyan-400 filter drop-shadow-[0_0_20px_rgba(34,211,238,1)] relative z-10" />
                  </div>

                  <h1 className="text-4xl md:text-6xl font-black tracking-[0.25em] text-white flex items-center justify-center uppercase mb-2">
                    Hospital<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">OS</span>
                  </h1>
                  
                  <p className="text-xs md:text-sm text-cyan-200/60 tracking-[0.4em] font-medium uppercase mt-2 md:mt-4 text-center">
                    Smarter. Faster. Better Care.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ ACTUAL LOGIN PAGE ═══════ */}
    {!showSplash && (
    <div className="min-h-screen bg-background relative flex items-center justify-center overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.2, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-primary/20 blur-[120px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.1, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
          className="absolute top-[40%] -right-[20%] w-[60vw] h-[60vw] rounded-full bg-blue-500/10 blur-[150px]"
        />
      </div>

      <div className="z-10 w-full max-w-md px-4 py-10">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: showSplash ? 0 : 0 }}
          className="flex flex-col items-center justify-center mb-8"
        >
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-primary/50 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(168,85,247,0.3)] bg-black">
            <img src="/logo.png" alt="Apollo Hospitals" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-black tracking-widest text-foreground flex items-center gap-1" style={{ textTransform: 'uppercase' }}>
            HOSPITAL<span className="text-primary">OS</span>
          </h1>
          <p className="text-muted-foreground mt-2 tracking-wide text-sm" style={{ textTransform: 'uppercase' }}>Enterprise Medical System</p>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card/60 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-8 relative overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {mode === 'login' && (
              <motion.div 
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-foreground mb-1">Welcome back</h2>
                  <p className="text-sm text-muted-foreground">Sign in to your workspace</p>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-destructive animate-pulse" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
                  <div className="space-y-1">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        {...loginReg('email')}
                        type="email" 
                        placeholder="Email address" 
                        className="pl-10 bg-background/50 border-border focus-visible:border-primary/50 text-foreground h-12"
                      />
                    </div>
                    {loginErrors.email && <p className="text-xs text-destructive ml-1">{loginErrors.email.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        {...loginReg('password')}
                        type="password" 
                        placeholder="Password" 
                        className="pl-10 bg-background/50 border-border focus-visible:border-primary/50 text-foreground h-12"
                      />
                    </div>
                    {loginErrors.password && <p className="text-xs text-destructive ml-1">{loginErrors.password.message}</p>}
                  </div>

                  <div className="flex items-center justify-between text-sm pt-2">
                    <button 
                      type="button" 
                      onClick={() => setMode('register')}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Create an account
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setMode('forgot')}
                      className="text-primary hover:text-primary/80 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full mt-2 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold tracking-wide rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SIGN IN'}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-card/60 backdrop-blur-xl text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <div className="flex justify-center w-full">
                    <button 
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="w-full flex items-center justify-center gap-2 bg-background border border-border hover:bg-muted text-foreground py-2.5 rounded-full font-medium transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Continue with Google
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {mode === 'register' && (
              <motion.div 
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-foreground mb-1">Create Account</h2>
                  <p className="text-sm text-muted-foreground">Register as a new user</p>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-destructive animate-pulse" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleRegSubmit(onRegister)} className="space-y-4">
                  
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground ml-1 uppercase tracking-wider">Account Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        type="button"
                        onClick={() => setValue('role', 'user')}
                        className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${selectedRole === 'user' ? 'bg-primary/20 border-primary text-primary' : 'bg-background/50 border-border text-muted-foreground hover:bg-background/80'}`}
                      >
                        User
                      </button>
                      <button 
                        type="button"
                        onClick={() => setValue('role', 'doctor')}
                        className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${selectedRole === 'doctor' ? 'bg-primary/20 border-primary text-primary' : 'bg-background/50 border-border text-muted-foreground hover:bg-background/80'}`}
                      >
                        Doctor
                      </button>
                      <button 
                        type="button"
                        onClick={() => setValue('role', 'receptionist')}
                        className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${selectedRole === 'receptionist' ? 'bg-primary/20 border-primary text-primary' : 'bg-background/50 border-border text-muted-foreground hover:bg-background/80'}`}
                      >
                        Reception
                      </button>
                      <button 
                        type="button"
                        onClick={() => setValue('role', 'admin')}
                        className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${selectedRole === 'admin' ? 'bg-primary/20 border-primary text-primary' : 'bg-background/50 border-border text-muted-foreground hover:bg-background/80'}`}
                      >
                        Admin
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        {...regReg('name')}
                        type="text" 
                        placeholder={selectedRole === 'doctor' ? "Dr. Full Name" : "Full Name"}
                        className="pl-10 bg-background/50 border-border focus-visible:border-primary/50 text-foreground h-12"
                      />
                    </div>
                    {regErrors.name && <p className="text-xs text-destructive ml-1">{regErrors.name.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        {...regReg('email')}
                        type="email" 
                        placeholder="Email address" 
                        className="pl-10 bg-background/50 border-border focus-visible:border-primary/50 text-foreground h-12"
                      />
                    </div>
                    {regErrors.email && <p className="text-xs text-destructive ml-1">{regErrors.email.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        {...regReg('password')}
                        type="password" 
                        placeholder="Password" 
                        className="pl-10 bg-background/50 border-border focus-visible:border-primary/50 text-foreground h-12"
                      />
                    </div>
                    {regErrors.password && <p className="text-xs text-destructive ml-1">{regErrors.password.message}</p>}
                  </div>

                  {selectedRole === 'doctor' && (
                    <div className="space-y-3">
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          {...regReg('department')}
                          type="text" 
                          placeholder="Department (e.g. Cardiology)" 
                          className="pl-10 bg-background/50 border-border focus-visible:border-primary/50 text-foreground h-12"
                        />
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">$</span>
                        <Input 
                          {...regReg('consultationFee', { valueAsNumber: true })}
                          type="number" 
                          placeholder="Consultation Fee (e.g. 50)" 
                          className="pl-10 bg-background/50 border-border focus-visible:border-primary/50 text-foreground h-12"
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold tracking-wide rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'CREATE ACCOUNT'}
                    </Button>
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={() => setMode('login')}
                    className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors pt-2"
                  >
                    Already have an account? Sign in
                  </button>
                </form>
              </motion.div>
            )}

            {mode === 'forgot' && (
              <motion.div 
                key="forgot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-foreground mb-1">Reset Password</h2>
                  <p className="text-sm text-muted-foreground">Enter your email to receive an OTP.</p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      type="email" 
                      placeholder="Email address" 
                      className="pl-10 bg-background/50 border-border focus-visible:border-primary/50 text-foreground h-12"
                    />
                  </div>

                  <Button 
                    type="button"
                    onClick={() => {
                      setTimeout(() => setMode('login'), 1000);
                    }}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  >
                    Send Recovery Code
                  </Button>

                  <button 
                    onClick={() => setMode('login')}
                    className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {showRoleModal && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card border border-border shadow-2xl rounded-2xl p-6 w-full max-w-sm"
              >
                <h3 className="text-xl font-bold text-foreground mb-2">Complete Registration</h3>
                <p className="text-sm text-muted-foreground mb-6">We just need to know your role to finish setting up your account.</p>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground ml-1 uppercase tracking-wider">Full Name</label>
                    <Input 
                      {...regReg('name')}
                      className="bg-background/50 h-10 border-border focus:ring-primary/20"
                      placeholder="Your full name"
                    />
                    {regErrors.name && <p className="text-xs text-destructive ml-1">{regErrors.name.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground ml-1 uppercase tracking-wider">Account Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['user', 'doctor', 'receptionist', 'admin'].map((role) => (
                        <button 
                          key={role}
                          type="button"
                          onClick={() => setValue('role', role as any)}
                          className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors capitalize ${selectedRole === role ? 'bg-primary/20 border-primary text-primary' : 'bg-background/50 border-border text-muted-foreground hover:bg-background/80'}`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedRole === 'doctor' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground ml-1 uppercase tracking-wider">Department</label>
                        <Input 
                          {...regReg('department')}
                          placeholder="e.g. Cardiology, Radiology, etc."
                          className="bg-background/50 h-10 border-border focus:ring-primary/20"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground ml-1 uppercase tracking-wider">Specialization</label>
                        <Input 
                          {...regReg('specialization')}
                          placeholder="e.g. Heart Surgeon"
                          className="bg-background/50 h-10 border-border focus:ring-primary/20"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground ml-1 uppercase tracking-wider">Experience (Yrs)</label>
                          <Input 
                            type="number"
                            {...regReg('experienceYears', { valueAsNumber: true })}
                            placeholder="e.g. 10"
                            className="bg-background/50 h-10 border-border focus:ring-primary/20"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground ml-1 uppercase tracking-wider">Fee ($)</label>
                          <Input 
                            type="number"
                            {...regReg('consultationFee', { valueAsNumber: true })}
                            placeholder="e.g. 150"
                            className="bg-background/50 h-10 border-border focus:ring-primary/20"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <Button 
                    onClick={handleCompleteGoogleRegistration} 
                    disabled={isLoading}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Setup'}
                  </Button>
                  <button 
                    onClick={() => { setShowRoleModal(false); setGoogleUser(null); }}
                    className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>



      </div>
    </div>
    )}
    </>
  );
}
