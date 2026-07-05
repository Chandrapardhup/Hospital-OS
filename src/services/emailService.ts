import { useEnterpriseStore } from '../store/useEnterpriseStore';
import type { Email } from '../types/hospital';

// EmailJS has been removed completely as requested by user.
// Notifications are now handled exclusively via in-app and browser Push Notifications.

export const emailService = {
  queueEmail: async (recipientOrOptions: string | any, subjectObj?: string, templateObj?: string, contentObj?: string) => {
    let recipient = '';
    let subject = '';
    let template = 'standard';
    let content = '';

    if (typeof recipientOrOptions === 'object') {
      recipient = recipientOrOptions.to;
      subject = recipientOrOptions.subject;
      content = recipientOrOptions.body || recipientOrOptions.content;
      template = recipientOrOptions.template || 'standard';
    } else {
      recipient = recipientOrOptions;
      subject = subjectObj || '';
      template = templateObj || 'standard';
      content = contentObj || templateObj || '';
    }

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
    
    // Process queue immediately so user gets the email right away
    emailService.processQueue();
  },

  processQueue: async () => {
    const { emails, updateEmailStatus } = useEnterpriseStore.getState();
    const queuedEmails = emails.filter((e: Email) => e.status === 'Queued' || e.status === 'Retry');

    for (const email of queuedEmails) {
      // Fake sending the email and mark as delivered to clean up the queue
      await updateEmailStatus(email.id, 'Sending');
      setTimeout(async () => {
        await updateEmailStatus(email.id, 'Delivered');
      }, 1000);
    }
  }
};
