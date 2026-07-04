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
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['user', 'doctor', 'receptionist', 'admin'] as const),
  department: z.string().optional(),
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
          name: data.name,
          email: data.email,
          phone: '',
          department: data.department || 'General',
          specialization: 'General Practice',
          experienceYears: 0,
          consultationFee: 100,
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

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    try {
      setIsLoading(true);
      setError(null);
      const decoded: any = jwtDecode(credentialResponse.credential);
      const { email, name, sub: googleId } = decoded;

      // Check if user exists in our local simulated store
      const usersData = localStorage.getItem('hospitalos-auth-v2');
      const existingUsers = usersData ? JSON.parse(usersData).state.users : [];
      const existingUser = existingUsers.find((u: any) => u.email === email);

      if (existingUser) {
        // User exists, log them in
        const { user, token } = await authService.login(email, existingUser.password);
        setAuth(user, token);
        redirectUser(user.role);
      } else {
        // User does not exist, ask for role to complete registration
        setGoogleUser({ email, name, googleId });
        setShowRoleModal(true);
      }
    } catch (err) {
      setError("Google authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteGoogleRegistration = async () => {
    if (!googleUser || !selectedRole) return;
    const mockPassword = `google_${googleUser.googleId}`;
    await onRegister({
      name: googleUser.name,
      email: googleUser.email,
      password: mockPassword,
      role: selectedRole as Role,
      department: ''
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

  return (
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
          className="flex flex-col items-center justify-center mb-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/50 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
            <Activity className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-black tracking-widest text-foreground flex items-center gap-1">
            HOSPITAL<span className="text-primary">OS</span>
          </h1>
          <p className="text-muted-foreground mt-2 tracking-wide text-sm uppercase">ENTERPRISE MEDICAL SYSTEM</p>
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
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => setError('Google Login Failed')}
                      useOneTap
                      theme="filled_black"
                      shape="pill"
                      width="100%"
                    />
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
  );
}
