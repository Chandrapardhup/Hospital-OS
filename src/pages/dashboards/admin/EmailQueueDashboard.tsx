import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Clock, Send, AlertCircle, RefreshCw, Eye, CheckCircle2, XCircle } from 'lucide-react';
import { useEnterpriseStore } from '../../../store/useEnterpriseStore';
import { emailService } from '../../../services/emailService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { EmailStatus } from '../../../types/hospital';

export default function EmailQueueDashboard() {
  const { emails, updateEmailStatus } = useEnterpriseStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  const handleProcessQueue = async () => {
    setIsProcessing(true);
    await emailService.processQueue();
    setIsProcessing(false);
  };

  const getStatusIcon = (status: EmailStatus) => {
    switch (status) {
      case 'Delivered': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'Failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'Sending': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'Queued': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'Retry': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: EmailStatus) => {
    switch (status) {
      case 'Delivered': return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">{status}</Badge>;
      case 'Failed': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">{status}</Badge>;
      case 'Sending': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">{status}</Badge>;
      case 'Queued': return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">{status}</Badge>;
      case 'Retry': return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">{status}</Badge>;
      default: return null;
    }
  };

  const selectedEmail = emails.find(e => e.id === selectedEmailId);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <Mail className="w-7 h-7 md:w-8 md:h-8 text-primary" />
            Email Notification System
          </h1>
          <p className="text-muted-foreground mt-1">SMTP Gateway and Communication Queue</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button 
            variant="outline"
            onClick={async () => {
              const testEmail = window.prompt("Enter your real Gmail address to test EmailJS delivery:", "your.email@gmail.com");
              if (!testEmail) return;
              // Send a test email
              await emailService.queueEmail(
                testEmail,
                'System Status Check',
                'System Notification',
                'This is an automated test of the Enterprise Email Gateway. If you are seeing this, EmailJS is perfectly configured!'
              );
            }}
          >
            Send Test Email
          </Button>
          <Button 
            onClick={handleProcessQueue}
            disabled={isProcessing}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isProcessing ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Processing Queue...</>
            ) : (
              <><Send className="w-4 h-4 mr-2" /> Process Queue</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-muted-foreground text-sm flex items-center gap-2 mb-1"><Clock className="w-4 h-4" /> Queued</div>
          <div className="text-2xl font-bold text-foreground">{emails.filter(e => e.status === 'Queued').length}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-blue-500 text-sm flex items-center gap-2 mb-1"><RefreshCw className="w-4 h-4" /> Sending</div>
          <div className="text-2xl font-bold text-foreground">{emails.filter(e => e.status === 'Sending').length}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-green-500 text-sm flex items-center gap-2 mb-1"><CheckCircle2 className="w-4 h-4" /> Delivered</div>
          <div className="text-2xl font-bold text-foreground">{emails.filter(e => e.status === 'Delivered').length}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-red-500 text-sm flex items-center gap-2 mb-1"><AlertCircle className="w-4 h-4" /> Failed</div>
          <div className="text-2xl font-bold text-foreground">{emails.filter(e => e.status === 'Failed').length}</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-6 min-h-[400px] lg:min-h-[500px]">
        {/* Email List */}
        <div className="w-full lg:w-1/2 bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-card/80 font-semibold text-foreground flex justify-between">
            <span>Transmission Log</span>
            <span className="text-sm font-normal text-muted-foreground">Total: {emails.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {emails.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <Mail className="w-12 h-12 mb-3 opacity-20" />
                <p>Queue is empty</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {emails.map(email => (
                  <div 
                    key={email.id}
                    onClick={() => setSelectedEmailId(email.id)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${selectedEmailId === email.id ? 'bg-primary/5 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2 text-foreground font-medium truncate pr-4">
                        {getStatusIcon(email.status)}
                        <span className="truncate">{email.recipient}</span>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(email.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground truncate mb-2">{email.subject}</div>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="text-[10px]">{email.template}</Badge>
                      {getStatusBadge(email.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Email Preview */}
        <div className="w-full lg:w-1/2 bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-card/80 font-semibold text-foreground flex items-center gap-2">
            <Eye className="w-4 h-4" /> Live Preview
          </div>
          
          {selectedEmail ? (
            <div className="flex-1 p-6 flex flex-col">
              <div className="space-y-4 mb-6 border-b border-border pb-6">
                <div className="flex">
                  <span className="w-20 text-muted-foreground text-sm">To:</span>
                  <span className="text-foreground font-medium">{selectedEmail.recipient}</span>
                </div>
                <div className="flex">
                  <span className="w-20 text-muted-foreground text-sm">Subject:</span>
                  <span className="text-foreground font-medium">{selectedEmail.subject}</span>
                </div>
                <div className="flex">
                  <span className="w-20 text-muted-foreground text-sm">Status:</span>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedEmail.status)}
                    {selectedEmail.status === 'Failed' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs text-orange-500 hover:text-orange-600 hover:bg-orange-500/10 ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateEmailStatus(selectedEmail.id, 'Retry');
                        }}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" /> Retry Now
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* HTML Template Preview Area */}
              <div className="flex-1 bg-background rounded-xl border border-border p-8 shadow-inner overflow-y-auto">
                <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden text-gray-800">
                  <div className="bg-blue-600 p-6 text-white text-center">
                    <h2 className="text-2xl font-bold tracking-widest">HOSPITAL<span className="text-blue-300">OS</span></h2>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">{selectedEmail.template}</p>
                    <p className="whitespace-pre-wrap">{selectedEmail.content}</p>
                    <div className="mt-8 pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">
                      This is an automated message. Please do not reply directly to this email.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select an email to view preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
