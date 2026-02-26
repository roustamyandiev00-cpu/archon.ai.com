/**
 * Export data to CSV format
 */
export function exportToCSV<T extends Record<string, any>>(
 data: T[],
 columns: { key: keyof T; header: string }[],
 filename: string ='export.csv'
): void {
 // Create CSV header
 const headers = columns.map(col => String(col.header)).join(';')
 
 // Create CSV rows
 const rows = data.map(item => {
 return columns.map(col => {
 const value = item[col.key]
 // Handle different value types
 if (value === null || value === undefined) return''
 if (typeof value ==='string') return `"${value.replace(/"/g,'""')}"`
 if (Object.prototype.toString.call(value) ==='[object Date]') {
 return (value as Date).toLocaleDateString('nl-NL')
 }
 if (typeof value ==='object'&&'toString'in value) return String(value)
 return String(value)
 }).join(';')
 })
 
 // Combine header and rows
 const csv = [headers, ...rows].join('\n')
 
 // Create blob and download
 const blob = new Blob([csv], { type:'text/csv;charset=utf-8;'})
 const link = document.createElement('a')
 const url = URL.createObjectURL(blob)
 
 link.setAttribute('href', url)
 link.setAttribute('download', filename)
 link.style.visibility ='hidden'
 
 document.body.appendChild(link)
 link.click()
 document.body.removeChild(link)
}

/**
 * Export data to JSON format
 */
export function exportToJSON<T extends Record<string, any>>(
 data: T[],
 filename: string ='export.json'
): void {
 const json = JSON.stringify(data, null, 2)
 const blob = new Blob([json], { type:'application/json'})
 const link = document.createElement('a')
 const url = URL.createObjectURL(blob)
 
 link.setAttribute('href', url)
 link.setAttribute('download', filename)
 link.style.visibility ='hidden'
 
 document.body.appendChild(link)
 link.click()
 document.body.removeChild(link)
}

/**
 * Format date for Dutch locale
 */
export function formatDateNL(date: Date | string | null): string {
 if (!date) return'-'
 const d = typeof date ==='string'? new Date(date) : date
 return d.toLocaleDateString('nl-NL', {
 day:'2-digit',
 month:'2-digit',
 year:'numeric'
 })
}

/**
 * Format currency for Dutch locale
 */
export function formatCurrencyNL(amount: number | null): string {
 if (amount === null || amount === undefined) return'-'
 return new Intl.NumberFormat('nl-NL', {
 style:'currency',
 currency:'EUR'
 }).format(amount)
}

/**
 * Format file size to human readable
 */
export function formatFileSize(bytes: number): string {
 if (bytes === 0) return'0 Bytes'
 const k = 1024
 const sizes = ['Bytes','KB','MB','GB','TB']
 const i = Math.floor(Math.log(bytes) / Math.log(k))
 return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) +''+ sizes[i]
}
