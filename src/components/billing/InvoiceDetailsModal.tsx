import React from 'react';
import { X, Printer, Hospital, CheckCircle2, AlertCircle, Clock, HeartPulse, Sparkles } from 'lucide-react';
import type { Invoice, AiConsultation } from '../../types/hospital';

interface InvoiceDetailsModalProps {
  invoice: Invoice;
  aiConsultation?: AiConsultation; // If this invoice is linked to an AI Call
  patientName: string;
  onClose: () => void;
}

export function InvoiceDetailsModal({ invoice, aiConsultation, patientName, onClose }: InvoiceDetailsModalProps) {
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 2rem !important;
          }
          .no-print {
            display: none !important;
          }
          .print-border {
            border-color: #e5e7eb !important;
          }
          .print-text {
            color: #111827 !important;
          }
        }
      `}</style>
      
      {/* Modal Container */}
      <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative">
        {/* Header Controls (No Print) */}
        <div className="flex justify-between items-center p-4 border-b border-border/50 no-print bg-background/50 backdrop-blur-md sticky top-0 z-10">
          <h3 className="font-bold text-lg flex items-center gap-2"><Hospital className="w-5 h-5 text-primary"/> Invoice Details</h3>
          <div className="flex gap-2">
            <button 
              onClick={handlePrint}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Print PDF
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div id="printable-invoice" className="p-6 md:p-10 overflow-y-auto custom-scrollbar flex-1 bg-white text-black">
          
          {/* Invoice Header */}
          <div className="flex justify-between items-start border-b border-gray-200 pb-8 mb-8 print-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                <HeartPulse className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight print-text">Apollo Hospitals</h2>
                <p className="text-sm text-gray-500 font-medium tracking-wide print-text">Premium Care Network</p>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-4xl font-black text-gray-200 tracking-tighter uppercase print-text">INVOICE</h1>
              <p className="text-sm font-bold text-gray-500 mt-2 print-text">#{invoice.id}</p>
            </div>
          </div>

          {/* Billing Info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 print-text">Billed To</p>
              <p className="text-lg font-bold text-gray-900 print-text">{patientName}</p>
              <p className="text-sm text-gray-500 print-text">Patient ID: {invoice.patientId}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 print-text">Date Issued</p>
              <p className="text-lg font-bold text-gray-900 print-text">{new Date(invoice.date).toLocaleDateString()}</p>
              
              <div className="mt-4 flex justify-end">
                {invoice.status === 'Paid' && <span className="inline-flex text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200 items-center gap-1"><CheckCircle2 className="w-4 h-4"/> PAID IN FULL</span>}
                {invoice.status === 'Pending' && <span className="inline-flex text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-md border border-amber-200 items-center gap-1"><Clock className="w-4 h-4"/> PENDING PAYMENT</span>}
                {invoice.status === 'Overdue' && <span className="inline-flex text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-md border border-red-200 items-center gap-1"><AlertCircle className="w-4 h-4"/> OVERDUE</span>}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-left mb-8">
            <thead>
              <tr className="border-b-2 border-gray-900 print-border">
                <th className="py-3 font-bold text-gray-900 text-sm uppercase tracking-wider print-text">Description</th>
                <th className="py-3 font-bold text-gray-900 text-sm uppercase tracking-wider text-right print-text">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 print-border">
              {invoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-4 font-medium text-gray-800 print-text">{item.description}</td>
                  <td className="py-4 font-bold text-gray-900 text-right print-text">${item.cost.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-900 print-border">
                <td className="py-4 font-black text-gray-900 text-xl text-right print-text">Total Due</td>
                <td className="py-4 font-black text-purple-600 text-2xl text-right print-text">${invoice.amount.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>

          {/* AI Transcript Attachment */}
          {aiConsultation && (
            <div className="mt-12 border-t-2 border-dashed border-gray-300 pt-8 print-border">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-6 print-text">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI Consultation Transcript
              </h3>
              
              <div className="space-y-6">
                {aiConsultation.transcript.map((line, i) => (
                  <div key={i} className="mb-4">
                    <span className={`text-xs font-black uppercase tracking-widest ${line.speaker === 'User' ? 'text-blue-600' : 'text-purple-600'}`}>
                      {line.speaker === 'User' ? 'Patient' : 'AI Doctor'}
                    </span>
                    <p className="text-sm text-gray-700 mt-1 font-medium leading-relaxed print-text whitespace-pre-wrap">
                      {line.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-16 text-center text-gray-400 text-xs font-bold uppercase tracking-widest print-text">
            Thank you for choosing Apollo Hospitals
          </div>
        </div>
      </div>
    </div>
  );
}
