import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useHospitalStore } from '../../store/useHospitalStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserCircle } from 'lucide-react';
import type { Patient, Gender } from '../../types/hospital';

export default function OnboardingFlow() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const updatePatient = useHospitalStore(state => state.updatePatient);
  const patients = useHospitalStore(state => state.patients);
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    dob: '',
    gender: 'Male' as Gender,
    bloodGroup: '',
    address: '',
    allergies: '',
    insuranceProvider: '',
    insuranceId: ''
  });

  // Find the patient record that corresponds to this user
  // Since we created the patient record with the same email during signup
  const patientRecord = patients.find(p => p.email === user?.email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientRecord) return;
    
    setIsLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    updatePatient(patientRecord.id, {
      phone: formData.phone,
      dob: formData.dob,
      gender: formData.gender,
      bloodGroup: formData.bloodGroup,
      address: formData.address,
      allergies: formData.allergies ? formData.allergies.split(',').map(a => a.trim()) : [],
      insuranceProvider: formData.insuranceProvider,
      insuranceId: formData.insuranceId,
    });

    setIsLoading(false);
    navigate('/user');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full bg-card border border-border rounded-2xl p-8 shadow-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <UserCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground text-center">Complete Your Profile</h1>
          <p className="text-muted-foreground text-center mt-2">
            Welcome, {user?.name}! Please provide a few more details to help us serve you better.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Date of Birth *</label>
              <Input 
                required
                type="date"
                value={formData.dob}
                onChange={e => setFormData({...formData, dob: e.target.value})}
                className="bg-background border-border text-foreground [&::-webkit-calendar-picker-indicator]:invert"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Gender *</label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value as Gender})}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border text-foreground">
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Phone Number *</label>
              <Input 
                required
                placeholder="+1 234 567 8900"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Blood Group *</label>
              <Input 
                required
                placeholder="e.g. O+, A-"
                value={formData.bloodGroup}
                onChange={e => setFormData({...formData, bloodGroup: e.target.value})}
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Home Address *</label>
            <Input 
              required
              placeholder="123 Main St, City, Country"
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              className="bg-background border-border text-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Allergies (Optional)</label>
            <Input 
              placeholder="Comma separated e.g. Peanuts, Penicillin"
              value={formData.allergies}
              onChange={e => setFormData({...formData, allergies: e.target.value})}
              className="bg-background border-border text-foreground"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Insurance Provider (Optional)</label>
              <Input 
                placeholder="e.g. Blue Cross"
                value={formData.insuranceProvider}
                onChange={e => setFormData({...formData, insuranceProvider: e.target.value})}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Insurance ID (Optional)</label>
              <Input 
                placeholder="e.g. BC-123456"
                value={formData.insuranceId}
                onChange={e => setFormData({...formData, insuranceId: e.target.value})}
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-12 mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Profile'}
          </Button>
        </form>
      </div>
    </div>
  );
}
