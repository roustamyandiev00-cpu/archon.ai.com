"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Mail, 
  Users, 
  AlertTriangle,
  Settings,
  Database
} from "lucide-react";
import { toast } from "sonner";

interface UserData {
  user_id: string;
  email: string;
  email_confirmed_at: string | null;
  email_verified: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  user_metadata: any;
}

export default function EmailVerificationAdminPage() {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [forceLogoutLoading, setForceLogoutLoading] = useState(false);

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/check-current-user');
      const result = await response.json();
      
      if (result.success && result.authenticated) {
        setCurrentUser(result.data);
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Error checking current user:', error);
      toast.error('Fout bij ophalen gebruikersgegevens');
    } finally {
      setLoading(false);
    }
  };

  const handleForceLogoutUnverified = async () => {
    setForceLogoutLoading(true);
    try {
      const response = await fetch('/api/auth/force-logout-unverified', {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        if (result.verified) {
          toast.success('Gebruiker is al geverifieerd');
        } else {
          toast.success('Ongecontroleerde gebruiker uitgelogd');
          // Redirect will happen automatically
          setTimeout(() => {
            window.location.href = result.redirect;
          }, 1500);
        }
      } else {
        toast.error('Fout bij uitloggen');
      }
    } catch (error) {
      console.error('Error forcing logout:', error);
      toast.error('Er is een fout opgetreden');
    } finally {
      setForceLogoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Email Verificatie Beheer</h1>
        <p className="text-muted-foreground">Controleer en beheer email verificatie status</p>
      </div>

      {/* Current User Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Huidige Gebruiker Status
          </CardTitle>
          <CardDescription>
            Overzicht van de ingelogde gebruiker en verificatie status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentUser ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="font-mono text-sm">{currentUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User ID</label>
                  <p className="font-mono text-xs">{currentUser.user_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Verificatie Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    {currentUser.email_verified ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                          Geverifieerd
                        </Badge>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-500" />
                        <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
                          Niet Geverifieerd
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Geverifieerd op</label>
                  <p className="text-sm">
                    {currentUser.email_confirmed_at 
                      ? new Date(currentUser.email_confirmed_at).toLocaleString('nl-NL')
                      : 'Nog niet geverifieerd'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Account aangemaakt</label>
                  <p className="text-sm">
                    {new Date(currentUser.created_at).toLocaleString('nl-NL')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Laatste login</label>
                  <p className="text-sm">
                    {currentUser.last_sign_in_at 
                      ? new Date(currentUser.last_sign_in_at).toLocaleString('nl-NL')
                      : 'Nooit ingelogd'
                    }
                  </p>
                </div>
              </div>

              {!currentUser.email_verified && (
                <Alert className="border-amber-500/20 bg-amber-500/10">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground mb-1">
                          Gebruiker is niet geverifieerd
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Deze gebruiker heeft toegang tot het dashboard zonder email verificatie.
                          Dit is een beveiligingsrisico.
                        </p>
                      </div>
                      <Button
                        onClick={handleForceLogoutUnverified}
                        disabled={forceLogoutLoading}
                        size="sm"
                        className="ml-4"
                      >
                        {forceLogoutLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          "Uitloggen"
                        )}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Geen gebruiker ingelogd</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Acties
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={checkCurrentUser}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Status Vernieuwen
            </Button>
            
            <Button
              onClick={() => window.location.href = '/auth/verify-email'}
              variant="outline"
              className="w-full"
            >
              <Mail className="w-4 h-4 mr-2" />
              Naar Verificatie Pagina
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Supabase Configuratie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Email verificatie configureren in Supabase:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Ga naar je Supabase project dashboard</li>
                  <li>Navigeer naar Authentication → Settings</li>
                  <li>Zet "Enable email confirmations" aan</li>
                  <li>Zet "Confirm email" aan</li>
                  <li>Configureer je email templates</li>
                  <li>Voeg redirect URLs toe</li>
                </ol>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}