import { clsx, type ClassValue } from"clsx"
import { twMerge } from"tailwind-merge"

export function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency ='EUR'): string {
 return new Intl.NumberFormat('nl-NL', {
 style:'currency',
 currency,
 minimumFractionDigits: 0,
 maximumFractionDigits: 0,
 }).format(amount)
}

export function formatDate(date: string | Date): string {
 if (!date) return''
 const d = typeof date ==='string'? new Date(date) : date
 return d.toLocaleDateString('nl-NL', {
 day:'numeric',
 month:'short',
 year:'numeric',
 })
}
