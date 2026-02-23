"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArchonLoader } from "@/components/archon-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Module {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  features: string;
  isActive: boolean;
  sortOrder: number;
}

export default function AdminModulesPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    features: "",
    isActive: true,
    sortOrder: "0",
  });

  // Check admin access on mount
  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session?.user) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/auth/me', {
          headers: { 
            'Authorization': `Bearer ${session.access_token}` 
          }
        });

        if (!response.ok) {
          throw new Error('Kon gebruikersgegevens niet ophalen');
        }

        const result = await response.json();
        const userRole = result.data?.role;
        
        if (userRole === 'admin' || userRole === 'ceo') {
          setIsAdmin(true);
        } else {
          toast.error('Geen toegang tot admin dashboard');
          router.push('/');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        toast.error('Er is een fout opgetreden bij de toegangscontrole');
        router.push('/');
      } finally {
        setAuthChecking(false);
      }
    };
    
    checkAdminAccess();
  }, [router]);

  useEffect(() => {
    if (isAdmin) {
      fetchModules();
    }
  }, [isAdmin]);

  const fetchModules = async () => {
    try {
      const response = await fetch("/api/modules");
      const result = await response.json();
      if (result.success) {
        setModules(result.data);
      } else {
        toast.error("Kon modules niet laden");
      }
    } catch (error) {
      toast.error("Fout bij het laden van modules");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload: any = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      price: parseFloat(formData.price),
      sortOrder: parseInt(formData.sortOrder),
      isActive: formData.isActive,
      features: formData.features.split("\n").filter(f => f.trim()),
    };

    if (editingModule) {
      payload.id = editingModule.id;
    }

    try {
      const response = await fetch("/api/modules", {
        method: editingModule ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(editingModule ? "Module bijgewerkt" : "Module aangemaakt");
        fetchModules();
        resetForm();
        setIsDialogOpen(false);
      } else {
        toast.error(result.error || "Actie mislukt");
      }
    } catch (error) {
      toast.error("Fout bij opslaan");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Weet je zeker dat je deze module wilt verwijderen?")) return;

    try {
      const response = await fetch(`/api/modules?id=${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Module verwijderd");
        fetchModules();
      } else {
        toast.error(result.error || "Verwijderen mislukt");
      }
    } catch (error) {
      toast.error("Fout bij verwijderen");
    }
  };

  const handleEdit = (module: Module) => {
    setEditingModule(module);
    setFormData({
      name: module.name,
      slug: module.slug,
      description: module.description || "",
      price: module.price.toString(),
      features: (() => {
        try {
          return JSON.parse(module.features || "[]").join("\n");
        } catch (e) {
          return "";
        }
      })(),
      isActive: module.isActive,
      sortOrder: module.sortOrder.toString(),
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingModule(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      price: "",
      features: "",
      isActive: true,
      sortOrder: "0",
    });
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <ArchonLoader size={100} text="Toegang controleren..." />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return <div className="p-6">Laden...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Module Beheer</h1>
          <p className="text-muted-foreground">
            Beheer modules en abonnementen voor gebruikers
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Nieuwe Module
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingModule ? "Module Bewerken" : "Nieuwe Module"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Naam *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                    placeholder="bijv: pro-pakket"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschrijving</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Prijs (€) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Sorteer Volgorde</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">Features (één per regel)</Label>
                <Textarea
                  id="features"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  rows={4}
                  placeholder="- Onbeperkt gebruik&#10;- Premium support&#10;- API toegang"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Actief</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button type="submit">
                  {editingModule ? "Bijwerken" : "Aanmaken"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Modules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Prijs</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Volgorde</TableHead>
                <TableHead className="w-[100px]">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Geen modules gevonden
                  </TableCell>
                </TableRow>
              ) : (
                modules.map((module) => (
                  <TableRow key={module.id}>
                    <TableCell className="font-medium">{module.name}</TableCell>
                    <TableCell>{module.slug}</TableCell>
                    <TableCell>€{module.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        module.isActive 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {module.isActive ? "Actief" : "Inactief"}
                      </span>
                    </TableCell>
                    <TableCell>{module.sortOrder}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(module)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(module.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
