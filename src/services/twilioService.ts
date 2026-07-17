import { useHospitalStore } from '../store/useHospitalStore';

const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID || 'your_account_sid';
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN || 'your_auth_token';
const TWILIO_API_KEY = import.meta.env.VITE_TWILIO_API_KEY || 'your_api_key'; // Stored for reference as requested
const TWILIO_FROM_NUMBER = import.meta.env.VITE_TWILIO_FROM_NUMBER || '+17744924976';

export class TwilioService {
  static async makeReminderCall(patientPhone: string, patientName: string, doctorName: string, time: string, date: string) {
    try {
      const twiml = `<Response><Say voice="alice">Hello ${patientName}. This is a reminder from Apollo Hospitals. You have an appointment with Doctor ${doctorName} scheduled at ${time} on ${date}. Please ensure you arrive 15 minutes early. Thank you.</Say></Response>`;
      
      const formData = new URLSearchParams();
      formData.append('To', patientPhone);
      formData.append('From', TWILIO_FROM_NUMBER);
      formData.append('Twiml', twiml);

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Twilio Error:', errorData);
        throw new Error(errorData.message || 'Failed to make call');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to trigger Twilio call:', error);
      throw error;
    }
  }
}
