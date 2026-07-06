import React, { useState, useEffect } from 'react';
import { Box, Plus, AlertTriangle, CheckCircle2, RefreshCcw, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

import { useHospitalStore } from '../store/useHospitalStore';
import type { InventoryItem } from '../store/useHospitalStore';

export default function Inventory() {
  const items = useHospitalStore(state => state.inventory);
  const setInventory = useHospitalStore(state => state.setInventory);
  const addInventoryItem = useHospitalStore(state => state.addInventoryItem);
  const updateInventoryItem = useHospitalStore(state => state.updateInventoryItem);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: 'Medicine', quantity: 0, unit: 'boxes', min_stock_level: 10 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInventory = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('inventory').select('*').order('name');
    if (!error && data) {
      setInventory(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAddItem = async () => {
    if (!newItem.name) return;
    setIsSubmitting(true);
    
    const itemData = {
      id: `INV-${Date.now()}`,
      name: newItem.name,
      category: newItem.category,
      quantity: Number(newItem.quantity),
      unit: newItem.unit,
      min_stock_level: Number(newItem.min_stock_level),
      status: Number(newItem.quantity) <= Number(newItem.min_stock_level) ? 'Low Stock' : 'In Stock',
      last_restocked: new Date().toISOString()
    };

    const { error } = await supabase.from('inventory').insert([itemData]);
    if (error) {
      console.warn("Supabase insert failed, falling back to local memory:", error);
    }
    
    // Always update local state so the UI reflects the addition instantly
    addInventoryItem(itemData);
    
    // Sort array via setInventory to maintain alphabetical order
    const updatedItems = [...items, itemData].sort((a, b) => a.name.localeCompare(b.name));
    setInventory(updatedItems);

    setIsModalOpen(false);
    setNewItem({ name: '', category: 'Medicine', quantity: 0, unit: 'boxes', min_stock_level: 10 });
    
    setIsSubmitting(false);
  };

  const handleUpdateStock = async (id: string, currentQty: number, delta: number) => {
    const newQty = Math.max(0, currentQty + delta);
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    const newStatus = newQty <= item.min_stock_level ? 'Low Stock' : 'In Stock';
    
    updateInventoryItem(id, { quantity: newQty, status: newStatus });
    
    await supabase.from('inventory').update({ quantity: newQty, status: newStatus }).eq('id', id);
  };

  const lowStockCount = items.filter(i => i.status === 'Low Stock').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 relative">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <span>Resources</span>
          <span className="text-foreground/20">•</span>
          <span className="text-primary">Supplies</span>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-1 gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Inventory Management</h1>
            <p className="text-sm text-muted-foreground mt-1">Track medical supplies, equipment, and pharmaceuticals.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-foreground font-medium rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all w-full sm:w-auto justify-center min-h-[48px]"
          >
            <Plus className="w-5 h-5" /> Add Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mt-6 md:mt-8">
        <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Items</p>
          <div className="text-3xl font-bold text-foreground mb-2">{items.length}</div>
        </div>
        <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Low Stock Alerts</p>
          <div className="text-3xl font-bold text-amber-500 mb-2">{lowStockCount}</div>
        </div>
        <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">System Status</p>
          <div className="text-3xl font-bold text-emerald-500 mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6" /> Online
          </div>
        </div>
      </div>

      <div className="bg-card/30 border border-border rounded-2xl backdrop-blur-md overflow-hidden mt-6">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-background/50">
                <tr>
                  <th className="px-6 py-4 font-bold">ITEM NAME</th>
                  <th className="px-6 py-4 font-bold">CATEGORY</th>
                  <th className="px-6 py-4 font-bold">STOCK LEVEL</th>
                  <th className="px-6 py-4 font-bold">STATUS</th>
                  <th className="px-6 py-4 font-bold text-right">QUICK ADJUST</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.length > 0 ? (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{item.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{item.category}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-foreground">{item.quantity}</span>
                          <span className="text-xs text-muted-foreground">{item.unit}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {item.status === 'In Stock' && <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1 w-max"><CheckCircle2 className="w-3 h-3"/> {item.status}</span>}
                        {item.status === 'Low Stock' && <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 flex items-center gap-1 w-max"><AlertTriangle className="w-3 h-3"/> {item.status}</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleUpdateStock(item.id, item.quantity, -1)}
                            className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors text-foreground"
                          >
                            -
                          </button>
                          <button 
                            onClick={() => handleUpdateStock(item.id, item.quantity, 1)}
                            className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors text-foreground"
                          >
                            +
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No items in inventory. Add an item to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border shadow-2xl rounded-2xl p-6 w-full max-w-sm relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-foreground mb-4">Add Inventory Item</h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground ml-1 uppercase tracking-wider">Item Name</label>
                <input 
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full bg-background/50 h-10 border border-border rounded-lg px-3 focus:ring-primary/20 outline-none text-foreground"
                  placeholder="e.g. Surgical Masks"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground ml-1 uppercase tracking-wider">Category</label>
                <select 
                  className="w-full bg-background/50 h-10 border-border rounded-lg px-3 focus:ring-primary/20 outline-none text-foreground"
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                >
                  <option value="Medicine">Medicine</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Supplies">Supplies</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground ml-1 uppercase tracking-wider">Quantity</label>
                  <input 
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    className="w-full bg-background/50 h-10 border border-border rounded-lg px-3 focus:ring-primary/20 outline-none text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground ml-1 uppercase tracking-wider">Unit</label>
                  <input 
                    type="text"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full bg-background/50 h-10 border border-border rounded-lg px-3 focus:ring-primary/20 outline-none text-foreground"
                  />
                </div>
              </div>

              <button 
                onClick={handleAddItem}
                disabled={!newItem.name || isSubmitting}
                className="w-full h-12 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold rounded-xl mt-4 transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
