'use client'

import { useState, useRef, useCallback, useEffect } from'react'
import { Camera, FileText, Upload, X, Loader2, Sparkles, Calculator, MapPin } from'lucide-react'

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

interface AIOfferteModalProps {
 open: boolean
 onOpenChange: (open: boolean) => void
 onSuccess?: () => void
}

interface MediaFile {
 file: File
 previewUrl: string
 type:'photo'|'document'
}

interface ContactInfo {
 naam: string
 email: string
 telefoon: string
 adres: string
 postcode: string
 plaats: string
}

interface ProjectDetails {
 type: string
 beschrijving: string
 afmetingen: {
 lengte: string
 breedte: string
 hoogte: string
 eenheid:'mm'|'cm'|'m'
 }
 materialen: string
 bijzonderheden: string
}

const PROJECT_TYPES = [
'Laminaat leggen',
'Parket leggen', 
'Tegelwerk',
'Tuinwerken',
'Schilderwerk',
'Badkamer renovatie',
'Keuken plaatsen',
'Dakwerk',
'Isolatie',
'Elektra',
'Loodgieterwerk',
'Overig'
]

export default function AIOfferteModal({ open, onOpenChange, onSuccess }: AIOfferteModalProps) {
 const [isAnalyzing, setIsAnalyzing] = useState(false)
 const [currentStep, setCurrentStep] = useState<'contact'|'project'|'media'|'review'>('contact')
 const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
 const [contactInfo, setContactInfo] = useState<ContactInfo>({
 naam:'',
 email:'',
 telefoon:'',
 adres:'',
 postcode:'',
 plaats:''
 })
 const [projectDetails, setProjectDetails] = useState<ProjectDetails>({
 type:'',
 beschrijving:'',
 afmetingen: {
 lengte:'',
 breedte:'',
 hoogte:'',
 eenheid:'m'
 },
 materialen:'',
 bijzonderheden:''
 })
 const [aiAnalysis, setAiAnalysis] = useState<any>(null)
 
 const fileInputRef = useRef<HTMLInputElement>(null)
 const cameraInputRef = useRef<HTMLInputElement>(null)
 const mediaFilesRef = useRef<MediaFile[]>([])

 useEffect(() => {
 mediaFilesRef.current = mediaFiles
 }, [mediaFiles])

 useEffect(() => {
 return () => {
 mediaFilesRef.current.forEach((media) => {
 URL.revokeObjectURL(media.previewUrl)
 })
 }
 }, [])

 const handleFileUpload = useCallback((files: FileList | null, type:'photo'|'document') => {
 if (!files) return
 const incomingFiles = Array.from(files)
 let overflowCount = 0
 let invalidTypeCount = 0
 let oversizedCount = 0

 setMediaFiles((previous) => {
 const next = [...previous]

 for (const file of incomingFiles) {
 if (next.length >= 10) {
 overflowCount += 1
 continue
 }

 const isImage = file.type.startsWith('image/')
 const isDocument =
 file.type ==='application/pdf'||
 file.type.includes('document') ||
 file.type.includes('text')

 if (type ==='photo'&& !isImage) {
 invalidTypeCount += 1
 continue
 }

 if (type ==='document'&& !isDocument && !isImage) {
 invalidTypeCount += 1
 continue
 }

 if (file.size > 5 * 1024 * 1024) {
 oversizedCount += 1
 continue
 }

 next.push({
 file,
 previewUrl: URL.createObjectURL(file),
 type,
 })
 }

 return next
 })

 if (overflowCount > 0) {
 toast({
 title:'Maximum bereikt',
 description:'Je kunt maximaal 10 bestanden uploaden.',
 variant:'destructive',
 })
 }

 if (invalidTypeCount > 0) {
 toast({
 title:'Ongeldig bestandstype',
 description:
 type ==='photo'
 ?"Alleen afbeeldingen zijn toegestaan voor foto's."
 :'Alleen documenten en afbeeldingen zijn toegestaan.',
 variant:'destructive',
 })
 }

 if (oversizedCount > 0) {
 toast({
 title:'Bestand te groot',
 description:'Bestanden mogen maximaal 5MB zijn.',
 variant:'destructive',
 })
 }
 }, [])

 const removeMediaFile = (index: number) => {
 setMediaFiles(prev => {
 const file = prev[index]
 if (file) {
 URL.revokeObjectURL(file.previewUrl)
 }
 return prev.filter((_, i) => i !== index)
 })
 }

 const handleCameraCapture = () => {
 cameraInputRef.current?.click()
 }

 const handleDocumentUpload = () => {
 fileInputRef.current?.click()
 }

 const canProceedFromContact = () => {
 return contactInfo.naam.trim() && contactInfo.email.trim() && contactInfo.telefoon.trim()
 }

 const canProceedFromProject = () => {
 return projectDetails.type && projectDetails.beschrijving.trim()
 }

 const canProceedFromMedia = () => {
 return mediaFiles.length > 0 || projectDetails.afmetingen.lengte || projectDetails.afmetingen.breedte
 }

 const handleAIAnalysis = async () => {
 setIsAnalyzing(true)
 
 try {
 const formData = new FormData()
 
 // Add contact info
 formData.append('klant', contactInfo.naam)
 formData.append('email', contactInfo.email)
 formData.append('telefoon', contactInfo.telefoon)
 formData.append('adres', `${contactInfo.adres}, ${contactInfo.postcode} ${contactInfo.plaats}`)
 
 // Add project details
 formData.append('projectType', projectDetails.type)
 formData.append('beschrijving', projectDetails.beschrijving)
 formData.append('materialen', projectDetails.materialen)
 formData.append('bijzonderheden', projectDetails.bijzonderheden)
 
 // Add dimensions
 const dimensions = {
 lengte: projectDetails.afmetingen.lengte ? parseFloat(projectDetails.afmetingen.lengte) : null,
 breedte: projectDetails.afmetingen.breedte ? parseFloat(projectDetails.afmetingen.breedte) : null,
 hoogte: projectDetails.afmetingen.hoogte ? parseFloat(projectDetails.afmetingen.hoogte) : null,
 eenheid: projectDetails.afmetingen.eenheid
 }
 formData.append('afmetingen', JSON.stringify(dimensions))
 
 // Add media files
 mediaFiles.forEach((media, index) => {
 formData.append(`media_${index}`, media.file)
 formData.append(`media_${index}_type`, media.type)
 })
 
 formData.append('aiProvider','gemini')
 formData.append('generateOfferte','true')
 
 const response = await fetch('/api/offertes/ai-generate', {
 method:'POST',
 body: formData
 })
 
 if (!response.ok) {
 throw new Error('AI analyse mislukt')
 }
 
 const result = await response.json()
 setAiAnalysis(result)
 
 if (result.warning) {
 toast({
 title:"Offerte aangemaakt",
 description: result.warning,
 variant:"default"
 })
 } else {
 toast({
 title:"AI Analyse voltooid",
 description:"De offerte is succesvol gegenereerd met AI.",
 })
 }
 
 // Reset form and close modal
 resetForm()
 onSuccess?.()
 onOpenChange(false)
 
 } catch (error) {
 console.error('AI Analysis error:', error)
 toast({
 title:"Analyse mislukt",
 description:"Er is een fout opgetreden bij de AI analyse. Probeer het opnieuw.",
 variant:"destructive"
 })
 } finally {
 setIsAnalyzing(false)
 }
 }

 const resetForm = () => {
 setCurrentStep('contact')
 setMediaFiles((previous) => {
 previous.forEach((media) => URL.revokeObjectURL(media.previewUrl))
 return []
 })
 setContactInfo({
 naam:'',
 email:'',
 telefoon:'',
 adres:'',
 postcode:'',
 plaats:''
 })
 setProjectDetails({
 type:'',
 beschrijving:'',
 afmetingen: {
 lengte:'',
 breedte:'',
 hoogte:'',
 eenheid:'m'
 },
 materialen:'',
 bijzonderheden:''
 })
 setAiAnalysis(null)
 }

 const handleClose = () => {
 resetForm()
 onOpenChange(false)
 }

 const renderContactStep = () => (
 <div className="space-y-6">
 <div className="text-center">
 <h3 className="text-lg font-semibold mb-2">Contactgegevens</h3>
 <p className="text-sm text-muted-foreground">Vul de klantgegevens in voor de offerte</p>
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="naam">Naam *</Label>
 <Input
 id="naam"
 value={contactInfo.naam}
 onChange={(e) => setContactInfo(prev => ({ ...prev, naam: e.target.value }))}
 placeholder="Voor- en achternaam"
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="email">E-mail *</Label>
 <Input
 id="email"
 type="email"
 value={contactInfo.email}
 onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
 placeholder="email@voorbeeld.nl"
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="telefoon">Telefoon *</Label>
 <Input
 id="telefoon"
 value={contactInfo.telefoon}
 onChange={(e) => setContactInfo(prev => ({ ...prev, telefoon: e.target.value }))}
 placeholder="06-12345678"
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="adres">Adres</Label>
 <Input
 id="adres"
 value={contactInfo.adres}
 onChange={(e) => setContactInfo(prev => ({ ...prev, adres: e.target.value }))}
 placeholder="Straat en huisnummer"
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="postcode">Postcode</Label>
 <Input
 id="postcode"
 value={contactInfo.postcode}
 onChange={(e) => setContactInfo(prev => ({ ...prev, postcode: e.target.value }))}
 placeholder="1234 AB"
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="plaats">Plaats</Label>
 <Input
 id="plaats"
 value={contactInfo.plaats}
 onChange={(e) => setContactInfo(prev => ({ ...prev, plaats: e.target.value }))}
 placeholder="Amsterdam"
 />
 </div>
 </div>
 
 <div className="flex justify-end">
 <Button 
 onClick={() => setCurrentStep('project')}
 disabled={!canProceedFromContact()}
 >
 Volgende: Project Details
 </Button>
 </div>
 </div>
 )

 const renderProjectStep = () => (
 <div className="space-y-6">
 <div className="text-center">
 <h3 className="text-lg font-semibold mb-2">Project Details</h3>
 <p className="text-sm text-muted-foreground">Beschrijf het project en de gewenste werkzaamheden</p>
 </div>
 
 <div className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="projectType">Type project *</Label>
 <Select value={projectDetails.type} onValueChange={(value) => 
 setProjectDetails(prev => ({ ...prev, type: value }))
 }>
 <SelectTrigger>
 <SelectValue placeholder="Selecteer project type"/>
 </SelectTrigger>
 <SelectContent>
 {PROJECT_TYPES.map(type => (
 <SelectItem key={type} value={type}>{type}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 
 <div className="space-y-2">
 <Label htmlFor="beschrijving">Beschrijving *</Label>
 <Textarea
 id="beschrijving"
 value={projectDetails.beschrijving}
 onChange={(e) => setProjectDetails(prev => ({ ...prev, beschrijving: e.target.value }))}
 placeholder="Beschrijf het gewenste werk in detail..."
 rows={4}
 />
 </div>
 
 <div className="space-y-2">
 <Label>Afmetingen (optioneel)</Label>
 <div className="grid grid-cols-4 gap-2">
 <Input
 placeholder="Lengte"
 value={projectDetails.afmetingen.lengte}
 onChange={(e) => setProjectDetails(prev => ({
 ...prev,
 afmetingen: { ...prev.afmetingen, lengte: e.target.value }
 }))}
 />
 <Input
 placeholder="Breedte"
 value={projectDetails.afmetingen.breedte}
 onChange={(e) => setProjectDetails(prev => ({
 ...prev,
 afmetingen: { ...prev.afmetingen, breedte: e.target.value }
 }))}
 />
 <Input
 placeholder="Hoogte"
 value={projectDetails.afmetingen.hoogte}
 onChange={(e) => setProjectDetails(prev => ({
 ...prev,
 afmetingen: { ...prev.afmetingen, hoogte: e.target.value }
 }))}
 />
 <Select 
 value={projectDetails.afmetingen.eenheid} 
 onValueChange={(value:'mm'|'cm'|'m') => 
 setProjectDetails(prev => ({
 ...prev,
 afmetingen: { ...prev.afmetingen, eenheid: value }
 }))
 }
 >
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="mm">mm</SelectItem>
 <SelectItem value="cm">cm</SelectItem>
 <SelectItem value="m">m</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>
 
 <div className="space-y-2">
 <Label htmlFor="materialen">Gewenste materialen</Label>
 <Input
 id="materialen"
 value={projectDetails.materialen}
 onChange={(e) => setProjectDetails(prev => ({ ...prev, materialen: e.target.value }))}
 placeholder="Bijv. eiken laminaat, wit sanitair, etc."
 />
 </div>
 
 <div className="space-y-2">
 <Label htmlFor="bijzonderheden">Bijzonderheden</Label>
 <Textarea
 id="bijzonderheden"
 value={projectDetails.bijzonderheden}
 onChange={(e) => setProjectDetails(prev => ({ ...prev, bijzonderheden: e.target.value }))}
 placeholder="Speciale wensen, toegankelijkheid, timing, etc."
 rows={3}
 />
 </div>
 </div>
 
 <div className="flex justify-between">
 <Button variant="outline"onClick={() => setCurrentStep('contact')}>
 Vorige
 </Button>
 <Button 
 onClick={() => setCurrentStep('media')}
 disabled={!canProceedFromProject()}
 >
 Volgende: Media Toevoegen
 </Button>
 </div>
 </div>
 )

 const renderMediaStep = () => (
 <div className="space-y-6">
 <div className="text-center">
 <h3 className="text-lg font-semibold mb-2">Foto's en Documenten</h3>
 <p className="text-sm text-muted-foreground">Voeg foto's en documenten toe voor een betere AI analyse</p>
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <Card className="cursor-pointer hover:bg-muted transition-colors"onClick={handleCameraCapture}>
 <CardContent className="flex flex-col items-center justify-center p-6 text-center">
 <Camera className="w-12 h-12 text-primary mb-3"/>
 <h4 className="font-medium mb-1">Foto's maken</h4>
 <p className="text-sm text-muted-foreground">Maak foto's van de ruimte of het project</p>
 </CardContent>
 </Card>
 
 <Card className="cursor-pointer hover:bg-muted transition-colors"onClick={handleDocumentUpload}>
 <CardContent className="flex flex-col items-center justify-center p-6 text-center">
 <FileText className="w-12 h-12 text-primary mb-3"/>
 <h4 className="font-medium mb-1">Documenten</h4>
 <p className="text-sm text-muted-foreground">Upload tekeningen, specificaties, etc.</p>
 </CardContent>
 </Card>
 </div>
 
 {mediaFiles.length > 0 && (
 <div className="space-y-3">
 <h4 className="font-medium">Toegevoegde bestanden ({mediaFiles.length}/10)</h4>
 <ScrollArea className="h-48">
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
 <Button variant="outline"onClick={() => setCurrentStep('project')}>
 Vorige
 </Button>
 <Button 
 onClick={() => setCurrentStep('review')}
 disabled={!canProceedFromMedia()}
 >
 Volgende: Controleren
 </Button>
 </div>
 </div>
 )

 const renderReviewStep = () => (
 <div className="space-y-6">
 <div className="text-center">
 <h3 className="text-lg font-semibold mb-2">Controleer en Genereer</h3>
 <p className="text-sm text-muted-foreground">Controleer de gegevens en laat AI de offerte genereren</p>
 </div>
 
 <div className="space-y-4">
 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-base flex items-center gap-2">
 <MapPin className="w-4 h-4"/>
 Klantgegevens
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-2 text-sm">
 <p><strong>Naam:</strong> {contactInfo.naam}</p>
 <p><strong>E-mail:</strong> {contactInfo.email}</p>
 <p><strong>Telefoon:</strong> {contactInfo.telefoon}</p>
 {contactInfo.adres && (
 <p><strong>Adres:</strong> {contactInfo.adres}, {contactInfo.postcode} {contactInfo.plaats}</p>
 )}
 </CardContent>
 </Card>
 
 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-base flex items-center gap-2">
 <Calculator className="w-4 h-4"/>
 Project Details
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-2 text-sm">
 <p><strong>Type:</strong> {projectDetails.type}</p>
 <p><strong>Beschrijving:</strong> {projectDetails.beschrijving}</p>
 {(projectDetails.afmetingen.lengte || projectDetails.afmetingen.breedte || projectDetails.afmetingen.hoogte) && (
 <p><strong>Afmetingen:</strong> {projectDetails.afmetingen.lengte ||'?'} × {projectDetails.afmetingen.breedte ||'?'} × {projectDetails.afmetingen.hoogte ||'?'} {projectDetails.afmetingen.eenheid}</p>
 )}
 {projectDetails.materialen && (
 <p><strong>Materialen:</strong> {projectDetails.materialen}</p>
 )}
 {projectDetails.bijzonderheden && (
 <p><strong>Bijzonderheden:</strong> {projectDetails.bijzonderheden}</p>
 )}
 </CardContent>
 </Card>
 
 {mediaFiles.length > 0 && (
 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-base flex items-center gap-2">
 <Upload className="w-4 h-4"/>
 Media ({mediaFiles.length} bestanden)
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
 onClick={handleAIAnalysis}
 disabled={isAnalyzing}
 className="bg-primary hover:bg-primary/90"
 >
 {isAnalyzing ? (
 <>
 <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
 AI Analyseert...
 </>
 ) : (
 <>
 <Sparkles className="w-4 h-4 mr-2"/>
 Genereer Offerte met AI
 </>
 )}
 </Button>
 </div>
 </div>
 )

 return (
 <Dialog open={open} onOpenChange={handleClose}>
 <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2">
 <Sparkles className="w-5 h-5 text-primary"/>
 AI Offerte Generator
 </DialogTitle>
 <DialogDescription>
 Laat AI een professionele offerte genereren op basis van foto's, documenten en projectdetails
 </DialogDescription>
 </DialogHeader>
 
 <div className="flex items-center justify-center mb-4">
 <div className="flex items-center space-x-2">
 {['contact','project','media','review'].map((step, index) => (
 <div key={step} className="flex items-center">
 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
 currentStep === step 
 ?'bg-primary text-primary-foreground'
 : index < ['contact','project','media','review'].indexOf(currentStep)
 ?'bg-primary/20 text-primary'
 :'bg-muted text-muted-foreground'
 }`}>
 {index + 1}
 </div>
 {index < 3 && (
 <div className={`w-12 h-0.5 mx-2 ${
 index < ['contact','project','media','review'].indexOf(currentStep)
 ?'bg-primary'
 :'bg-muted'
 }`} />
 )}
 </div>
 ))}
 </div>
 </div>
 
 <ScrollArea className="flex-1 px-1 pb-2">
 {currentStep ==='contact'&& renderContactStep()}
 {currentStep ==='project'&& renderProjectStep()}
 {currentStep ==='media'&& renderMediaStep()}
 {currentStep ==='review'&& renderReviewStep()}
 </ScrollArea>
 </DialogContent>
 </Dialog>
 )
}
