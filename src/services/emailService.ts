import { useEnterpriseStore } from '../store/useEnterpriseStore';
import type { Email } from '../types/hospital';

// Helper to simulate delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const emailService = {
  queueEmail: async (recipient: string, subject: string, template: string, content: string) => {
    const { addEmail } = useEnterpriseStore.getState();
    const newEmail: Email = {
      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recipient,
      subject,
      template,
      content,
      status: 'Queued',
      createdAt: new Date().toISOString()
    };
    await addEmail(newEmail);
  },

  processQueue: async () => {
    const { emails, updateEmailStatus } = useEnterpriseStore.getState();
    const queuedEmails = emails.filter(e => e.status === 'Queued' || e.status === 'Retry');

    for (const email of queuedEmails) {
      await updateEmailStatus(email.id, 'Sending');
      
      try {
        await delay(1500); // Simulate network latency
        
        // Randomly fail ~10% of the time to show off the Retry queue
        if (Math.random() < 0.1) {
          throw new Error('Mock SMTP timeout');
        }
        
        await updateEmailStatus(email.id, 'Delivered');
      } catch (err) {
        await updateEmailStatus(email.id, 'Failed');
      }
    }
  }
};
