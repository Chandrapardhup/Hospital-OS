import React, { useState } from 'react';
import { CreditCard, FileText, CheckCircle2, AlertCircle, Clock, X, Download } from 'lucide-react';
import { useHospitalStore } from '../store/useHospitalStore';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from '../translations';
import { InvoiceDetailsModal } from '../components/billing/InvoiceDetailsModal';

export default function Billing() {
  const { t } = useTranslation();
  const currentUser = useAuthStore(state => state.user);
  const isPatient = currentUser?.role === 'user';
  
  const patients = useHospitalStore(state => state.patients);
  const currentPatientId = patients.find(p => p.email === currentUser?.email)?.id || currentUser?.id;
  
  const allInvoices = useHospitalStore(state => state.invoices);
  // Filter invoices if the current user is a patient using currentPatientId
  const invoices = isPatient ? allInvoices.filter(i => i.patientId === currentPatientId) : allInvoices;
  const addInvoice = useHospitalStore(state => state.addInvoice);
  const updateInvoice = useHospitalStore(state => state.updateInvoice);
  const addNotification = useHospitalStore(state => state.addNotification);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [newInvoiceAmount, setNewInvoiceAmount] = useState('');
  
  // Custom Invoice Modal State
  const [selectedInvoiceForDownload, setSelectedInvoiceForDownload] = useState<any>(null);
  const aiConsultations = useHospitalStore(state => state.aiConsultations);

  const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || id;

  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((acc, i) => acc + i.amount, 0);
  const pendingAmount = invoices.filter(i => i.status === 'Pending').reduce((acc, i) => acc + i.amount, 0);

  const handleGenerateInvoice = () => {
    if (!selectedPatientId || !newInvoiceAmount) return;
    
    const invoiceId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    
    addInvoice({
      id: invoiceId,
      patientId: selectedPatientId,
      doctorId: 'dr_unknown',
      amount: Number(newInvoiceAmount),
      status: 'Pending',
      date: new Date().toISOString(),
      items: [{ description: 'Consultation & Services', cost: Number(newInvoiceAmount) }]
    });
    
    addNotification({
      userId: selectedPatientId,
      title: 'New Invoice Generated',
      message: `A new invoice (${invoiceId}) for $${newInvoiceAmount} has been generated and is pending payment.`,
      type: 'info'
    });
    
    setIsModalOpen(false);
    setNewInvoiceAmount('');
    setSelectedPatientId('');
  };

  const handleMarkPaid = (id: string) => {
    updateInvoice(id, { status: 'Paid' });
  };
  
  const handleDownloadInvoice = (invoiceId: string) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (invoice) {
      setSelectedInvoiceForDownload(invoice);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 relative">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <span>Finance</span>
          <span className="text-foreground/20">•</span>
          <span className="text-primary">{isPatient ? 'My Bills' : 'Ledger'}</span>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-1 gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{isPatient ? 'My Invoices' : 'Billing & Invoices'}</h1>
            <p className="text-sm text-muted-foreground mt-1">{isPatient ? 'View and download your hospital bills' : 'Manage patient transactions and hospital revenue'}</p>
          </div>
          {!isPatient && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-foreground font-medium rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all w-full sm:w-auto justify-center min-h-[48px]"
            >
              <FileText className="w-5 h-5" /> Generate Invoice
            </button>
          )}
        </div>
      </div>

      {!isPatient && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mt-6 md:mt-8">
          <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Revenue</p>
            <div className="text-3xl font-bold text-emerald-500 mb-2">₹{totalRevenue.toLocaleString()}</div>
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
      )}

      {isPatient && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mt-6 md:mt-8">
          <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Paid</p>
            <div className="text-3xl font-bold text-emerald-500 mb-2">₹{totalRevenue.toLocaleString()}</div>
          </div>
          <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Amount Due</p>
            <div className="text-3xl font-bold text-amber-500 mb-2">${pendingAmount.toLocaleString()}</div>
          </div>
        </div>
      )}

      <div className="bg-card/30 border border-border rounded-2xl backdrop-blur-md overflow-hidden mt-6">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-background/50">
              <tr>
                <th className="px-6 py-4 font-bold">INVOICE ID</th>
                {!isPatient && <th className="px-6 py-4 font-bold">PATIENT</th>}
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
                    {!isPatient && <td className="px-6 py-4 font-medium text-foreground">{getPatientName(invoice.patientId)}</td>}
                    <td className="px-6 py-4 text-muted-foreground">{new Date(invoice.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-foreground">₹{invoice.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      {invoice.status === 'Paid' && <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1 w-max"><CheckCircle2 className="w-3 h-3"/> Paid</span>}
                      {invoice.status === 'Pending' && <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 flex items-center gap-1 w-max"><Clock className="w-3 h-3"/> Pending</span>}
                      {invoice.status === 'Overdue' && <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20 flex items-center gap-1 w-max"><AlertCircle className="w-3 h-3"/> Overdue</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isPatient && invoice.status !== 'Paid' && (
                          <button 
                            onClick={() => handleMarkPaid(invoice.id)}
                            className="text-white hover:text-white/90 font-medium text-xs transition-colors px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 shadow-[0_0_15px_rgba(147,51,234,0.3)]"
                          >
                            Pay Now
                          </button>
                        )}
                        {(!isPatient && invoice.status === 'Pending') && (
                          <button 
                            onClick={() => handleMarkPaid(invoice.id)}
                            className="text-emerald-500 hover:text-emerald-400 font-medium text-xs transition-colors px-3 py-1.5 rounded-lg bg-emerald-500/10"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button 
                          onClick={() => handleDownloadInvoice(invoice.id)}
                          disabled={invoice.status !== 'Paid'}
                          className={`font-medium text-xs transition-colors px-3 py-1.5 rounded-lg flex items-center gap-1 ${invoice.status === 'Paid' ? 'text-primary hover:text-primary/80 bg-primary/10' : 'text-gray-500 bg-gray-500/10 opacity-50 cursor-not-allowed'}`}
                          title={invoice.status !== 'Paid' ? 'Payment required to download' : ''}
                        >
                          <Download className="w-3 h-3" /> Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isPatient ? 5 : 6} className="px-6 py-8 text-center text-muted-foreground">
                    No invoices found.
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
                    {!isPatient && <h3 className="font-medium text-foreground">{getPatientName(invoice.patientId)}</h3>}
                    <p className={`text-xs font-mono text-muted-foreground ${isPatient ? '' : 'mt-0.5'}`}>{invoice.id}</p>
                  </div>
                  <div>
                    {invoice.status === 'Paid' && <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Paid</span>}
                    {invoice.status === 'Pending' && <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</span>}
                    {invoice.status === 'Overdue' && <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Overdue</span>}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="font-bold text-foreground">₹{invoice.amount.toLocaleString()}</div>
                  <span className="text-sm text-muted-foreground">{new Date(invoice.date).toLocaleDateString()}</span>
                </div>
                  <div className="flex gap-2 w-full">
                  {isPatient && invoice.status !== 'Paid' && (
                    <button 
                      onClick={() => handleMarkPaid(invoice.id)}
                      className="text-white hover:text-white/90 font-medium text-sm transition-colors px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 flex-1 min-h-[48px] shadow-[0_0_15px_rgba(147,51,234,0.3)]"
                    >
                      Pay Now
                    </button>
                  )}
                  {(!isPatient && invoice.status === 'Pending') && (
                    <button 
                      onClick={() => handleMarkPaid(invoice.id)}
                      className="text-emerald-500 hover:text-emerald-400 font-medium text-sm transition-colors px-4 py-2.5 rounded-xl bg-emerald-500/10 flex-1 min-h-[48px]"
                    >
                      Mark Paid
                    </button>
                  )}
                  <button 
                    onClick={() => handleDownloadInvoice(invoice.id)}
                    disabled={invoice.status !== 'Paid'}
                    className={`font-medium text-sm transition-colors px-4 py-2.5 rounded-xl flex-1 min-h-[48px] flex items-center justify-center gap-2 ${invoice.status === 'Paid' ? 'text-primary hover:text-primary/80 bg-primary/10' : 'text-gray-500 bg-gray-500/10 opacity-50 cursor-not-allowed'}`}
                    title={invoice.status !== 'Paid' ? 'Payment required to download' : ''}
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No invoices found.
            </div>
          )}
        </div>
      </div>

      {/* Generate Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border shadow-2xl rounded-2xl p-6 w-full max-w-sm relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-foreground mb-4">Generate Invoice</h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground ml-1 uppercase tracking-wider">Select Patient</label>
                <select 
                  className="w-full bg-background/50 h-10 border-border rounded-lg px-3 focus:ring-primary/20 outline-none"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                >
                  <option value="">-- Choose a patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground ml-1 uppercase tracking-wider">Amount ($)</label>
                <input 
                  type="number"
                  value={newInvoiceAmount}
                  onChange={(e) => setNewInvoiceAmount(e.target.value)}
                  className="w-full bg-background/50 h-10 border border-border rounded-lg px-3 focus:ring-primary/20 outline-none"
                  placeholder="e.g. 150"
                />
              </div>

              <button 
                onClick={handleGenerateInvoice}
                disabled={!selectedPatientId || !newInvoiceAmount}
                className="w-full h-12 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold rounded-xl mt-4 transition-colors"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedInvoiceForDownload && (
        <InvoiceDetailsModal 
          invoice={selectedInvoiceForDownload}
          patientName={getPatientName(selectedInvoiceForDownload.patientId)}
          aiConsultation={aiConsultations.find(c => c.invoiceId === selectedInvoiceForDownload.id)}
          onClose={() => setSelectedInvoiceForDownload(null)}
        />
      )}
    </div>
  );
}
