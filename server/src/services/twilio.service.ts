import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;
const BASE_URL = process.env.NGROK_URL; // Your backend ngrok URL

export class TwilioService {
  static async startCall(to: string, patientName: string, doctorName: string, time: string, appointmentId: string) {
    if (!TWILIO_FROM_NUMBER) {
      throw new Error('TWILIO_FROM_NUMBER is missing from .env');
    }
    if (!BASE_URL) {
      throw new Error('NGROK_URL is missing from .env. Required for webhooks.');
    }

    // Initiate the call
    const call = await client.calls.create({
      to,
      from: TWILIO_FROM_NUMBER,
      url: `${BASE_URL}/api/call/webhook?patientName=${encodeURIComponent(patientName)}&doctorName=${encodeURIComponent(doctorName)}&time=${encodeURIComponent(time)}&appointmentId=${encodeURIComponent(appointmentId)}`,
      statusCallback: `${BASE_URL}/api/call/webhook-status?appointmentId=${encodeURIComponent(appointmentId)}`,
      statusCallbackEvent: ['completed', 'no-answer', 'canceled', 'failed'],
    });

    return call;
  }
}
