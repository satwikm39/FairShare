import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const currencies = [
  { label: 'US Dollar', symbol: '$', code: 'USD' },
  { label: 'Euro', symbol: '€', code: 'EUR' },
  { label: 'British Pound', symbol: '£', code: 'GBP' },
  { label: 'Indian Rupee', symbol: '₹', code: 'INR' },
  { label: 'Japanese Yen', symbol: '¥', code: 'JPY' },
  { label: 'Canadian Dollar', symbol: 'CA$', code: 'CAD' },
  { label: 'Australian Dollar', symbol: 'A$', code: 'AUD' },
];

export function getCurrencySymbol(codeOrSymbol: string) {
  const curr = currencies.find(c => c.code === codeOrSymbol || c.symbol === codeOrSymbol);
  return curr?.symbol || codeOrSymbol;
}

export function getCurrencyCode(symbolOrCode: string) {
  const curr = currencies.find(c => c.symbol === symbolOrCode || c.code === symbolOrCode);
  return curr?.code || symbolOrCode;
}
