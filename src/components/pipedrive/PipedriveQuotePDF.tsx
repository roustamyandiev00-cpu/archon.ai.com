'use client'

import { useRef } from'react'
import { useReactToPrint } from'react-to-print'
import { FileText, Download, Share2, Sparkles } from'lucide-react'
import { Button } from'@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from'@/components/ui/card'
import { Badge } from'@/components/ui/badge'
import { formatCurrency, formatDate } from'@/lib/utils'

interface OfferteData {
 nummer: string
 datum: string
 geldigTot: string
 klant: {
 bedrijf: string
 contact: string
 adres?: string
 email?: string
 telefoon?: string
 }
 items: Array<{
 omschrijving: string
 aantal: number
 eenheidsprijs: number
 btw: number
 totaal: number
 }>
 subtotaal: number
 btwBedrag: number
 totaal: number
 opmerkingen?: string
 aiSuggesties?: string[]
}

interface PipedriveQuotePDFProps {
 data: OfferteData
 onDownload?: () => void
 onShare?: () => void
}

export function PipedriveQuotePDF({ data, onDownload, onShare }: PipedriveQuotePDFProps) {
 const contentRef = useRef<HTMLDivElement>(null)
 
 const handlePrint = useReactToPrint({
 contentRef,
 documentTitle: `Offerte-${data.nummer}`,
 })

 return (
 <div className="space-y-4">
 {/* Actions */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <FileText className="w-5 h-5 text-primary"/>
 <span className="font-semibold">Offerte {data.nummer}</span>
 </div>
 <div className="flex items-center gap-2">
 <Button variant="outline"size="sm"onClick={handlePrint}>
 <Download className="w-4 h-4 mr-2"/>
 Download PDF
 </Button>
 <Button variant="outline"size="sm"onClick={onShare}>
 <Share2 className="w-4 h-4 mr-2"/>
 Delen
 </Button>
 </div>
 </div>

 {/* AI Suggesties */}
 {data.aiSuggesties && data.aiSuggesties.length > 0 && (
 <Card className="border-amber-500/20 bg-amber-500/5">
 <CardHeader className="pb-2">
 <CardTitle className="text-sm flex items-center gap-2">
 <Sparkles className="w-4 h-4 text-amber-500"/>
 AI Suggesties
 </CardTitle>
 </CardHeader>
 <CardContent>
 <ul className="space-y-1">
 {data.aiSuggesties.map((suggestie, index) => (
 <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
 <span className="text-amber-500">💡</span>
 {suggestie}
 </li>
 ))}
 </ul>
 </CardContent>
 </Card>
 )}

 {/* PDF Preview */}
 <div 
 ref={contentRef}
 className="bg-white text-slate-900 p-8 rounded-lg shadow-lg max-w-3xl mx-auto"
 style={{ minHeight:'842px'}} // A4 height
 >
 {/* Header */}
 <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-slate-200">
 <div>
 <h1 className="text-2xl font-bold text-slate-900">OFFERTE</h1>
 <p className="text-slate-600 mt-1">ArchonPro Business Suite</p>
 <p className="text-slate-500 text-sm">Uw adres hier</p>
 </div>
 <div className="text-right">
 <div className="text-sm text-slate-600">
 <span className="font-semibold">Offertenummer:</span> {data.nummer}
 </div>
 <div className="text-sm text-slate-600">
 <span className="font-semibold">Datum:</span> {formatDate(data.datum)}
 </div>
 <div className="text-sm text-slate-600">
 <span className="font-semibold">Geldig tot:</span> {formatDate(data.geldigTot)}
 </div>
 </div>
 </div>

 {/* Klant Info */}
 <div className="mb-8">
 <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Offerte aan</h2>
 <div className="text-slate-900">
 <p className="font-bold text-lg">{data.klant.bedrijf}</p>
 <p className="font-medium">{data.klant.contact}</p>
 {data.klant.adres && <p className="text-slate-600">{data.klant.adres}</p>}
 {data.klant.email && <p className="text-slate-600">{data.klant.email}</p>}
 {data.klant.telefoon && <p className="text-slate-600">{data.klant.telefoon}</p>}
 </div>
 </div>

 {/* Offerte Items */}
 <table className="w-full mb-8">
 <thead>
 <tr className="border-b-2 border-slate-200">
 <th className="text-left py-3 px-2 text-sm font-semibold text-slate-700">Omschrijving</th>
 <th className="text-right py-3 px-2 text-sm font-semibold text-slate-700">Aantal</th>
 <th className="text-right py-3 px-2 text-sm font-semibold text-slate-700">Prijs</th>
 <th className="text-right py-3 px-2 text-sm font-semibold text-slate-700">BTW</th>
 <th className="text-right py-3 px-2 text-sm font-semibold text-slate-700">Totaal</th>
 </tr>
 </thead>
 <tbody>
 {data.items.map((item, index) => (
 <tr key={index} className="border-b border-slate-100">
 <td className="py-3 px-2 text-slate-900">{item.omschrijving}</td>
 <td className="py-3 px-2 text-right text-slate-900">{item.aantal}</td>
 <td className="py-3 px-2 text-right text-slate-900">{formatCurrency(item.eenheidsprijs)}</td>
 <td className="py-3 px-2 text-right text-slate-900">{item.btw}%</td>
 <td className="py-3 px-2 text-right font-medium text-slate-900">{formatCurrency(item.totaal)}</td>
 </tr>
 ))}
 </tbody>
 </table>

 {/* Totaal */}
 <div className="flex justify-end mb-8">
 <div className="w-64">
 <div className="flex justify-between py-2 text-slate-600">
 <span>Subtotaal</span>
 <span>{formatCurrency(data.subtotaal)}</span>
 </div>
 <div className="flex justify-between py-2 text-slate-600">
 <span>BTW</span>
 <span>{formatCurrency(data.btwBedrag)}</span>
 </div>
 <div className="flex justify-between py-3 border-t-2 border-slate-200 font-bold text-lg text-slate-900">
 <span>Totaal</span>
 <span>{formatCurrency(data.totaal)}</span>
 </div>
 </div>
 </div>

 {/* Opmerkingen */}
 {data.opmerkingen && (
 <div className="mb-8 p-4 bg-slate-50 rounded-lg">
 <h3 className="text-sm font-semibold text-slate-700 mb-2">Opmerkingen</h3>
 <p className="text-sm text-slate-600 whitespace-pre-line">{data.opmerkingen}</p>
 </div>
 )}

 {/* Footer */}
 <div className="mt-auto pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
 <p>Bedankt voor uw interesse in ArchonPro Business Suite.</p>
 <p className="mt-2">Vragen? Neem contact met ons op via support@archonpro.com</p>
 </div>
 </div>
 </div>
 )
}

// Demo data generator
export function generateDemoQuote(): OfferteData {
 return {
 nummer:'2024-001',
 datum: new Date().toISOString(),
 geldigTot: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
 klant: {
 bedrijf:'Voorbeeld B.V.',
 contact:'Jan de Vries',
 adres:'Voorbeeldstraat 123, 1234 AB Amsterdam',
 email:'jan@voorbeeld.nl',
 telefoon:'+31 6 12345678',
 },
 items: [
 {
 omschrijving:'ArchonPro Professional - Jaarabonnement',
 aantal: 1,
 eenheidsprijs: 2999,
 btw: 21,
 totaal: 3628.79,
 },
 {
 omschrijving:'Implementation & Training',
 aantal: 1,
 eenheidsprijs: 1500,
 btw: 21,
 totaal: 1815,
 },
 {
 omschrijving:'Support Premium (per maand)',
 aantal: 12,
 eenheidsprijs: 299,
 btw: 21,
 totaal: 4336.68,
 },
 ],
 subtotaal: 9780.47,
 btwBedrag: 2053.90,
 totaal: 11834.37,
 opmerkingen:'Betalingsvoorwaarden: 14 dagen na factuurdatum\nDeze offerte is geldig tot de vervaldatum.',
 aiSuggesties: [
'Voeg 10% vroegboekkorting toe bij accepteren binnen 7 dagen',
'Bied gratis training aan voor 5 extra gebruikers',
'Verleng de geldigheidsduur naar 60 dagen voor complexere deals',
 ],
 }
}

export default PipedriveQuotePDF
