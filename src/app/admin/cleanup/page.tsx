"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Database,
  Shield
} from "lucide-react";
import { toast } from "sonner";

export default function CleanupPage() {
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<any>(null);

  const handleCleanupMockData = async () => {
    if (!confirm('Weet je zeker dat je alle mockdata wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
      return;
    }

    const cronSecret = prompt('Voer de CRON_SECRET in voor beveiliging:');
    if (!cronSecret) {
      toast.error('CRON_SECRET is vereist');
      return;
    }

    setIsCleaningUp(true);
    setCleanupResult(null);

    try {
      const response = await fetch('/api/admin/cleanup-mock-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorization: cronSecret
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setCleanupResult(result);
        toast.success(`Mockdata opgeruimd! ${result.deletedRecords} records verwijderd.`);
      } else {
        toast.error(result.error || 'Fout bij opruimen mockdata');
      }
    } catch (error) {
      console.error('Error cleaning up mock data:', error);
      toast.error('Er is een fout opgetreden');
    } finally {
      setIsCleaningUp(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Database Cleanup</h1>
        <p className="text-muted-foreground">Verwijder mockdata en testgegevens uit de productie database</p>
      </div>

      {/* Warning */}
      <Alert className="border-amber-500/20 bg-amber-500/10">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <AlertDescription>
          <p className="font-medium text-foreground mb-2">
            ⚠️ Waarschuwing: Destructieve Actie
          </p>
          <p className="text-sm text-muted-foreground">
            Deze actie verwijdert alle mockdata permanent uit de database. 
            Dit zorgt ervoor dat nieuwe gebruikers starten met een schone database zonder testgegevens.
          </p>
        </AlertDescription>
      </Alert>

      {/* Mock Data Cleanup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Mockdata Verwijderen
          </CardTitle>
          <CardDescription>
            Verwijder alle testgegevens zoals ACME BV, TechStart NV, etc.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Te verwijderen mockdata:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Bedrijven: ACME BV, TechStart NV, Global Solutions</li>
              <li>Contacten: Jan de Vries, Maria Jansen, Peter Smit</li>
              <li>Deals: Software License, Consultancy Project, Annual Support</li>
              <li>Projecten: Website Redesign, Mobile App, CRM Integration</li>
              <li>Offertes: 2025-001, 2025-002, 2025-003</li>
              <li>Test artikelen en facturen</li>
            </ul>
          </div>

          <Button
            onClick={handleCleanupMockData}
            disabled={isCleaningUp}
            className="w-full"
            variant="destructive"
          >
            {isCleaningUp ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Mockdata verwijderen...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Verwijder Alle Mockdata
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Cleanup Result */}
      {cleanupResult && (
        <Card className="border-green-500/20 bg-green-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Cleanup Voltooid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Totaal verwijderd: {cleanupResult.deletedRecords} records
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Bedrijven:</span> {cleanupResult.details.bedrijven}
                </div>
                <div>
                  <span className="font-medium">Contacten:</span> {cleanupResult.details.contacten}
                </div>
                <div>
                  <span className="font-medium">Deals:</span> {cleanupResult.details.deals}
                </div>
                <div>
                  <span className="font-medium">Projecten:</span> {cleanupResult.details.projecten}
                </div>
                <div>
                  <span className="font-medium">Offertes:</span> {cleanupResult.details.offertes}
                </div>
                <div>
                  <span className="font-medium">Facturen:</span> {cleanupResult.details.facturen}
                </div>
                <div>
                  <span className="font-medium">Artikelen:</span> {cleanupResult.details.artikelen}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Beveiliging
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Deze actie vereist de CRON_SECRET voor beveiliging</p>
            <p>• Alleen admins kunnen deze functie gebruiken</p>
            <p>• Alle acties worden gelogd</p>
            <p>• Backup je database voordat je deze actie uitvoert</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}