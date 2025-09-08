"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Download, Copy, Printer } from "lucide-react";
import { cn } from "@/lib/cn";

interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface QuotationData {
  // Company Info
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyGST: string;
  
  // Quotation Details
  quoteDate: string;
  quoteNo: string;
  preparedBy: string;
  
  // Customer Info
  customerName: string;
  customerContact: string;
  customerAddress: string;
  
  // Bank Details
  bankName: string;
  bankHolder: string;
  bankAccount: string;
  bankIFSC: string;
  
  // Items
  items: QuotationItem[];
  
  // Terms
  termsConditions: string;
  notes: string;
  
  // Calculations
  subtotal: number;
  sgst: number;
  cgst: number;
  grandTotal: number;
}

// Utility functions for Indian formatting and calculations
const formatINR = (amount: number): string => {
  if (isNaN(amount)) return '₹ 0';
  const rounded = Math.round(amount);
  const formatted = rounded.toLocaleString('en-IN');
  return `₹ ${formatted}`;
};

const numberToWords = (num: number): string => {
  const a = ['', 'One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  
  if (num === 0) return 'Zero';
  if (num > 999999999) return 'Amount too large';
  
  const numStr = ('000000000' + num.toString()).slice(-9);
  const crores = parseInt(numStr.slice(0, 2));
  const lakhs = parseInt(numStr.slice(2, 4));
  const thousands = parseInt(numStr.slice(4, 5));
  const hundreds = parseInt(numStr.slice(5, 7));
  const tens = parseInt(numStr.slice(7, 9));
  
  let result = '';
  
  if (crores > 0) {
    result += (crores < 20 ? a[crores] : (b[Math.floor(crores/10)] + ' ' + a[crores%10])).trim() + ' Crore ';
  }
  
  if (lakhs > 0) {
    result += (lakhs < 20 ? a[lakhs] : (b[Math.floor(lakhs/10)] + ' ' + a[lakhs%10])).trim() + ' Lakh ';
  }
  
  if (thousands > 0) {
    result += a[thousands] + ' Thousand ';
  }
  
  if (hundreds > 0) {
    result += (hundreds < 20 ? a[hundreds] : (b[Math.floor(hundreds/10)] + ' ' + a[hundreds%10])).trim() + ' Hundred ';
  }
  
  if (tens > 0) {
    if (result) result += 'and ';
    result += (tens < 20 ? a[tens] : (b[Math.floor(tens/10)] + ' ' + a[tens%10])).trim() + ' ';
  }
  
  return result.trim();
};

const toRupeeWords = (amount: number): string => {
  const rounded = Math.round(amount);
  if (rounded === 0) return 'Zero Rupees Only';
  return numberToWords(rounded) + ' Rupees Only';
};

export interface LiveQuotationBuilderProps {
  initialData?: Partial<QuotationData>;
  onSave?: (data: QuotationData) => Promise<void>;
  onCancel?: () => void;
}

export function LiveQuotationBuilder({
  initialData,
  onSave,
  onCancel,
}: LiveQuotationBuilderProps) {
  const [quotationData, setQuotationData] = React.useState<QuotationData>({
    // Default company info
    companyName: "SHANVI MACHINERY",
    companyAddress: "New Magadh Colony, Ward No 23, Bihar Sarif, Nalanda, Bihar, 803101",
    companyPhone: "7677614547",
    companyGST: "10FIUPS1815LIZU",
    
    // Default quotation details
    quoteDate: new Date().toISOString().split('T')[0],
    quoteNo: `#${Date.now().toString().slice(-4)}`,
    preparedBy: "Suruchi Sinha",
    
    // Default customer info
    customerName: "MS ARADHYA MINERAL WATER",
    customerContact: "VIKASH KUMAR",
    customerAddress: "VIKASH NAGER, BIHARSHARIF NALANDA 803101",
    
    // Default bank details
    bankName: "State Bank of India",
    bankHolder: "Shanvi Machinery Account",
    bankAccount: "41443107263",
    bankIFSC: "SBIN0003063",
    
    // Default items (sample from mockup)
    items: [
      { id: '1', description: 'RO SYSTEM', quantity: 1, unitPrice: 434120, total: 434120 },
      { id: '2', description: 'SAND FILTER', quantity: 1, unitPrice: 52082, total: 52082 },
      { id: '3', description: 'RAW WATER PUMP', quantity: 1, unitPrice: 43412, total: 43412 },
      { id: '4', description: 'CARBON FILTER', quantity: 1, unitPrice: 60737, total: 60737 },
      { id: '5', description: 'RAW WATER TANK', quantity: 1, unitPrice: 86846, total: 86846 },
      { id: '6', description: 'UV STERILIZER', quantity: 1, unitPrice: 43141, total: 43141 }
    ],
    
    // Default terms
    termsConditions: "Customer will be billed after indicating acceptance of this quote.\nPayment will be due prior to delivery of service and goods.",
    notes: "If you any enquires about this quotation, please contact Suruchi Sinha on Mobile: 7677614547",
    
    // Calculated fields (will be updated)
    subtotal: 0,
    sgst: 0,
    cgst: 0,
    grandTotal: 0,
    
    ...initialData
  });

  const [isLoading, setIsLoading] = React.useState(false);

  // Calculate totals whenever items change
  React.useEffect(() => {
    const subtotal = quotationData.items.reduce((sum, item) => sum + item.total, 0);
    const sgst = subtotal * 0.09; // 9% SGST
    const cgst = subtotal * 0.09; // 9% CGST
    const grandTotal = subtotal + sgst + cgst;

    setQuotationData(prev => ({
      ...prev,
      subtotal,
      sgst,
      cgst,
      grandTotal
    }));
  }, [quotationData.items]);

  const updateField = (field: keyof QuotationData, value: any) => {
    setQuotationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateItem = (itemId: string, field: keyof QuotationItem, value: any) => {
    setQuotationData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          // Recalculate total for this item
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const addItem = () => {
    const newItem: QuotationItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
    
    setQuotationData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (itemId: string) => {
    setQuotationData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const clearItems = () => {
    setQuotationData(prev => ({
      ...prev,
      items: []
    }));
  };

  const handleSaveAsDraft = async () => {
    setIsLoading(true);
    try {
      await onSave?.(quotationData);
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAsJSON = () => {
    const blob = new Blob([JSON.stringify(quotationData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${quotationData.quoteNo || 'quotation'}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleCopyJSON = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(quotationData, null, 2));
      // You could add a toast notification here
      alert('Quotation JSON copied to clipboard.');
    } catch (err) {
      alert('Unable to copy. You can save the draft instead.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-slate-50 min-h-screen">
      {/* Controls */}
      <div className="flex items-center justify-between gap-3 mb-6 no-print">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded bg-blue-500 text-white grid place-items-center font-bold">
            S
          </div>
          <div>
            <div className="text-lg font-semibold">Shanvi Machinery — Quotation Builder</div>
            <div className="text-sm text-slate-500">Create, preview, print and export quotations</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={handleSaveAsJSON}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Save Draft (JSON)
          </Button>
          <Button 
            variant="outline"
            onClick={handleCopyJSON}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy JSON
          </Button>
          <Button 
            onClick={handlePrint}
            className="bg-sky-600 hover:bg-sky-700 text-white"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Main Quotation Card */}
      <Card className="bg-white shadow-lg print:shadow-none print:border-none">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 mb-6">
            <div className="flex gap-4 items-start">
              <div className="h-20 w-20 rounded-lg bg-blue-500 text-white grid place-items-center text-xl font-bold">
                S
              </div>
              <div className="flex-1">
                <Input
                  value={quotationData.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  className="text-xl font-semibold border-0 border-b-2 rounded-none px-0 focus:border-blue-500"
                />
                <Input
                  value={quotationData.companyAddress}
                  onChange={(e) => updateField('companyAddress', e.target.value)}
                  className="text-sm text-slate-600 mt-1 border-0 border-b rounded-none px-0 focus:border-blue-500"
                />
                <div className="text-sm text-slate-600 mt-2 flex flex-wrap gap-4">
                  <div className="flex items-center gap-1">
                    Ph: 
                    <Input
                      value={quotationData.companyPhone}
                      onChange={(e) => updateField('companyPhone', e.target.value)}
                      className="inline-block w-36 text-sm border-0 border-b rounded-none px-0 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    GSTIN: 
                    <Input
                      value={quotationData.companyGST}
                      onChange={(e) => updateField('companyGST', e.target.value)}
                      className="inline-block w-44 text-sm border-0 border-b rounded-none px-0 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full md:w-80">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Date</label>
                  <Input
                    type="date"
                    value={quotationData.quoteDate}
                    onChange={(e) => updateField('quoteDate', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Quote No.</label>
                  <Input
                    value={quotationData.quoteNo}
                    onChange={(e) => updateField('quoteNo', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="mt-3 text-right text-sm text-slate-500">
                <div className="flex items-center justify-end gap-1">
                  Prepared by: 
                  <Input
                    value={quotationData.preparedBy}
                    onChange={(e) => updateField('preparedBy', e.target.value)}
                    className="inline-block w-36 border-0 border-b rounded-none px-0 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Customer and Bank Details */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 border rounded-lg">
              <div className="text-xs text-slate-500 mb-2">QUOTE TO</div>
              <Input
                value={quotationData.customerName}
                onChange={(e) => updateField('customerName', e.target.value)}
                className="w-full font-semibold border-0 border-b rounded-none px-0 focus:border-blue-500 mb-2"
                placeholder="Customer Name"
              />
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-1">
                  Contact: 
                  <Input
                    value={quotationData.customerContact}
                    onChange={(e) => updateField('customerContact', e.target.value)}
                    className="border-0 border-b rounded-none px-0 focus:border-blue-500 w-40"
                  />
                </div>
                <div className="flex items-center gap-1">
                  Address: 
                  <Input
                    value={quotationData.customerAddress}
                    onChange={(e) => updateField('customerAddress', e.target.value)}
                    className="border-0 border-b rounded-none px-0 focus:border-blue-500 flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="text-xs text-slate-500 mb-2">BANK DETAILS</div>
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-1">
                  Bank Name: 
                  <Input
                    value={quotationData.bankName}
                    onChange={(e) => updateField('bankName', e.target.value)}
                    className="border-0 border-b rounded-none px-0 focus:border-blue-500 w-56"
                  />
                </div>
                <div className="flex items-center gap-1">
                  Account Holder: 
                  <Input
                    value={quotationData.bankHolder}
                    onChange={(e) => updateField('bankHolder', e.target.value)}
                    className="border-0 border-b rounded-none px-0 focus:border-blue-500 w-56"
                  />
                </div>
                <div className="flex items-center gap-1">
                  Account No: 
                  <Input
                    value={quotationData.bankAccount}
                    onChange={(e) => updateField('bankAccount', e.target.value)}
                    className="border-0 border-b rounded-none px-0 focus:border-blue-500 w-56"
                  />
                </div>
                <div className="flex items-center gap-1">
                  IFSC: 
                  <Input
                    value={quotationData.bankIFSC}
                    onChange={(e) => updateField('bankIFSC', e.target.value)}
                    className="border-0 border-b rounded-none px-0 focus:border-blue-500 w-36"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="mb-6">
            <div className="grid grid-cols-12 gap-2 mb-3 text-sm text-slate-500 font-medium">
              <div className="col-span-7">Item Description</div>
              <div className="col-span-1 text-right">Qty</div>
              <div className="col-span-2 text-right">Unit Price</div>
              <div className="col-span-1 text-right">Total</div>
              <div className="col-span-1"></div>
            </div>

            <div className="space-y-2">
              {quotationData.items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-7">
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Item description"
                      className="w-full"
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full text-right"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full text-right"
                    />
                  </div>
                  <div className="col-span-1 text-right py-2 text-sm">
                    {formatINR(item.total)}
                  </div>
                  <div className="col-span-1 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2 no-print">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                className="flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add item
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearItems}
              >
                Clear items
              </Button>
            </div>
          </div>

          {/* Totals */}
          <div className="mb-6 flex justify-end">
            <div className="w-full md:w-1/2">
              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-slate-600">Sub Total</div>
                  <div className="text-lg font-semibold">{formatINR(quotationData.subtotal)}</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-slate-600">SGST (9%)</div>
                  <div className="text-sm">{formatINR(quotationData.sgst)}</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-slate-600">CGST (9%)</div>
                  <div className="text-sm">{formatINR(quotationData.cgst)}</div>
                </div>
                <div className="border-t pt-2 flex justify-between items-center">
                  <div className="text-sm text-slate-600">Grand Total</div>
                  <div className="text-xl font-bold">{formatINR(quotationData.grandTotal)}</div>
                </div>
                
                <div className="text-sm text-slate-600 pt-2 border-t">
                  Amount (in words):
                  <div className="font-medium mt-1">{toRupeeWords(quotationData.grandTotal)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Terms and Notes */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 border rounded-lg">
              <div className="text-sm font-semibold mb-2">Terms and Conditions</div>
              <Textarea
                value={quotationData.termsConditions}
                onChange={(e) => updateField('termsConditions', e.target.value)}
                className="w-full"
                rows={6}
              />
            </div>

            <div className="p-4 border rounded-lg">
              <div className="text-sm font-semibold mb-2">Notes / Additional Info</div>
              <Textarea
                value={quotationData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                className="w-full"
                rows={6}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-slate-500 border-t pt-4">
            <div>Quote prepared by <span className="font-medium">{quotationData.preparedBy}</span></div>
            <div>Grand Total (rounded): <span className="font-semibold">{formatINR(Math.round(quotationData.grandTotal))}</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons (no-print) */}
      <div className="mt-6 flex justify-center gap-3 no-print">
        <Button 
          onClick={handleSaveAsDraft}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading ? 'Saving...' : 'Save Quotation'}
        </Button>
        {onCancel && (
          <Button 
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .page { margin: 0; box-shadow: none; }
        }
      `}</style>
    </div>
  );
}
