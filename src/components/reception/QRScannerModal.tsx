import React, { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { QrCode, X, Search, Loader2, CheckCircle2, AlertTriangle, AlertCircle, Clock, Camera } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useHospitalStore } from '../../store/useHospitalStore';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/useAuthStore';

interface QRScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QRScannerModal({ open, onOpenChange }: QRScannerModalProps) {
  const [manualId, setManualId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader';

  const appointments = useHospitalStore(state => state.appointments);
  const patients = useHospitalStore(state => state.patients);
  const doctors = useHospitalStore(state => state.doctors);
  const updateAppointment = useHospitalStore(state => state.updateAppointment);
  const currentUser = useAuthStore(state => state.user);

  useEffect(() => {
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        setCameras(devices);
        // Default to back camera (usually last in list on mobile)
        setSelectedCamera(devices[devices.length - 1].id);
      }
    }).catch(err => {
      console.error(err);
    });
  }, []);

  useEffect(() => {
    if (open) {
      setManualId('');
      setScanResult(null);
      setValidationError(null);
      setValidationWarning(null);
      setSuccessData(null);
      setCameraError(null);
      if (selectedCamera) {
        startScanner();
      }
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [open, selectedCamera]);

  const startScanner = () => {
    try {
      if (document.getElementById(scannerContainerId) && selectedCamera) {
        setIsScanning(true);
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode(scannerContainerId);
        }
        
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().then(() => startScannerStream());
        } else {
          startScannerStream();
        }
      } else if (!selectedCamera) {
        setCameraError("No camera selected or available.");
      } else {
        setTimeout(startScanner, 100);
      }
    } catch (err: any) {
      console.error(err);
      setCameraError("Unable to access camera. Please ensure you are on HTTPS (if using mobile) and grant permissions.");
      setIsScanning(false);
    }
  };

  const startScannerStream = () => {
    if (!scannerRef.current) return;
    scannerRef.current.start(
      selectedCamera,
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        handleScannedData(decodedText);
        stopScanner();
      },
      (errorMessage) => {
        // Ignore frequent scanning failures
      }
    ).catch(err => {
      setCameraError("Failed to start camera stream. " + (err?.message || ''));
      setIsScanning(false);
    });
  };

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        scannerRef.current.stop().catch(e => console.error(e));
      } catch(e) {}
    }
    setIsScanning(false);
  };

  const handleScannedData = (text: string) => {
    if (text.startsWith('appointment:')) {
      const appId = text.replace('appointment:', '');
      setScanResult(appId);
      validateAppointment(appId);
    } else {
      setValidationError("Invalid QR Code format. This doesn't look like a valid HospitalOS Appointment pass.");
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId) return;
    setScanResult(manualId);
    validateAppointment(manualId);
  };

  const validateAppointment = async (appId: string) => {
    setValidationError(null);
    setValidationWarning(null);
    setIsLoading(true);

    try {
      const appointment = appointments.find(a => a.id === appId);
      if (!appointment) {
        setValidationError(`Appointment with ID ${appId} not found.`);
        setIsLoading(false);
        return;
      }

      const patient = patients.find(p => p.id === appointment.patientId);
      const doctor = doctors.find(d => d.id === appointment.doctorId);

      if (!patient || !doctor) {
        setValidationError("Incomplete appointment records (missing patient or doctor info).");
        setIsLoading(false);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      if (appointment.date !== today) {
        setValidationError(`This appointment is scheduled for ${appointment.date}, not today.`);
        setIsLoading(false);
        return;
      }

      if (appointment.status === 'Cancelled') {
        setValidationError("This appointment was cancelled.");
        setIsLoading(false);
        return;
      }

      if (appointment.status === 'Waiting' || appointment.status === 'In Progress' || appointment.status === 'Completed') {
        setValidationError(`This appointment has already been checked in. Current Status: ${appointment.status}.`);
        setIsLoading(false);
        return;
      }

      // Late arrival detection
      const apptTime = new Date(`${appointment.date}T${appointment.time}`);
      const now = new Date();
      const diffMins = Math.floor((now.getTime() - apptTime.getTime()) / 60000);
      
      if (diffMins > 15) {
        setValidationWarning(`Patient is arriving ${diffMins} minutes late.`);
      }

      // Success payload prep
      setSuccessData({ appointment, patient, doctor });
    } catch (e: any) {
      setValidationError("Error validating appointment: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const performCheckIn = async () => {
    if (!successData) return;
    setIsLoading(true);

    try {
      const { appointment, patient, doctor } = successData;

      // Generate next token for the doctor for today
      const today = new Date().toISOString().split('T')[0];
      const docApptsToday = appointments.filter(a => a.doctorId === doctor.id && a.date === today && a.tokenNumber);
      
      let nextTokenNum = 1;
      if (docApptsToday.length > 0) {
        const tokens = docApptsToday.map(a => {
           const match = (a.tokenNumber || "").match(/\d+/);
           return match ? parseInt(match[0]) : 0;
        });
        nextTokenNum = Math.max(...tokens) + 1;
      }

      const tokenStr = `${doctor.department.substring(0, 2).toUpperCase()}-${nextTokenNum}`;

      // Update Appointment
      await updateAppointment(appointment.id, {
        status: 'Waiting',
        tokenNumber: tokenStr,
      });

      // Audit Logging
      try {
        await supabase.from('qr_scan_logs').insert({
          appointment_id: appointment.id,
          receptionist_id: currentUser?.id || 'unknown',
          patient_id: patient.id,
          scan_time: new Date().toISOString(),
          status: 'SUCCESS',
          token_generated: tokenStr
        });
      } catch (e) {
        console.warn("Could not log to qr_scan_logs table. It might not exist yet.", e);
      }

      toast.success(`Patient successfully checked in. Token ${tokenStr} has been generated.`);
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Failed to check in: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-lg bg-card border border-border shadow-2xl rounded-2xl p-6 z-50 flex flex-col max-h-[90vh]">
          
          <div className="flex items-center justify-between mb-4 shrink-0">
            <Dialog.Title className="text-xl font-bold text-foreground flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" /> QR Check-In
            </Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {!scanResult && !successData && !validationError ? (
              <div className="space-y-6">
                <div className="bg-muted border border-border rounded-xl overflow-hidden relative">
                  <div id={scannerContainerId} className="w-full"></div>
                  {cameras.length > 0 && !isScanning && !cameraError && (
                    <div className="absolute top-4 left-4 right-4 z-20 flex gap-2">
                      <select 
                        value={selectedCamera} 
                        onChange={(e) => setSelectedCamera(e.target.value)}
                        className="flex-1 bg-background border border-border rounded-lg text-xs p-2 focus:outline-none"
                      >
                        {cameras.map(cam => (
                          <option key={cam.id} value={cam.id}>{cam.label || `Camera ${cam.id.substring(0, 5)}`}</option>
                        ))}
                      </select>
                      <button 
                        onClick={startScanner}
                        className="bg-primary text-primary-foreground p-2 rounded-lg flex items-center justify-center"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {cameraError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 text-center p-6 z-10">
                      <AlertTriangle className="w-10 h-10 text-red-500 mb-2" />
                      <p className="text-sm font-bold text-foreground">{cameraError}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="text-xs uppercase tracking-widest font-bold">OR</span>
                  <div className="flex-1 h-px bg-border"></div>
                </div>

                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="Enter Appt ID, UHID, or Phone..." 
                      value={manualId}
                      onChange={(e) => setManualId(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={!manualId}
                    className="px-6 py-3 bg-card border border-border hover:bg-muted text-foreground font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    Search
                  </button>
                </form>
              </div>
            ) : null}

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium">Validating Appointment via Hospital Brain...</p>
              </div>
            )}

            {validationError && !isLoading && (
              <div className="flex flex-col items-center text-center py-8">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Validation Failed</h3>
                <p className="text-muted-foreground max-w-sm mb-6">{validationError}</p>
                <button 
                  onClick={() => {
                    setScanResult(null);
                    setValidationError(null);
                    setSuccessData(null);
                    setManualId('');
                    startScanner();
                  }}
                  className="px-6 py-2.5 bg-card border border-border hover:bg-muted text-foreground font-bold rounded-xl transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {successData && !isLoading && !validationError && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-bold text-emerald-500 text-lg">Valid Appointment Found</p>
                    <p className="text-xs text-emerald-500/80">ID: {successData.appointment.id}</p>
                  </div>
                </div>

                {validationWarning && (
                  <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                    <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-sm font-bold text-amber-500">{validationWarning}</p>
                  </div>
                )}

                <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
                      {successData.patient.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-foreground">{successData.patient.name}</h4>
                      <p className="text-sm text-muted-foreground font-mono">UHID: {successData.patient.id}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground font-bold">Doctor</p>
                      <p className="text-sm font-medium text-foreground">Dr. {successData.doctor.name}</p>
                      <p className="text-xs text-muted-foreground">{successData.doctor.department}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground font-bold">Schedule</p>
                      <p className="text-sm font-medium text-foreground">{successData.appointment.time}</p>
                      <p className="text-xs text-muted-foreground">Today</p>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] uppercase text-primary font-bold tracking-widest">Queue Estimate</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">Approx. 15 mins wait</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase text-primary font-bold tracking-widest">Next Token</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">Auto-assigned</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => {
                      setScanResult(null);
                      setSuccessData(null);
                      startScanner();
                    }}
                    className="flex-1 py-3 bg-card border border-border hover:bg-muted text-foreground font-bold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={performCheckIn}
                    className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                  >
                    Check In Patient
                  </button>
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
