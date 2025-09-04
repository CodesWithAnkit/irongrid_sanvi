interface QuotationCardProps {
  id: string;
  customer: string;
  amount: number;
  status: string;
  date: string;
  formatCurrency: (amount: number) => string;
  getStatusColor: (status: string) => string;
}

export function QuotationCard({ 
  id, 
  customer, 
  amount, 
  status, 
  date, 
  formatCurrency, 
  getStatusColor 
}: QuotationCardProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div>
        <p className="font-medium text-gray-900">{id}</p>
        <p className="text-sm text-gray-600">{customer}</p>
        <p className="text-xs text-gray-500">{date}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-gray-900">{formatCurrency(amount)}</p>
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
          {status}
        </span>
      </div>
    </div>
  );
}