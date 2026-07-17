import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Languages, Mic, MicOff, PhoneOff, Video, Volume2, CheckCircle2, FileText, Loader2, Clock, AlertTriangle, Calendar, MessageSquare } from 'lucide-react';
import { AIService } from '../../services/AIService';
import { useHospitalStore } from '../../store/useHospitalStore';
import { useAuthStore } from '../../store/useAuthStore';

// Type definitions for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function AIConsultation() {
  const [language, setLanguage] = useState<'English' | 'Telugu' | 'Hindi'>('English');
  const [isCallActive, setIsCallActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<{ advice: string, prescription: string } | null>(null);
  const [hasMicSupport, setHasMicSupport] = useState(true);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  
  // Quit Confirmation Modal
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  
  const user = useAuthStore(state => state.user);
  const { patients, addInvoice, addAiConsultation, aiConsultations } = useHospitalStore();
  
  const recognitionRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const transcriptBuffer = useRef('');
  
  // Track transcript history for this session
  const sessionHistory = useRef<{speaker: 'User'|'AI', text: string, time: string}[]>([]);

  // Pre-load voices for better language support
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Timer logic separated so it doesn't get cleared by other effects
  useEffect(() => {
    if (isCallActive) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            endCall();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCallActive]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          let current = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          setTranscript(current);
          transcriptBuffer.current = current;
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
          if (transcriptBuffer.current.trim() && !isSpeaking) {
             const userText = transcriptBuffer.current;
             sessionHistory.current.push({ speaker: 'User', text: userText, time: new Date().toISOString() });
             handleConsultation(userText);
          } else if (isCallActive && !isSpeaking) {
             try { recognitionRef.current.start(); setIsListening(true); } catch(e) {}
          }
        };
        
        recognitionRef.current.onerror = (e: any) => {
          console.error("Speech Error:", e);
          setIsListening(false);
          if (e.error !== 'no-speech' && e.error !== 'aborted') {
             setHasMicSupport(false);
          }
        };
      } catch (e) {
        setHasMicSupport(false);
      }
    } else {
      setHasMicSupport(false);
    }
    
    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCallActive, isSpeaking]); 

  useEffect(() => {
    if (recognitionRef.current) {
      if (language === 'English') recognitionRef.current.lang = 'en-US';
      if (language === 'Telugu') recognitionRef.current.lang = 'te-IN';
      if (language === 'Hindi') recognitionRef.current.lang = 'hi-IN';
    }
  }, [language]);

  const toggleListen = () => {
    if (!hasMicSupport) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      transcriptBuffer.current = '';
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch(e) {}
    }
  };

  const getVoiceForLanguage = (lang: string) => {
    const voices = window.speechSynthesis.getVoices();
    // Prefer male voices to match the Male Doctor Avatar
    const isMale = (v: any) => {
      const name = v.name.toLowerCase();
      return name.includes('male') || name.includes('david') || name.includes('mark') || name.includes('guy') || name.includes('andrew') || name.includes('george') || name.includes('brian');
    };
    
    if (lang === 'Telugu') return voices.find(v => v.lang.includes('te') && isMale(v)) || voices.find(v => v.lang.includes('te') || v.lang.includes('IN')) || null;
    if (lang === 'Hindi') return voices.find(v => v.lang.includes('hi') && isMale(v)) || voices.find(v => v.lang.includes('hi') || v.lang.includes('IN')) || null;
    
    return voices.find(v => (v.lang.includes('en-US') || v.lang.includes('en-GB')) && isMale(v)) || voices.find(v => v.lang.includes('en-US')) || voices[0];
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window) || !isCallActive) return;
    
    // Safety abort in case something was playing
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getVoiceForLanguage(language);
    if (voice) utterance.voice = voice;
    
    if (language === 'English') utterance.lang = 'en-US';
    if (language === 'Telugu') utterance.lang = 'te-IN';
    if (language === 'Hindi') utterance.lang = 'hi-IN';
    
    if (language === 'Telugu' || language === 'Hindi') {
      utterance.rate = 0.85;
      utterance.pitch = 0.9; // Lower pitch for male sounding
    } else {
      utterance.pitch = 0.9;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      setTranscript('');
      transcriptBuffer.current = '';
      if (isCallActive && hasMicSupport) {
        setTimeout(() => {
          try { recognitionRef.current?.start(); setIsListening(true); } catch(e) {}
        }, 500);
      }
    };
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const handleConsultation = async (query: string) => {
    const finalQuery = query.trim();
    if (!finalQuery) return;
    
    if (isListening) {
       recognitionRef.current?.stop();
       setIsListening(false);
    }
    setIsSpeaking(true); 
    
    const systemPrompt = `You are a virtual AI Doctor for "Apollo Hospitals", a premium, state-of-the-art medical platform.
The user is speaking to you about their health via live voice chat.
1. Respond ONLY in ${language}. 
2. If ${language} is Telugu or Hindi, use highly natural, native-sounding idioms and polite clinical phrasing. Do NOT use literal translations. Speak like a real local doctor.
3. Keep responses brief (1-3 sentences) so they sound natural when spoken aloud. Ask follow-up questions if needed.
4. The consultation fee is exactly ₹200 (this is an automated system charge, do not mention it unless asked).
5. If they describe symptoms that need medication, provide a standard safe prescription for mild symptoms.
6. Format output strictly as:
ADVICE: <your advice>
PRESCRIPTION: <your prescription (or write "None")>`;

    try {
      const response = await AIService.getAIResponse(systemPrompt, finalQuery);
      
      const adviceMatch = response.match(/ADVICE:([\s\S]*?)PRESCRIPTION:/i);
      const rxMatch = response.match(/PRESCRIPTION:([\s\S]*)/i);
      
      const advice = adviceMatch ? adviceMatch[1].trim() : response.replace(/PRESCRIPTION:[\s\S]*/i, '').trim();
      const prescription = rxMatch ? rxMatch[1].trim() : "None";
      
      sessionHistory.current.push({ speaker: 'AI', text: advice, time: new Date().toISOString() });
      
      setResult({ advice, prescription: prescription !== 'None' ? prescription : '' });
      speakText(advice);
      
    } catch (error) {
      console.error(error);
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    if (localVideoRef.current && mediaStreamRef.current) {
      if (localVideoRef.current.srcObject !== mediaStreamRef.current) {
        localVideoRef.current.srcObject = mediaStreamRef.current;
        localVideoRef.current.play().catch(() => {});
      }
    }
  });

  const startCall = async () => {
    setIsCallActive(true);
    setResult(null);
    setTranscript('');
    transcriptBuffer.current = '';
    setTimeLeft(600); 
    setShowQuitConfirm(false);
    sessionHistory.current = [];
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }
      
      const greetings = {
        English: "Hello! I am your AI doctor. What brings you here today?",
        Telugu: "నమస్కారం! నేను మీ ఏఐ డాక్టర్‌ని. ఈ రోజు మీకు ఎలా సహాయం చేయగలను?",
        Hindi: "नमस्ते! मैं आपका एआई डॉक्टर हूँ। आज मैं आपकी कैसे मदद कर सकता हूँ?"
      };
      
      setTimeout(() => {
         const initialGreeting = greetings[language];
         sessionHistory.current.push({ speaker: 'AI', text: initialGreeting, time: new Date().toISOString() });
         speakText(initialGreeting);
      }, 2500); // Give WebRTC a moment to connect
      
    } catch (error) {
      console.error("Camera access denied or WebRTC failed", error);
    }
  };

  const attemptEndCall = () => {
    setShowQuitConfirm(true);
  };

  const cancelEndCall = () => {
    setShowQuitConfirm(false);
  };

  const endCall = () => {
    setIsCallActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    setShowQuitConfirm(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (recognitionRef.current) recognitionRef.current.stop();
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    // Hard kill any ongoing speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const currentPatientId = patients.find(p => p.email === user?.email)?.id || user?.id || 'pat_unknown';
    
    const invoiceId = `inv_${Date.now()}`;

    // Save transcript to store
    if (sessionHistory.current.length > 0) {
      addAiConsultation({
        id: `aic_${Date.now()}`,
        patientId: currentPatientId,
        invoiceId,
        date: new Date().toISOString(),
        language,
        transcript: [...sessionHistory.current],
        duration: 600 - timeLeft
      });
    }

    // Generate Invoice ONCE for the 10 min session after call ends
    addInvoice({
      id: invoiceId,
      patientId: currentPatientId,
      amount: 200,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
      items: [{ description: 'AI Call', cost: 200 }]
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);

  const currentPatientId = patients.find(p => p.email === user?.email)?.id || user?.id || 'pat_unknown';
  const patientConsultations = aiConsultations?.filter(c => c.patientId === currentPatientId) || [];

  if (!isCallActive && !hasSelectedLanguage) {
    return (
      <div className="flex flex-col gap-8">
        <div className="bg-[#0a0a0a] border border-border/50 rounded-2xl p-8 backdrop-blur-md relative overflow-hidden group h-[400px] flex flex-col items-center justify-center text-center shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
          <Video className="w-16 h-16 text-primary mb-6 animate-pulse" />
          <h2 className="text-3xl font-bold text-white mb-2">AI Live Companion</h2>
          <p className="text-white/60 mb-8 max-w-md">Select your preferred language to begin the 10-minute live voice consultation. (₹200 Fee)</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-lg">
            <button onClick={() => { setLanguage('English'); setHasSelectedLanguage(true); }} className="py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/10 transition-all text-lg">English</button>
            <button onClick={() => { setLanguage('Telugu'); setHasSelectedLanguage(true); }} className="py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/10 transition-all text-lg">Telugu</button>
            <button onClick={() => { setLanguage('Hindi'); setHasSelectedLanguage(true); }} className="py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/10 transition-all text-lg">Hindi</button>
          </div>
        </div>

        {/* Past Consultations List */}
        {patientConsultations.length > 0 && (
          <div className="bg-card border border-border/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Past AI Consultations</h3>
            <div className="space-y-4">
              {patientConsultations.map((consult) => (
                <div key={consult.id} className="bg-background border border-border/50 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {new Date(consult.date).toLocaleDateString()} at {new Date(consult.date).toLocaleTimeString()}
                    </div>
                    <span className="text-xs font-bold px-2 py-1 bg-primary/10 text-primary rounded-md">{consult.language}</span>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {consult.transcript.map((line, i) => (
                      <div key={i} className={`flex flex-col ${line.speaker === 'User' ? 'items-end' : 'items-start'}`}>
                        <span className={`text-[10px] font-bold uppercase mb-1 ${line.speaker === 'User' ? 'text-blue-500' : 'text-primary'}`}>{line.speaker}</span>
                        <div className={`p-3 rounded-xl max-w-[85%] text-sm ${line.speaker === 'User' ? 'bg-blue-500/10 text-blue-100 border border-blue-500/20 rounded-tr-none' : 'bg-primary/10 text-primary-100 border border-primary/20 rounded-tl-none'}`}>
                          {line.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!isCallActive && hasSelectedLanguage) {
    return (
      <div className="bg-gradient-to-br from-primary/20 via-background to-background border border-primary/30 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group h-[550px] flex flex-col justify-center items-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 group-hover:bg-primary/20 transition-all"></div>
        <h3 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-2">
          <Video className="w-6 h-6 text-primary animate-pulse" />
          Ready for Consultation ({language})
        </h3>
        <p className="text-muted-foreground mb-8">10-minute continuous voice session. Fee: ₹200.</p>
        <button 
          onClick={startCall}
          className="w-full max-w-md py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] transition-all flex items-center justify-center gap-3 text-lg"
        >
          <Video className="w-6 h-6" /> Start 10-Min Live Session
        </button>
        <button onClick={() => setHasSelectedLanguage(false)} className="mt-4 text-sm text-primary underline">Change Language</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black text-white flex flex-col overflow-hidden animate-in fade-in duration-500">
      <style>{`
        @keyframes waveform {
          0%, 100% { height: 15%; }
          50% { height: 100%; }
        }
        .animate-wave {
          animation: waveform 0.8s ease-in-out infinite;
        }
      `}</style>
      
      {/* Top Header / Status bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-6 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
            <Volume2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{language} AI Consultation</h3>
            <p className="text-sm text-emerald-400 font-medium">
              {isSpeaking ? 'Doctor is speaking...' : isListening ? 'Listening...' : 'Active Call'}
            </p>
          </div>
        </div>
        
        {/* Real-time Countdown Timer */}
        <div className="flex items-center gap-2 bg-red-500/20 px-4 py-2 rounded-full border border-red-500/30">
          <Clock className="w-5 h-5 text-red-400" />
          <span className="font-mono text-xl font-bold text-red-400 tracking-wider">
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Main Video Area (Realistic Male Avatar Image) */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-[#050505]">
        
        {/* Realistic Video Avatar */}
        <div className={`relative w-full h-full flex items-center justify-center bg-black transition-all duration-700`}>
           <video 
             src="https://assets.mixkit.co/videos/preview/mixkit-male-doctor-talking-on-a-video-call-42031-large.mp4" 
             className="w-full h-full object-cover"
             loop
             muted
             playsInline
             ref={(el) => {
               if (el) {
                 if (isSpeaking) {
                   el.playbackRate = 1.0;
                   el.play().catch(()=>{});
                 } else {
                   // When not speaking, drastically slow down to simulate idle listening/breathing
                   el.playbackRate = 0.1;
                   if (el.paused) el.play().catch(()=>{});
                 }
               }
             }}
           />
           {/* Professional overlay to blend the video */}
           <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-background/50 mix-blend-multiply pointer-events-none"></div>
        </div>

        {/* Audio Waveform overlay when speaking */}
        {isSpeaking && (
           <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 flex items-end justify-center gap-1.5 h-16 z-20">
              {[...Array(6)].map((_, i) => (
                 <div 
                   key={i} 
                   className="w-3 bg-primary rounded-full animate-wave shadow-[0_0_10px_rgba(168,85,247,0.8)]" 
                   style={{ height: '20%', animationDelay: `${i * 0.15}s` }}
                 ></div>
              ))}
           </div>
        )}
        
        {/* Thinking Overlay */}
        {!isSpeaking && !isListening && !showQuitConfirm && (
           <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 backdrop-blur-sm">
             <div className="flex flex-col items-center gap-4">
               <Loader2 className="w-12 h-12 text-primary animate-spin" />
               <p className="text-xl font-medium tracking-wide">Processing symptoms...</p>
             </div>
           </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>

        {/* User Local Camera View */}
        <div className="absolute bottom-6 right-6 w-24 h-32 md:w-36 md:h-48 bg-black/80 border-2 border-primary/50 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.3)] z-20 flex items-center justify-center">
          <video 
            ref={localVideoRef} 
            className="w-full h-full object-cover scale-x-[-1]" 
            autoPlay 
            muted 
            playsInline 
          />
          {!mediaStreamRef.current && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 text-xs">
                <Video className="w-6 h-6 mb-2 opacity-50" />
                Starting Cam...
             </div>
          )}
        </div>

        {/* Live Subtitles overlay */}
        <div className="absolute bottom-6 inset-x-6 mr-36 md:mr-48 z-20">
          {(transcript || result?.advice) && (
            <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4 text-white">
              {isSpeaking ? (
                <p className="text-sm md:text-base font-medium drop-shadow-md whitespace-pre-wrap text-primary-100">{result?.advice || "..."}</p>
              ) : (
                <p className="text-sm md:text-base italic text-white/80">"{transcript}" <span className="animate-pulse">|</span></p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Controls Footer */}
      <div className="bg-black/90 backdrop-blur-xl border-t border-white/10 p-4 md:p-6 flex justify-center items-center gap-8 z-30">
        
        {!hasMicSupport && (
          <div className="absolute top-[-40px] text-xs text-red-400 bg-black/80 px-4 py-2 rounded-full border border-red-500/30">
            Microphone access is blocked or unsupported in this browser.
          </div>
        )}

        <div className="flex flex-col items-center gap-2">
          <button 
            onClick={toggleListen}
            disabled={!hasMicSupport || isSpeaking || showQuitConfirm}
            className={`p-5 rounded-full transition-all flex items-center justify-center ${isListening ? 'bg-primary text-white shadow-[0_0_25px_rgba(168,85,247,0.6)] scale-110' : 'bg-white/10 text-white hover:bg-white/20 disabled:opacity-50'}`}
          >
            {isSpeaking ? (
              <Volume2 className="w-6 h-6 animate-pulse text-emerald-400" />
            ) : isListening ? (
              <Mic className="w-6 h-6 animate-bounce" />
            ) : (
              <MicOff className="w-6 h-6" />
            )}
          </button>
          <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold">
            {isSpeaking ? 'AI Speaking' : isListening ? 'Listening...' : 'Muted'}
          </span>
        </div>

        <button 
          onClick={attemptEndCall}
          className="p-5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center justify-center"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>

      {/* Quit Confirmation Modal Overlay */}
      {showQuitConfirm && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-[10000] flex items-center justify-center animate-in fade-in">
          <div className="bg-[#111] border border-white/10 p-8 rounded-2xl max-w-md w-full mx-4 shadow-2xl text-center">
             <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
             <h3 className="text-2xl font-bold text-white mb-2">End Consultation?</h3>
             <p className="text-white/60 mb-8">Are you sure you want to end this live session? Your ₹200 fee will be finalized and the transcript will be saved.</p>
             <div className="flex gap-4 w-full">
                <button onClick={cancelEndCall} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all">Cancel</button>
                <button onClick={endCall} className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-bold text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all">Yes, Hang Up</button>
             </div>
          </div>
        </div>
      )}

      {/* Prescription Overlay (if generated) */}
      {result?.prescription && !isSpeaking && !showQuitConfirm && (
        <div className="absolute top-24 left-6 right-6 md:right-auto md:w-[400px] bg-card/95 backdrop-blur-xl border border-border rounded-2xl p-5 shadow-2xl z-30 animate-in fade-in slide-in-from-left-8">
          <div className="flex items-center gap-2 mb-3 border-b border-border pb-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">AI Prescription Suggestion</h4>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Preliminary Guidance Only</p>
            </div>
          </div>
          <p className="text-sm font-mono whitespace-pre-wrap text-foreground/90 mb-4 bg-background/50 p-3 rounded-xl border border-border/50">{result.prescription}</p>
          
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-xs text-destructive/90 leading-relaxed">
              <strong>Medical Disclaimer:</strong> This is an AI-generated preliminary suggestion. It does not replace professional medical advice. You must consult a licensed physician before taking any medication.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
