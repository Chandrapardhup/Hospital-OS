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
  phone: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  role: z.enum(['admin', 'doctor', 'user', 'receptionist', 'nurse', 'laboratory', 'pharmacy'] as const),
  department: z.string().optional(),
  specialization: z.string().optional(),
  experienceYears: z.number().optional(),
  consultationFee: z.number().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

// 🚀 THE ULTIMATE PREMIUM SAAS HERO ANIMATION (Using provided animation.mp4)
const PremiumHeroAnimation = ({ onBootComplete, isBooted }: { onBootComplete: () => void, isBooted: boolean }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile(); // Check on mount
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // 1.5 second "small opening animation" delay to sync perfectly with the video's turning movement
    const t = setTimeout(onBootComplete, 1500);
    return () => clearTimeout(t);
  }, [onBootComplete]);

  return (
    <div className="absolute inset-0 w-full h-full bg-[#081423] z-0 overflow-hidden pointer-events-none flex items-center justify-center">
      <motion.video 
        key={isMobile ? 'mobile-vid' : 'desktop-vid'} // Force re-render when switching device size
        src={isMobile ? "/animation2.mp4" : "/animation.mp4"}
        autoPlay
        muted
        loop
        playsInline
        className="absolute w-full h-full object-cover"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} // Apple-quality easing
      />
    </div>
  );
};


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
          phone: data.phone,
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
      phone: '0000000000', // Default for Google, should ideally prompt
      role: 'user',
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

  const [isBooted, setIsBooted] = useState(false);

  // Professional Enterprise Startup Animation removed; PremiumHeroAnimation handles it internally

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#030812] overflow-hidden font-sans">
      
      {/* 🌟 Premium Hospital OS Logo - Top Left */}
      <motion.div 
        initial={{ opacity: 0, y: -20, filter: 'blur(10px)' }} 
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} 
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-8 left-8 lg:top-12 lg:left-12 z-50 flex items-center"
      >
        <img src="/logo.png" alt="Hospital OS Logo" className="h-12 lg:h-16 w-auto drop-shadow-2xl object-contain" />
      </motion.div>

      {/* 🚀 ULTIMATE HERO ANIMATION (Handles the 3s intro & persistent interactive background) */}
      <PremiumHeroAnimation onBootComplete={() => setIsBooted(true)} isBooted={isBooted} />

      {/* Main Login Content Overlay - Fades in elegantly after boot sequence */}
      <AnimatePresence>
        {isBooted && (
          <motion.div 
            initial={{ opacity: 0, x: -50, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }} // Apple cubic-bezier
            className="relative z-10 w-full max-w-[1400px] mx-auto p-6 flex flex-col lg:flex-row items-center lg:justify-start lg:pl-20"
          >
            {/* The Login Form Card */}
            <div className="w-full max-w-md bg-[#061022]/80 backdrop-blur-3xl border border-sky-400/20 rounded-[2.5rem] p-8 shadow-[0_0_80px_rgba(14,165,233,0.15)] relative overflow-hidden group">

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
                    className="w-full mt-2 h-12 bg-blue-600 hover:bg-blue-500 text-white font-semibold tracking-wide rounded-xl shadow-lg transition-all"
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
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        {...regReg('name')}
                        type="text" 
                        placeholder="Full Name"
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
                        {...regReg('phone')}
                        type="tel" 
                        placeholder="Phone Number (10 digits)" 
                        className="pl-10 bg-background/50 border-border focus-visible:border-primary/50 text-foreground h-12"
                      />
                    </div>
                    {regErrors.phone && <p className="text-xs text-destructive ml-1">{regErrors.phone.message}</p>}
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


                  <div className="pt-2">
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold tracking-wide rounded-xl shadow-sm transition-all"
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
  );
}
