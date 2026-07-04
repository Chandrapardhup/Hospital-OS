import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Recommendation, Workflow, Email, DailyBriefing } from '../types/hospital';

interface EnterpriseState {
  recommendations: Recommendation[];
  workflows: Workflow[];
  emails: Email[];
  dailyBriefings: DailyBriefing[];
  isLoading: boolean;
  
  initializeEnterpriseData: () => Promise<void>;
  
  // Recommendations
  addRecommendation: (rec: Recommendation) => Promise<void>;
  updateRecommendationStatus: (id: string, status: Recommendation['status']) => Promise<void>;
  
  // Workflows
  addWorkflow: (workflow: Workflow) => Promise<void>;
  updateWorkflow: (id: string, data: Partial<Workflow>) => Promise<void>;
  
  // Emails
  addEmail: (email: Email) => Promise<void>;
  updateEmailStatus: (id: string, status: Email['status']) => Promise<void>;
  
  // Briefings
  addBriefing: (briefing: DailyBriefing) => Promise<void>;
}

export const useEnterpriseStore = create<EnterpriseState>((set, get) => ({
  recommendations: [],
  workflows: [],
  emails: [],
  dailyBriefings: [],
  isLoading: true,

  initializeEnterpriseData: async () => {
    set({ isLoading: true });
    try {
      const [
        { data: recommendations },
        { data: workflows },
        { data: emails },
        { data: dailyBriefings }
      ] = await Promise.all([
        supabase.from('recommendations').select('*').order('created_at', { ascending: false }),
        supabase.from('workflows').select('*').order('created_at', { ascending: false }),
        supabase.from('emails').select('*').order('created_at', { ascending: false }),
        supabase.from('daily_briefings').select('*').order('created_at', { ascending: false }),
      ]);

      const mapRec = (r: any) => ({
        ...r,
        confidenceScore: r.confidence_score,
        suggestedAction: r.suggested_action,
        createdAt: r.created_at
      });

      const mapWorkflow = (w: any) => ({
        ...w,
        triggerEvent: w.trigger_event,
        executionTimeMs: w.execution_time_ms,
        createdAt: w.created_at
      });

      const mapEmail = (e: any) => ({
        ...e,
        createdAt: e.created_at
      });

      const mapBriefing = (b: any) => ({
        ...b,
        hospitalHealthScore: b.hospital_health_score,
        criticalPatients: b.critical_patients,
        pendingLabReports: b.pending_lab_reports,
        createdAt: b.created_at
      });

      set({
        recommendations: recommendations?.map(mapRec) || [],
        workflows: workflows?.map(mapWorkflow) || [],
        emails: emails?.map(mapEmail) || [],
        dailyBriefings: dailyBriefings?.map(mapBriefing) || [],
        isLoading: false
      });
    } catch (error) {
      console.error("Failed to load enterprise data", error);
      set({ isLoading: false });
    }
  },

  addRecommendation: async (rec) => {
    set((state) => ({ recommendations: [rec, ...state.recommendations] }));
    const { error } = await supabase.from('recommendations').insert({
      id: rec.id,
      title: rec.title,
      priority: rec.priority,
      confidence_score: rec.confidenceScore,
      reason: rec.reason,
      department: rec.department,
      suggested_action: rec.suggestedAction,
      status: rec.status,
    });
    if (error) console.error('Error adding recommendation', error);
  },

  updateRecommendationStatus: async (id, status) => {
    set((state) => ({
      recommendations: state.recommendations.map(r => r.id === id ? { ...r, status } : r)
    }));
    await supabase.from('recommendations').update({ status }).eq('id', id);
  },

  addWorkflow: async (workflow) => {
    set((state) => ({ workflows: [workflow, ...state.workflows] }));
    const { error } = await supabase.from('workflows').insert({
      id: workflow.id,
      name: workflow.name,
      trigger_event: workflow.triggerEvent,
      status: workflow.status,
      steps: workflow.steps,
      execution_time_ms: workflow.executionTimeMs,
    });
    if (error) console.error('Error adding workflow', error);
  },

  updateWorkflow: async (id, data) => {
    set((state) => ({
      workflows: state.workflows.map(w => w.id === id ? { ...w, ...data } : w)
    }));
    
    const updateData: any = { ...data };
    if (data.triggerEvent) updateData.trigger_event = data.triggerEvent;
    if (data.executionTimeMs !== undefined) updateData.execution_time_ms = data.executionTimeMs;
    delete updateData.triggerEvent;
    delete updateData.executionTimeMs;

    await supabase.from('workflows').update(updateData).eq('id', id);
  },

  addEmail: async (email) => {
    set((state) => ({ emails: [email, ...state.emails] }));
    const { error } = await supabase.from('emails').insert(email);
    if (error) console.error('Error adding email', error);
  },

  updateEmailStatus: async (id, status) => {
    set((state) => ({
      emails: state.emails.map(e => e.id === id ? { ...e, status } : e)
    }));
    await supabase.from('emails').update({ status }).eq('id', id);
  },

  addBriefing: async (briefing) => {
    set((state) => ({ dailyBriefings: [briefing, ...state.dailyBriefings] }));
    const { error } = await supabase.from('daily_briefings').insert({
      id: briefing.id,
      date: briefing.date,
      hospital_health_score: briefing.hospitalHealthScore,
      admissions: briefing.admissions,
      discharges: briefing.discharges,
      appointments: briefing.appointments,
      critical_patients: briefing.criticalPatients,
      revenue: briefing.revenue,
      pending_lab_reports: briefing.pendingLabReports,
      recommendations: briefing.recommendations
    });
    if (error) console.error('Error adding briefing', error);
  }
}));
