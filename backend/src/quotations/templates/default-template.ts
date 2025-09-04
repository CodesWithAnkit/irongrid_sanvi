export type QuotationTemplateData = {
  company: {
    name: string;
    address?: string;
    email?: string;
    phone?: string;
    gst?: string;
  };
  customer: {
    name: string;
    company?: string;
    email?: string;
    phone?: string;
    address?: string;
    gst?: string;
  };
  quotation: {
    number: string;
    validUntil?: Date | null;
    validityDays?: number;
    deliveryTime?: string;
    paymentTerms?: string;
    warranty?: string;
  };
};

export function getDefaultTermsPlaceholders() {
  return [
    'Prices are valid for {validityDays} days from the date of quotation.',
    'Delivery Time: {deliveryTime}.',
    'Payment Terms: {paymentTerms}.',
    'Warranty: {warranty}.',
    'GST and other taxes extra as applicable.',
  ];
}

export function fillTerms(templateData: QuotationTemplateData) {
  const terms = getDefaultTermsPlaceholders();
  const replacements: Record<string, string> = {
    validityDays: String(templateData.quotation.validityDays ?? ''),
    deliveryTime: templateData.quotation.deliveryTime ?? '',
    paymentTerms: templateData.quotation.paymentTerms ?? '',
    warranty: templateData.quotation.warranty ?? '',
  };
  return terms.map((t) =>
    t.replace(/\{(\w+)\}/g, (_, key: string) => (replacements[key] ?? '')),
  );
}
