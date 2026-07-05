import React from 'react';
import { AIConsultation } from '../../components/patients/AIConsultation';

export default function AILiveCallPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Live Companion</h1>
        <p className="text-muted-foreground text-lg">
          Connect instantly with our advanced AI Doctor for a live continuous voice session.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <AIConsultation />
      </div>
    </div>
  );
}
