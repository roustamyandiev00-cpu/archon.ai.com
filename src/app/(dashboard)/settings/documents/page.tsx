"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, FileText, Check } from "lucide-react";

const PDF_TEMPLATES = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Fris ontwerp met blauw accent en duidelijke structuur',
    preview: '/templates/modern-preview.png'
  },
  {
    id: 'classic',
    name: 'Klassiek',
    description: 'Traditionele stijl met dubbele lijnen en borders',
    preview: '/templates/classic-preview.png'
  },
  {
    id: 'minimal',
    name: 'Minimalistisch',
    description: 'Clean design met veel witruimte en subtiele lijnen',
    preview: '/templates/minimal-preview.png'
  },
  {
    id: 'professional',
    name: 'Professioneel',
    description: 'Corporate stijl met donkerblauw thema',
    preview: '/templates/professional-preview.png'
  }
];

const AI_TONES = [
  { id: 'professional', name: 'Professioneel', description: 'Formeel en zakelijk' },
  { id: 'friendly', name: 'Vriendelijk', description: 'Warm en persoonlijk' },
  { id: 'formal', name: 'Formeel', description: 'Officieel en zakelijk' },
  { id: 'casual', name: 'Casual', description: 'Informeel en relaxed' }
];

export default function DocumentSettingsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [selectedTone, setSelectedTone] = useState('professional');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('supabase_access_token') || 
                   sessionStorage.getItem('supabase_access_token');

      if (!token) {
        toast.error("Niet ingelogd");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/settings", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success && result.data) {
        setSelectedTemplate(result.data.pdf_template_choice || 'modern');
        setSelectedTone(result.data.ai_default_tone || 'professional');
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Kon instellingen niet laden");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);

    try {
      const token = localStorage.getItem('supabase_access_token') || 
                   sessionStorage.getItem('supabase_access_token');

      if (!token) {
        toast.error("Niet ingelogd");
        return;
      }

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pdf_template_choice: selectedTemplate,
          ai_default_tone: selectedTone
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Instellingen opgeslagen!");
      } else {
        toast.error(result.error || "Opslaan mislukt");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Fout bij het opslaan");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Document Instellingen</h1>
        <p className="text-muted-foreground">
          Configureer je standaard PDF sjablonen en AI voorkeuren
        </p>
      </div>

      {/* PDF Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            PDF Sjabloon
          </CardTitle>
          <CardDescription>
            Kies het standaard ontwerp voor je offertes en facturen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedTemplate}
            onValueChange={setSelectedTemplate}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {PDF_TEMPLATES.map((template) => (
              <div key={template.id}>
                <RadioGroupItem
                  value={template.id}
                  id={template.id}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={template.id}
                  className="flex flex-col items-start p-4 border-2 border-muted rounded-lg cursor-pointer hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="font-semibold">{template.name}</span>
                    {selectedTemplate === template.id && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                  {/* Template Preview Placeholder */}
                  <div className="mt-3 w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-md flex items-center justify-center">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                      {template.name} Preview
                    </span>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* AI Tone Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            AI Toon
          </CardTitle>
          <CardDescription>
            Kies de schrijfstijl voor AI-gegenereerde content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedTone}
            onValueChange={setSelectedTone}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {AI_TONES.map((tone) => (
              <div key={tone.id}>
                <RadioGroupItem
                  value={tone.id}
                  id={tone.id}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={tone.id}
                  className="flex flex-col p-4 border-2 border-muted rounded-lg cursor-pointer hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{tone.name}</span>
                    {selectedTone === tone.id && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tone.description}
                  </p>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Opslaan...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Instellingen Opslaan
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
