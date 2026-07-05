import React, { useState } from 'react';
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
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`
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

  // Netflix-style splash intro
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash once per session
    if (sessionStorage.getItem('hospitalos_splash_shown')) return false;
    return true;
  });

  React.useEffect(() => {
    if (showSplash) {
      sessionStorage.setItem('hospitalos_splash_shown', 'true');
    }
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 5500); // 5.5 seconds total - extremely fast, snappy, cinematic
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* ═══════ NEURAL SILK & DNA MATRIX SPLASH SCREEN ═══════ */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            exit={{ opacity: 0, scale: 1.05, filter: "blur(15px)" }}
            transition={{ duration: 0.6, ease: "easeIn" }}
            className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center overflow-hidden perspective-[1000px]"
          >
            {/* 1. Glossy Silk Waves (0s - 3s) */}
            <div className="absolute inset-0 pointer-events-none opacity-60 mix-blend-screen">
              <motion.div
                initial={{ rotate: -10, y: "100%", opacity: 0 }}
                animate={{ rotate: 5, y: "-150%", opacity: [0, 1, 0] }}
                transition={{ duration: 3, ease: [0.19, 1, 0.22, 1] }}
                className="absolute w-[200%] h-[150%] bg-gradient-to-t from-transparent via-cyan-400/40 to-transparent blur-3xl -left-[50%]"
                style={{ borderRadius: "100% 50% 100% 50%" }}
              />
              <motion.div
                initial={{ rotate: 10, y: "100%", opacity: 0 }}
                animate={{ rotate: -5, y: "-150%", opacity: [0, 1, 0] }}
                transition={{ duration: 3.2, delay: 0.2, ease: [0.19, 1, 0.22, 1] }}
                className="absolute w-[200%] h-[150%] bg-gradient-to-t from-transparent via-purple-500/30 to-transparent blur-[80px] -left-[50%]"
                style={{ borderRadius: "50% 100% 50% 100%" }}
              />
            </div>

            {/* 2. Rapid DNA Particle Helix (0.5s - 3s) */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 0.2], opacity: [0, 1, 0] }}
              transition={{ delay: 0.5, duration: 3, times: [0, 0.6, 1], ease: "easeInOut" }}
              className="absolute z-10 w-full h-full flex items-center justify-center pointer-events-none transform-style-3d"
            >
              {Array.from({ length: 60 }).map((_, i) => (
                <motion.div
                  key={`dna-${i}`}
                  initial={{ 
                    x: Math.sin(i * 0.3) * 60, 
                    y: (i - 30) * 10,
                    z: Math.cos(i * 0.3) * 60,
                    opacity: 0,
                  }}
                  animate={{ 
                    rotateY: 360 * 3, // Spin super fast
                    opacity: [0, 1, 0.8],
                  }}
                  transition={{ duration: 3, ease: "linear" }}
                  className="absolute w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,1)]"
                />
              ))}
              {/* Secondary Strand */}
              {Array.from({ length: 60 }).map((_, i) => (
                <motion.div
                  key={`dna2-${i}`}
                  initial={{ 
                    x: Math.sin(i * 0.3 + Math.PI) * 60, 
                    y: (i - 30) * 10,
                    z: Math.cos(i * 0.3 + Math.PI) * 60,
                    opacity: 0,
                  }}
                  animate={{ 
                    rotateY: 360 * 3, 
                    opacity: [0, 1, 0.8],
                  }}
                  transition={{ duration: 3, ease: "linear" }}
                  className="absolute w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_12px_rgba(168,85,247,1)]"
                />
              ))}
            </motion.div>

            {/* 3. Flash Heartbeat EKG (2s - 3.5s) */}
            <motion.div
              initial={{ opacity: 0, scale: 1.5 }}
              animate={{ opacity: [0, 1, 0], scale: 1 }}
              transition={{ delay: 2, duration: 1.5, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none mix-blend-screen"
            >
              <svg width="800" height="300" viewBox="0 0 800 300">
                <defs>
                  <filter id="ekg-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="10" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <motion.path
                  d="M 0 150 L 300 150 L 340 150 L 370 50 L 400 250 L 430 150 L 800 150"
                  fill="transparent"
                  stroke="#fff"
                  strokeWidth="8"
                  filter="url(#ekg-glow)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                />
              </svg>
            </motion.div>

            {/* 4. Liquid Orb Implosion (3s - 3.5s) */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 15, 0], opacity: [0, 1, 0] }}
              transition={{ delay: 3.2, duration: 0.8, ease: "backIn" }}
              className="absolute z-30 w-32 h-32 bg-cyan-400 rounded-full blur-[40px] mix-blend-screen"
            />

            {/* 5. Ultra-Premium Glassmorphism Logo Reveal (3.8s - 5.5s) */}
            <motion.div
              initial={{ opacity: 0, filter: "blur(30px)", scale: 1.5, rotateX: 45 }}
              animate={{ opacity: 1, filter: "blur(0px)", scale: 1, rotateX: 0 }}
              transition={{ delay: 3.8, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-40 flex flex-col items-center justify-center p-8 md:p-12 rounded-[2.5rem] bg-black/40 border border-white/20 backdrop-blur-3xl shadow-[0_30px_80px_-15px_rgba(0,0,0,0.8),inset_0_2px_20px_rgba(255,255,255,0.15)] overflow-hidden"
            >
              {/* Glossy Diagonal Shine */}
              <motion.div 
                initial={{ x: "-150%", opacity: 0 }}
                animate={{ x: "200%", opacity: [0, 0.6, 0] }}
                transition={{ delay: 4.5, duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-45 pointer-events-none"
              />

              <div className="relative mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 4.2, duration: 0.8, type: "spring", bounce: 0.6 }}
                  className="w-28 h-28 bg-gradient-to-br from-slate-800 to-black rounded-3xl flex items-center justify-center border border-cyan-400/30 shadow-[0_0_50px_rgba(34,211,238,0.4),inset_0_2px_10px_rgba(255,255,255,0.1)] relative overflow-hidden"
                >
                  <img src="/logo.png" alt="HospitalOS" className="w-16 h-16 object-contain relative z-10 filter drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
                </motion.div>
              </div>

              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 4.5, duration: 0.8 }}
                className="text-4xl md:text-5xl font-black tracking-[0.25em] text-white flex items-center justify-center uppercase mb-3"
              >
                Hospital<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">OS</span>
              </motion.h1>
              
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 4.8, duration: 1, ease: "easeOut" }}
                className="h-[1px] bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent w-full"
              />

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 5, duration: 0.8 }}
                className="text-[10px] md:text-xs text-white/60 tracking-[0.6em] font-medium uppercase mt-4 text-center"
              >
                Intelligent Medical Engine
              </motion.p>
            </motion.div>
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
            <img src="/logo.png" alt="HospitalOS" className="w-full h-full object-cover" />
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
                    <div className="space-y-1">
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          {...regReg('department')}
                          type="text" 
                          placeholder="Department (e.g. Cardiology)" 
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
                        <Select onValueChange={(val) => setValue('department', val)}>
                          <SelectTrigger className="bg-background/50 h-10 border-border focus:ring-primary/20">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="Cardiology">Cardiology</SelectItem>
                            <SelectItem value="Neurology">Neurology</SelectItem>
                            <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                            <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                            <SelectItem value="General">General Medicine</SelectItem>
                          </SelectContent>
                        </Select>
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
