import { Request, Response } from 'express';
import { TwilioService } from '../services/twilio.service';
import twilio from 'twilio';

const VoiceResponse = twilio.twiml.VoiceResponse;

// In-memory mock DB to store call status.
// In production, use PostgreSQL / MongoDB.
const callLogs: any[] = [];

export class CallController {
  
  async startCall(req: Request, res: Response) {
    try {
      const { to, patientName, doctorName, time, appointmentId } = req.body;
      
      if (!to || !patientName || !doctorName || !time || !appointmentId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const call = await TwilioService.startCall(to, patientName, doctorName, time, appointmentId);
      
      const callLog = {
        appointmentId,
        patientName,
        phone: to,
        sid: call.sid,
        status: call.status,
        timestamp: new Date().toISOString(),
      };
      callLogs.push(callLog);

      res.status(200).json({ success: true, message: 'Call initiated', callSid: call.sid });
    } catch (error: any) {
      console.error('Call initialization failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Handle the initial TwiML when Twilio calls the patient
  async handleWebhook(req: Request, res: Response) {
    const { patientName, doctorName, time, appointmentId } = req.query;
    
    const twiml = new VoiceResponse();
    
    const gather = twiml.gather({
      numDigits: 1,
      action: `/api/call/ivr?appointmentId=${appointmentId}`, // Where Twilio will send the digit pressed
      method: 'POST'
    });

    gather.say({ voice: 'alice' }, 
      `Hello ${patientName}. This is ABC Hospital. This is a reminder that your appointment with Dr. ${doctorName} is scheduled for ${time}. Please arrive at least 15 minutes before your appointment. Press 1 to confirm your appointment. Press 2 if you want to reschedule. Thank you.`
    );

    // If they don't press anything, say it again
    twiml.say({ voice: 'alice' }, "We didn't receive any input. Goodbye!");

    res.type('text/xml');
    res.send(twiml.toString());
  }

  // Handle the key press from the patient
  async handleIVR(req: Request, res: Response) {
    const { Digits } = req.body;
    const { appointmentId } = req.query;
    const twiml = new VoiceResponse();

    if (Digits === '1') {
      twiml.say({ voice: 'alice' }, 'Thank you. Your appointment is now confirmed. We look forward to seeing you.');
      // Update Database Status to 'Confirmed'
      const log = callLogs.find(l => l.appointmentId === appointmentId);
      if (log) log.ivrSelection = 'Confirmed';
    } else if (Digits === '2') {
      twiml.say({ voice: 'alice' }, 'You have requested to reschedule. Our receptionist will contact you shortly to arrange a new time.');
      // Update Database Status to 'Reschedule Requested'
      const log = callLogs.find(l => l.appointmentId === appointmentId);
      if (log) log.ivrSelection = 'Reschedule Requested';
    } else {
      twiml.say({ voice: 'alice' }, 'Invalid selection. Goodbye.');
    }

    res.type('text/xml');
    res.send(twiml.toString());
  }

  // Fetch Call History
  async getCallHistory(req: Request, res: Response) {
    const { patientId } = req.params;
    // Mock DB fetch logic
    res.status(200).json({ callLogs });
  }
}
