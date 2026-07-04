import React, { useState } from 'react';
import { CreditCard, FileText, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useHospitalStore } from '../store/useHospitalStore';
import { useTranslation } from '../translations';

export default function Billing() {
  const { t } = useTranslation();
  const invoices = useHospitalStore(state => state.invoices);
  const patients = useHospitalStore(state => state.patients);
  
  const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || id;

  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((acc, i) => acc + i.amount, 0);
  const pendingAmount = invoices.filter(i => i.status === 'Pending').reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <span>Finance</span>
          <span className="text-foreground/20">•</span>
          <span className="text-primary">Ledger</span>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-1 gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Billing & Invoices</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage patient transactions and hospital revenue</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-foreground font-medium rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all w-full sm:w-auto justify-center min-h-[48px]">
            <FileText className="w-5 h-5" /> Generate Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mt-6 md:mt-8">
        <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Revenue</p>
          <div className="text-3xl font-bold text-emerald-500 mb-2">${totalRevenue.toLocaleString()}</div>
        </div>
        <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Pending Receivables</p>
          <div className="text-3xl font-bold text-amber-500 mb-2">${pendingAmount.toLocaleString()}</div>
        </div>
        <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Invoices</p>
          <div className="text-3xl font-bold text-foreground mb-2">{invoices.length}</div>
        </div>
      </div>

      <div className="bg-card/30 border border-border rounded-2xl backdrop-blur-md overflow-hidden mt-6">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-background/50">
              <tr>
                <th className="px-6 py-4 font-bold">INVOICE ID</th>
                <th className="px-6 py-4 font-bold">PATIENT</th>
                <th className="px-6 py-4 font-bold">DATE</th>
                <th className="px-6 py-4 font-bold">AMOUNT</th>
                <th className="px-6 py-4 font-bold">STATUS</th>
                <th className="px-6 py-4 font-bold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-muted transition-colors cursor-pointer group">
                    <td className="px-6 py-4 font-mono text-foreground text-xs">{invoice.id}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{getPatientName(invoice.patientId)}</td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(invoice.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-foreground">${invoice.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      {invoice.status === 'Paid' && <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1 w-max"><CheckCircle2 className="w-3 h-3"/> Paid</span>}
                      {invoice.status === 'Pending' && <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 flex items-center gap-1 w-max"><Clock className="w-3 h-3"/> Pending</span>}
                      {invoice.status === 'Overdue' && <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20 flex items-center gap-1 w-max"><AlertCircle className="w-3 h-3"/> Overdue</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-primary hover:text-primary/80 font-medium text-xs transition-colors px-3 py-1.5 rounded-lg bg-primary/10">
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No invoices generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden flex flex-col divide-y divide-border">
          {invoices.length > 0 ? (
            invoices.map((invoice) => (
              <div key={invoice.id} className="p-4 flex flex-col gap-3 active:bg-muted/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-foreground">{getPatientName(invoice.patientId)}</h3>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">{invoice.id}</p>
                  </div>
                  <div>
                    {invoice.status === 'Paid' && <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Paid</span>}
                    {invoice.status === 'Pending' && <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</span>}
                    {invoice.status === 'Overdue' && <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Overdue</span>}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-foreground">${invoice.amount.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">{new Date(invoice.date).toLocaleDateString()}</span>
                </div>
                <button className="text-primary hover:text-primary/80 font-medium text-sm transition-colors px-4 py-2.5 rounded-xl bg-primary/10 w-full min-h-[48px]">
                  View Invoice
                </button>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No invoices generated yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
