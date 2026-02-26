'use client'

import { useState, useRef, useCallback } from'react'
import { Camera, FileText, Upload, X, Loader2, Sparkles, Calculator, Building } from'lucide-react'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from'@/components/ui/dialog'
import { Button } from'@/components/ui/button'
import { Input } from'@/components/ui/input'
import { Label } from'@/components/ui/label'
import { Textarea } from'@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from'@/components/ui/card'
import { Badge } from'@/components/ui/badge'
import { Separator } from'@/components/ui/separator'
import { ScrollArea } from'@/components/ui/scroll-area'
import { toast } from'@/hooks/use-toast'
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from'@/components/ui/select'

interface AIFactuurModalProps {
 open: boolean
 onOpenChange: (open: boolean) => void
 onSuccess?: () => void
}

interface MediaFile {
 file: File
 previewUrl: string
 type:'photo'|'document'
}

interface ClientInfo {
 naam: string
 email: string
 telefoon: string
 adres: string
 postcode: string
 plaats: string
}

interface ServiceDetails {
 type: string
 beschrijving: string
 periode: string
 urgentie:'Normaal'|'Hoog'|'Spoed'
 bijzonderheden: string
}

const SERVICE_TYPES = [
'Consultancy diensten',
'Software ontwikkeling', 
'IT Support',
'Project management',
'Training & workshops',
'Onderhoud & service',
'Advies & strategie',
'Design & creatie',
'Marketing diensten',
'Overig'
]

