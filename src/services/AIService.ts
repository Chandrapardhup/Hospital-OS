import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export class AIService {
  private static async getAIResponse(systemPrompt: string, prompt: string, context: string = ""): Promise<string> {
    if (!genAI) {
      return `[SIMULATED AI RESPONSE]\nRequires VITE_GEMINI_API_KEY to function.`;
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: systemPrompt });
      const fullPrompt = `Context:\n${context}\n\nUser Query:\n${prompt}`;
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error("AI Generation failed:", error);
      return `AI Service unavailable. [Error: ${error.message}]`;
    }
  }

  // 1. Supervisor Agent
  static async supervisorAgent(query: string): Promise<string> {
    const prompt = `You are the Supervisor Agent of HospitalOS. Route the following query to the correct department (Emergency, Pharmacy, Records, Doctor, Analytics).`;
    return this.getAIResponse(prompt, query);
  }

  // 2. Emergency Triage Agent
  static async evaluateEmergencyPriority(symptoms: string): Promise<{ score: number, category: string, notification: string }> {
    const prompt = `You are the Emergency Triage Agent. Evaluate these symptoms: "${symptoms}".
    Do not diagnose. Calculate emergency priority. Categories: Critical, High, Medium, Low.
    Return JSON format EXACTLY like this:
    { "score": (1-100), "category": "Critical|High|Medium|Low", "notification": "Short alert message" }`;
    
    try {
      const res = await this.getAIResponse(prompt, symptoms);
      const jsonStr = res.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (e) {
      return { score: 90, category: "High", notification: "AI parsing failed. Defaulting to High priority." };
    }
  }

  // 3. Doctor Assistant Agent
  static async generatePatientSummary(patientData: any, history: any[]): Promise<string> {
    const prompt = `You are the Doctor Assistant Agent. Review the patient's timeline and history and generate a concise consultation summary. Highlight potential allergies or recurring issues.`;
    const context = `Patient: ${JSON.stringify(patientData)}\nHistory: ${JSON.stringify(history)}`;
    return this.getAIResponse(prompt, "Summarize patient history for doctor.", context);
  }

  // 4. Pharmacy Agent
  static async checkPrescriptionSafety(symptoms: string, diagnosis: string, proposedMeds: string, patientAllergies: string[]): Promise<string> {
    const prompt = `You are the Pharmacy Agent. Verify the proposed prescription for safety.
    Warn about drug interactions. Highlight allergies.
    If unsafe, suggest alternatives. If safe, output the final prescription draft.`;
    const context = `Symptoms: ${symptoms}\nDiagnosis: ${diagnosis}\nProposed Meds: ${proposedMeds}\nAllergies: ${patientAllergies.join(", ")}`;
    return this.getAIResponse(prompt, "Check prescription safety.", context);
  }

  // 5. Medical Records Agent (RAG Explainer)
  static async explainMedicalReport(reportText: string): Promise<string> {
    const prompt = `You are the Medical Records Agent. Patients often struggle to understand medical reports.
    Explain the following medical report extract in simple, easy-to-understand language.
    Avoid making diagnoses or treatment decisions. Tell them to consult their doctor for final advice.`;
    return this.getAIResponse(prompt, reportText);
  }
}
