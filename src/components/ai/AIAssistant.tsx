"use client";

import { useState, useRef } from"react";
import { createClient } from"@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from"@/components/ui/tabs";
import { Textarea } from"@/components/ui/textarea";
import { Input } from"@/components/ui/input";
import { Label } from"@/components/ui/label";
import { toast } from"sonner";
import {
 Mic,
 Upload,
 FileText,
 Image as ImageIcon,
 Send,
 Loader2,
 Paperclip,
 X
} from"lucide-react";

const supabase = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AIAssistantProps {
 entityType:'offerte'|'factuur'|'project'|'artikel';
 onGenerated?: (data: any) => void;
}

export default function AIAssistant({ entityType, onGenerated }: AIAssistantProps) {
 const [activeTab, setActiveTab] = useState<string>("text");
 const [textInput, setTextInput] = useState("");
 const [files, setFiles] = useState<File[]>([]);
 const [isRecording, setIsRecording] = useState(false);
 const [isGenerating, setIsGenerating] = useState(false);
 const fileInputRef = useRef<HTMLInputElement>(null);

 const entityLabels = {
 offerte:"Offerte",
 factuur:"Factuur",
 project:"Project",
 artikel:"Artikel"
 };

 const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
 const selectedFiles = Array.from(e.target.files || []);
 setFiles(prev => [...prev, ...selectedFiles]);
 };

 const removeFile = (index: number) => {
 setFiles(prev => prev.filter((_, i) => i !== index));
 };

 const startVoiceRecording = () => {
 if (!('webkitSpeechRecognition'in window) && !('SpeechRecognition'in window)) {
 toast.error("Spraakherkenning wordt niet ondersteund in deze browser");
 return;
 }

 const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
 const recognition = new SpeechRecognition();
 
 recognition.lang ='nl-NL';
 recognition.continuous = true;
 recognition.interimResults = true;

 recognition.onstart = () => {
 setIsRecording(true);
 toast.info("Spraakopname gestart...");
 };

 recognition.onresult = (event: any) => {
 let finalTranscript ='';
 for (let i = event.resultIndex; i < event.results.length; i++) {
 if (event.results[i].isFinal) {
 finalTranscript += event.results[i][0].transcript;
 }
 }
 if (finalTranscript) {
 setTextInput(prev => prev +''+ finalTranscript);
 }
 };

 recognition.onerror = (event: any) => {
 console.error('Speech recognition error:', event.error);
 toast.error("Spraakherkenning fout:"+ event.error);
 setIsRecording(false);
 };

 recognition.onend = () => {
 setIsRecording(false);
 toast.success("Spraakopname gestopt");
 };

 recognition.start();
 
 // Store recognition instance to stop it later
 (window as any).currentRecognition = recognition;
 };

 const stopVoiceRecording = () => {
 if ((window as any).currentRecognition) {
 (window as any).currentRecognition.stop();
 }
 setIsRecording(false);
 };

 const generateWithAI = async () => {
 if (!textInput.trim() && files.length === 0) {
 toast.error("Voer tekst in of upload bestanden");
 return;
 }

 setIsGenerating(true);

 try {
 // Get session from Supabase (not localStorage - tokens are stored as cookies)
 const { data: { session } } = await supabase.auth.getSession();
 const token = session?.access_token;

 if (!token) {
 toast.error("Niet ingelogd");
 return;
 }

 const formData = new FormData();
 formData.append('entity_type', entityType);
 formData.append('input_type', files.length > 0 && textInput ?'combined': files.length > 0 ?'document': activeTab ==='voice'?'voice':'text');
 formData.append('text_input', textInput);

 files.forEach((file) => {
 formData.append('files', file);
 });

 const response = await fetch("/api/ai-generate", {
 method:"POST",
 headers: {
'Authorization': `Bearer ${token}`
 },
 body: formData
 });

 const result = await response.json();

 if (result.success) {
 toast.success(`${entityLabels[entityType]} succesvol gegenereerd!`);
 if (onGenerated) {
 onGenerated(result.data.generated_content);
 }
 // Reset form
 setTextInput("");
 setFiles([]);
 setActiveTab("text");
 } else {
 toast.error(result.error ||"Generatie mislukt");
 }
 } catch (error) {
 console.error("Error generating with AI:", error);
 toast.error("Fout bij AI-generatie");
 } finally {
 setIsGenerating(false);
 }
 };

 return (
 <Card className="w-full">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <span className="text-2xl">🤖</span>
 AI-Assistent - {entityLabels[entityType]} Genereren
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
 <TabsList className="grid w-full grid-cols-4">
 <TabsTrigger value="text"className="flex items-center gap-2">
 <FileText className="w-4 h-4"/>
 Tekst
 </TabsTrigger>
 <TabsTrigger value="voice"className="flex items-center gap-2">
 <Mic className="w-4 h-4"/>
 Spraak
 </TabsTrigger>
 <TabsTrigger value="document"className="flex items-center gap-2">
 <Upload className="w-4 h-4"/>
 Document
 </TabsTrigger>
 <TabsTrigger value="image"className="flex items-center gap-2">
 <ImageIcon className="w-4 h-4"/>
 Foto
 </TabsTrigger>
 </TabsList>

 <TabsContent value="text"className="space-y-4">
 <div className="space-y-2">
 <Label>Beschrijf wat je wilt aanmaken:</Label>
 <Textarea
 placeholder={`Bijvoorbeeld:"Maak een offerte voor Jan de Vries voor 50 uur consultancy werk tegen €75/uur, met 21% BTW"`}
 value={textInput}
 onChange={(e) => setTextInput(e.target.value)}
 rows={5}
 />
 </div>
 </TabsContent>

 <TabsContent value="voice"className="space-y-4">
 <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
 <Button
 variant={isRecording ?"destructive":"default"}
 size="lg"
 onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
 className="mb-4"
 >
 {isRecording ? (
 <>
 <Loader2 className="w-5 h-5 mr-2 animate-spin"/>
 Stop Opname
 </>
 ) : (
 <>
 <Mic className="w-5 h-5 mr-2"/>
 Start Spraakopname
 </>
 )}
 </Button>
 <p className="text-sm text-muted-foreground text-center">
 {isRecording 
 ?"Spreek nu... Je tekst wordt automatisch omgezet."
 :"Klik op de knop en beschrijf wat je wilt aanmaken."}
 </p>
 </div>
 {textInput && (
 <div className="space-y-2">
 <Label>Gegenereerde tekst:</Label>
 <Textarea
 value={textInput}
 onChange={(e) => setTextInput(e.target.value)}
 rows={4}
 />
 </div>
 )}
 </TabsContent>

 <TabsContent value="document"className="space-y-4">
 <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
 <Input
 ref={fileInputRef}
 type="file"
 accept=".pdf,.doc,.docx,.txt"
 multiple
 onChange={handleFileUpload}
 className="hidden"
 />
 <Button
 variant="outline"
 size="lg"
 onClick={() => fileInputRef.current?.click()}
 className="mb-4"
 >
 <Upload className="w-5 h-5 mr-2"/>
 Upload Documenten
 </Button>
 <p className="text-sm text-muted-foreground text-center">
 Upload PDF, Word of tekstbestanden<br />
 De AI extraheert automatisch de relevante informatie.
 </p>
 </div>
 </TabsContent>

 <TabsContent value="image"className="space-y-4">
 <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
 <Input
 ref={fileInputRef}
 type="file"
 accept="image/*"
 multiple
 onChange={handleFileUpload}
 className="hidden"
 />
 <Button
 variant="outline"
 size="lg"
 onClick={() => fileInputRef.current?.click()}
 className="mb-4"
 >
 <ImageIcon className="w-5 h-5 mr-2"/>
 Upload Foto's
 </Button>
 <p className="text-sm text-muted-foreground text-center">
 Upload foto's van bonnen, offertes of documenten<br />
 De AI gebruikt OCR om tekst te herkennen.
 </p>
 </div>
 </TabsContent>
 </Tabs>

 {/* File Attachments Display */}
 {files.length > 0 && (
 <div className="space-y-2">
 <Label className="flex items-center gap-2">
 <Paperclip className="w-4 h-4"/>
 Bijlagen ({files.length}):
 </Label>
 <div className="flex flex-wrap gap-2">
 {files.map((file, index) => (
 <div key={index} className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-md text-sm">
 <span className="truncate max-w-[150px]">{file.name}</span>
 <button
 onClick={() => removeFile(index)}
 className="text-muted-foreground hover:text-destructive"
 >
 <X className="w-4 h-4"/>
 </button>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Action Buttons */}
 <div className="flex gap-2 pt-4 border-t">
 <Button
 variant="outline"
 onClick={() => {
 setTextInput("");
 setFiles([]);
 }}
 disabled={isGenerating}
 >
 <X className="w-4 h-4 mr-2"/>
 Wissen
 </Button>
 <Button
 onClick={generateWithAI}
 disabled={isGenerating || (!textInput.trim() && files.length === 0)}
 className="flex-1"
 >
 {isGenerating ? (
 <>
 <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
 AI Genereert...
 </>
 ) : (
 <>
 <Send className="w-4 h-4 mr-2"/>
 Genereer {entityLabels[entityType]} met AI
 </>
 )}
 </Button>
 </div>

 {/* Tips */}
 <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
 <strong>Tips:</strong>
 <ul className="list-disc list-inside mt-1 space-y-1">
 <li>Wees specifiek met namen, bedragen en datums</li>
 <li>Je kunt meerdere inputmethodes combineren</li>
 <li>De AI herkent automatisch producten, prijzen en klantgegevens</li>
 </ul>
 </div>
 </CardContent>
 </Card>
 );
}