export default function AIFactuurModal({ open, onOpenChange, onSuccess }: AIFactuurModalProps) {
 const [isAnalyzing, setIsAnalyzing] = useState(false)
 const [currentStep, setCurrentStep] = useState<'client'|'service'|'media'|'review'>('client')
 const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
 const [clientInfo, setClientInfo] = useState<ClientInfo>({
 naam:'',
 email:'',
 telefoon:'',
 adres:'',
 postcode:'',
 plaats:''
 })
 const [serviceDetails, setServiceDetails] = useState<ServiceDetails>({
 type:'',
 beschrijving:'',
 periode:'',
 urgentie:'Normaal',
 bijzonderheden:''
 })
 
 const fileInputRef = useRef<HTMLInputElement>(null)
 const cameraInputRef = useRef<HTMLInputElement>(null)

 const handleFileUpload = useCallback((files: FileList | null, type:'photo'|'document') => {
 if (!files) return

 Array.from(files).forEach(file => {
 if (mediaFiles.length >= 5) {
 toast({
 title:"Maximum bereikt",
 description:"Je kunt maximaal 5 bestanden uploaden.",
 variant:"destructive"
 })
 return
 }

 // Validate file type
 const isImage = file.type.startsWith('image/')
 const isDocument = file.type ==='application/pdf'|| 
 file.type.includes('document') || 
 file.type.includes('text')

 if (type ==='photo'&& !isImage) {
 toast({
 title:"Ongeldig bestandstype",
 description:"Alleen afbeeldingen zijn toegestaan voor foto's.",
 variant:"destructive"
 })
 return
 }

 if (type ==='document'&& !isDocument && !isImage) {
 toast({
 title:"Ongeldig bestandstype", 
 description:"Alleen documenten en afbeeldingen zijn toegestaan.",
 variant:"destructive"
 })
 return
 }

 // Check file size (max 5MB)
 if (file.size > 5 * 1024 * 1024) {
 toast({
 title:"Bestand te groot",
 description:"Bestanden mogen maximaal 5MB zijn.",
 variant:"destructive"
 })
 return
 }

 const previewUrl = URL.createObjectURL(file)
 setMediaFiles(prev => [...prev, { file, previewUrl, type }])
 })
 }, [mediaFiles.length])

 const removeMediaFile = (index: number) => {
 setMediaFiles(prev => {
 const file = prev[index]
 URL.revokeObjectURL(file.previewUrl)
 return prev.filter((_, i) => i !== index)
 })
 }

 const handleCameraCapture = () => {
 cameraInputRef.current?.click()
 }

 const handleDocumentUpload = () => {
 fileInputRef.current?.click()
 }

 const canProceedFromClient = () => {
 return clientInfo.naam.trim() && clientInfo.email.trim()
 }

 const canProceedFromService = () => {
 return serviceDetails.type && serviceDetails.beschrijving.trim()
 }

 const handleAIGeneration = async () => {
 setIsAnalyzing(true)
 
 try {
 const formData = new FormData()
 
 // Add client info
 formData.append('klant', clientInfo.naam)
 formData.append('klantEmail', clientInfo.email)
 formData.append('telefoon', clientInfo.telefoon)
 formData.append('adres', `${clientInfo.adres}, ${clientInfo.postcode} ${clientInfo.plaats}`)
 
 // Add service details
 formData.append('serviceType', serviceDetails.type)
 formData.append('beschrijving', serviceDetails.beschrijving)
 formData.append('periode', serviceDetails.periode)
 formData.append('urgentie', serviceDetails.urgentie)
 formData.append('bijzonderheden', serviceDetails.bijzonderheden)
 
 // Add media files
 mediaFiles.forEach((media, index) => {
 formData.append(`media_${index}`, media.file)
 formData.append(`media_${index}_type`, media.type)
 })
 
 formData.append('generateFactuur','true')
 
 const response = await fetch('/api/facturen/ai-generate', {
 method:'POST',
 body: formData
 })
 
 if (!response.ok) {
 throw new Error('AI factuur generatie mislukt')
 }
 
 const result = await response.json()
 
 toast({
 title:"AI Factuur gegenereerd",
 description:"De factuur is succesvol gegenereerd met AI.",
 })
 
 // Reset form and close modal
 resetForm()
 onSuccess?.()
 onOpenChange(false)
 
 } catch (error) {
 console.error('AI Generation error:', error)
 toast({
 title:"Generatie mislukt",
 description:"Er is een fout opgetreden bij de AI generatie. Probeer het opnieuw.",
 variant:"destructive"
 })
 } finally {
 setIsAnalyzing(false)
 }
 }

 const resetForm = () => {
 setCurrentStep('client')
 setMediaFiles([])
 setClientInfo({
 naam:'',
 email:'',
 telefoon:'',
 adres:'',
 postcode:'',
 plaats:''
 })
 setServiceDetails({
 type:'',
 beschrijving:'',
 periode:'',
 urgentie:'Normaal',
 bijzonderheden:''
 })
 }

 const handleClose = () => {
 resetForm()
 onOpenChange(false)
 }

 const renderClientStep = () => (
 <div className="space-y-6">
 <div className="text-center">
 <h3 className="text-lg font-semibold mb-2">Klantgegevens</h3>
 <p className="text-sm text-muted-foreground">Vul de klantgegevens in voor de factuur</p>
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="naam">Bedrijfsnaam / Naam *</Label>
 <Input
 id="naam"
 value={clientInfo.naam}
 onChange={(e) => setClientInfo(prev => ({ ...prev, naam: e.target.value }))}
 placeholder="Bedrijf BV of Voor- en achternaam"
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="email">E-mail *</Label>
 <Input
 id="email"
 type="email"
 value={clientInfo.email}
 onChange={(e) => setClientInfo(prev => ({ ...prev, email: e.target.value }))}
 placeholder="facturen@bedrijf.nl"
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="telefoon">Telefoon</Label>
 <Input
 id="telefoon"
 value={clientInfo.telefoon}
 onChange={(e) => setClientInfo(prev => ({ ...prev, telefoon: e.target.value }))}
 placeholder="06-12345678"
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="adres">Adres</Label>
 <Input
 id="adres"
 value={clientInfo.adres}
 onChange={(e) => setClientInfo(prev => ({ ...prev, adres: e.target.value }))}
 placeholder="Straat en huisnummer"
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="postcode">Postcode</Label>
 <Input
 id="postcode"
 value={clientInfo.postcode}
 onChange={(e) => setClientInfo(prev => ({ ...prev, postcode: e.target.value }))}
 placeholder="1234 AB"
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="plaats">Plaats</Label>
 <Input
 id="plaats"
 value={clientInfo.plaats}
 onChange={(e) => setClientInfo(prev => ({ ...prev, plaats: e.target.value }))}
 placeholder="Amsterdam"
 />
 </div>
 </div>
 
 <div className="flex justify-end">
 <Button 
 onClick={() => setCurrentStep('service')}
 disabled={!canProceedFromClient()}
 >
 Volgende: Service Details
 </Button>
 </div>
 </div>
 )

 const renderServiceStep = () => (
 <div className="space-y-6">
 <div className="text-center">
 <h3 className="text-lg font-semibold mb-2">Service Details</h3>
 <p className="text-sm text-muted-foreground">Beschrijf de geleverde diensten</p>
 </div>
 
 <div className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="serviceType">Type dienst *</Label>
 <Select value={serviceDetails.type} onValueChange={(value) => 
 setServiceDetails(prev => ({ ...prev, type: value }))
 }>
 <SelectTrigger>
 <SelectValue placeholder="Selecteer dienst type"/>
 </SelectTrigger>
 <SelectContent>
 {SERVICE_TYPES.map(type => (
 <SelectItem key={type} value={type}>{type}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 
 <div className="space-y-2">
 <Label htmlFor="beschrijving">Beschrijving diensten *</Label>
 <Textarea
 id="beschrijving"
 value={serviceDetails.beschrijving}
 onChange={(e) => setServiceDetails(prev => ({ ...prev, beschrijving: e.target.value }))}
 placeholder="Beschrijf de geleverde diensten in detail..."
 rows={4}
 />
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="periode">Periode / Duur</Label>
 <Input
 id="periode"
 value={serviceDetails.periode}
 onChange={(e) => setServiceDetails(prev => ({ ...prev, periode: e.target.value }))}
 placeholder="Bijv. Januari 2024, 40 uur, etc."
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="urgentie">Urgentie</Label>
 <Select 
 value={serviceDetails.urgentie} 
 onValueChange={(value:'Normaal'|'Hoog'|'Spoed') => 
 setServiceDetails(prev => ({ ...prev, urgentie: value }))
 }
 >
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="Normaal">Normaal</SelectItem>
 <SelectItem value="Hoog">Hoog</SelectItem>
 <SelectItem value="Spoed">Spoed</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>
 
 <div className="space-y-2">
 <Label htmlFor="bijzonderheden">Bijzonderheden</Label>
 <Textarea
 id="bijzonderheden"
 value={serviceDetails.bijzonderheden}
 onChange={(e) => setServiceDetails(prev => ({ ...prev, bijzonderheden: e.target.value }))}
 placeholder="Extra informatie, speciale afspraken, etc."
 rows={3}
 />
 </div>
 </div>
 
 <div className="flex justify-between">
 <Button variant="outline"onClick={() => setCurrentStep('client')}>
 Vorige
 </Button>
 <Button 
 onClick={() => setCurrentStep('media')}
 disabled={!canProceedFromService()}
 >
 Volgende: Documenten
 </Button>
 </div>
 </div>
 )

 const renderMediaStep = () => (
 <div className="space-y-6">
 <div className="text-center">
 <h3 className="text-lg font-semibold mb-2">Documenten (Optioneel)</h3>
 <p className="text-sm text-muted-foreground">Voeg relevante documenten toe voor betere AI analyse</p>
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <Card className="cursor-pointer hover:bg-muted transition-colors"onClick={handleCameraCapture}>
 <CardContent className="flex flex-col items-center justify-center p-6 text-center">
 <Camera className="w-12 h-12 text-primary mb-3"/>
 <h4 className="font-medium mb-1">Foto's maken</h4>
 <p className="text-sm text-muted-foreground">Maak foto's van documenten of werk</p>
 </CardContent>
 </Card>
 
 <Card className="cursor-pointer hover:bg-muted transition-colors"onClick={handleDocumentUpload}>
 <CardContent className="flex flex-col items-center justify-center p-6 text-center">
 <FileText className="w-12 h-12 text-primary mb-3"/>
 <h4 className="font-medium mb-1">Documenten</h4>
 <p className="text-sm text-muted-foreground">Upload contracten, specificaties, etc.</p>
 </CardContent>
 </Card>
 </div>
 
 {mediaFiles.length > 0 && (
 <div className="space-y-3">
 <h4 className="font-medium">Toegevoegde bestanden ({mediaFiles.length}/5)</h4>
 <ScrollArea className="h-32">
 <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
 {mediaFiles.map((media, index) => (
 <div key={index} className="relative group">
 <div className="aspect-square rounded-lg overflow-hidden bg-muted">
 {media.type ==='photo'? (
 <img 
 src={media.previewUrl} 
 alt={`Upload ${index + 1}`}
 className="w-full h-full object-cover"
 />
 ) : (
 <div className="w-full h-full flex items-center justify-center">
 <FileText className="w-8 h-8 text-muted-foreground"/>
 </div>
 )}
 </div>
 <Button
 size="sm"
 variant="destructive"
 className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
 onClick={() => removeMediaFile(index)}
 >
 <X className="w-3 h-3"/>
 </Button>
 <Badge 
 variant="secondary"
 className="absolute bottom-1 left-1 text-xs"
 >
 {media.type ==='photo'?'Foto':'Doc'}
 </Badge>
 </div>
 ))}
 </div>
 </ScrollArea>
 </div>
 )}
 
 <input
 ref={cameraInputRef}
 type="file"
 accept="image/*"
 capture="environment"
 multiple
 className="hidden"
 onChange={(e) => handleFileUpload(e.target.files,'photo')}
 />
 
 <input
 ref={fileInputRef}
 type="file"
 accept="image/*,.pdf,.doc,.docx,.txt"
 multiple
 className="hidden"
 onChange={(e) => handleFileUpload(e.target.files,'document')}
 />
 
 <div className="flex justify-between">
 <Button variant="outline"onClick={() => setCurrentStep('service')}>
 Vorige
 </Button>
 <Button onClick={() => setCurrentStep('review')}>
 Volgende: Controleren
 </Button>
 </div>
 </div>
 )

 const renderReviewStep = () => (
 <div className="space-y-6">
 <div className="text-center">
 <h3 className="text-lg font-semibold mb-2">Controleer en Genereer</h3>
 <p className="text-sm text-muted-foreground">Controleer de gegevens en laat AI de factuur genereren</p>
 </div>
 
 <div className="space-y-4">
 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-base flex items-center gap-2">
 <Building className="w-4 h-4"/>
 Klantgegevens
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-2 text-sm">
 <p><strong>Naam:</strong> {clientInfo.naam}</p>
 <p><strong>E-mail:</strong> {clientInfo.email}</p>
 {clientInfo.telefoon && <p><strong>Telefoon:</strong> {clientInfo.telefoon}</p>}
 {clientInfo.adres && (
 <p><strong>Adres:</strong> {clientInfo.adres}, {clientInfo.postcode} {clientInfo.plaats}</p>
 )}
 </CardContent>
 </Card>
 
 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-base flex items-center gap-2">
 <Calculator className="w-4 h-4"/>
 Service Details
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-2 text-sm">
 <p><strong>Type:</strong> {serviceDetails.type}</p>
 <p><strong>Beschrijving:</strong> {serviceDetails.beschrijving}</p>
 {serviceDetails.periode && <p><strong>Periode:</strong> {serviceDetails.periode}</p>}
 <p><strong>Urgentie:</strong> {serviceDetails.urgentie}</p>
 {serviceDetails.bijzonderheden && (
 <p><strong>Bijzonderheden:</strong> {serviceDetails.bijzonderheden}</p>
 )}
 </CardContent>
 </Card>
 
 {mediaFiles.length > 0 && (
 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-base flex items-center gap-2">
 <Upload className="w-4 h-4"/>
 Documenten ({mediaFiles.length} bestanden)
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="flex flex-wrap gap-2">
 {mediaFiles.map((media, index) => (
 <Badge key={index} variant="outline">
 {media.type ==='photo'?'Foto':'Document'} {index + 1}
 </Badge>
 ))}
 </div>
 </CardContent>
 </Card>
 )}
 </div>
 
 <div className="flex justify-between">
 <Button variant="outline"onClick={() => setCurrentStep('media')}>
 Vorige
 </Button>
 <Button 
 onClick={handleAIGeneration}
 disabled={isAnalyzing}
 className="bg-primary hover:bg-primary/90"
 >
 {isAnalyzing ? (
 <>
 <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
 AI Genereert...
 </>
 ) : (
 <>
 <Sparkles className="w-4 h-4 mr-2"/>
 Genereer Factuur met AI
 </>
 )}
 </Button>
 </div>
 </div>
 )

 return (
 <Dialog open={open} onOpenChange={handleClose}>
 <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2">
 <Sparkles className="w-5 h-5 text-primary"/>
 AI Factuur Generator
 </DialogTitle>
 <DialogDescription>
 Laat AI een professionele factuur genereren op basis van diensten en documenten
 </DialogDescription>
 </DialogHeader>
 
 <div className="flex items-center justify-center mb-6">
 <div className="flex items-center space-x-2">
 {['client','service','media','review'].map((step, index) => (
 <div key={step} className="flex items-center">
 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
 currentStep === step 
 ?'bg-primary text-primary-foreground'
 : index < ['client','service','media','review'].indexOf(currentStep)
 ?'bg-primary/20 text-primary'
 :'bg-muted text-muted-foreground'
 }`}>
 {index + 1}
 </div>
 {index < 3 && (
 <div className={`w-12 h-0.5 mx-2 ${
 index < ['client','service','media','review'].indexOf(currentStep)
 ?'bg-primary'
 :'bg-muted'
 }`} />
 )}
 </div>
 ))}
 </div>
 </div>
 
 <ScrollArea className="flex-1 px-1">
 {currentStep ==='client'&& renderClientStep()}
 {currentStep ==='service'&& renderServiceStep()}
 {currentStep ==='media'&& renderMediaStep()}
 {currentStep ==='review'&& renderReviewStep()}
 </ScrollArea>
 </DialogContent>
 </Dialog>
 )
}