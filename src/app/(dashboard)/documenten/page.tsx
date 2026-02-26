"use client";

import { useState, useEffect, useCallback, type ChangeEvent } from "react";
import { 
  FileText, 
  Trash2, 
  Download, 
  File, 
  Image as ImageIcon, 
  FileCode, 
  MoreVertical,
  ExternalLink,
  Plus,
  Filter,
  FolderClosed,
  Sparkles,
  FolderKanban
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { ArchonInlineLoader, ArchonLoader } from "@/components/archon-loader";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserFile {
  name: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
  last_accessed_at?: string;
  metadata?: {
    size?: number;
    mimetype?: string;
  } | null;
}

interface Project {
  id: string;
  naam: string;
  status: string;
}

interface ProjectApiRow {
  id: string;
  naam: string;
  status: string;
}

export default function DocumentenPage() {
  const [files, setFiles] = useState<UserFile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [userId, setUserId] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.access_token) {
        setProjects([]);
        return;
      }

      const response = await fetch("/api/projecten?limit=200&offset=0", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Kon projecten niet laden.");
      }

      const payload = await response.json();
      const rows = Array.isArray(payload?.data) ? payload.data as ProjectApiRow[] : [];
      const mapped: Project[] = rows.map((row) => ({
        id: String(row.id),
        naam: String(row.naam ?? ""),
        status: String(row.status ?? "Actief"),
      }));

      mapped.sort((a, b) => a.naam.localeCompare(b.naam, "nl-NL"));
      setProjects(mapped);
    } catch (error) {
      // In dev toont Next een overlay bij console.error; gebruik een zachte melding i.p.v. een harde fout.
      console.warn('Projecten konden niet worden geladen:', error);
      setProjects([]);
      toast({
        title: 'Projecten niet geladen',
        description: 'We konden uw projecten niet ophalen, maar uw documentenkluis blijft beschikbaar.',
        variant: 'default',
      });
    }
  }, []);

  const fetchFiles = useCallback(async (uid: string, projectId?: string) => {
    try {
      setLoading(true);
      
      // Determine the folder path based on project selection
      let folderPath = uid;
      if (projectId && projectId !== "all") {
        folderPath = `${uid}/projects/${projectId}`;
      }

      const { data, error } = await supabase.storage
        .from("user-assets")
        .list(folderPath, {
          limit: 100,
          offset: 0,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) throw error;
      const fileItems = (data ?? []).filter((item: any) => {
        return item && item.name && item.metadata && typeof item.metadata === "object";
      });
      setFiles(fileItems as UserFile[]);
    } catch (error) {
      console.error("Error fetching files:", error);
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      const bucketMissing = message.includes("bucket") && message.includes("not found");
      toast({
        title: "Fout",
        description: bucketMissing
          ? "Storage bucket 'user-assets' ontbreekt. Maak deze bucket aan in Supabase."
          : "Kon documenten niet ophalen",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Auth error:', error)
          return
        }
        
        if (session?.user) {
          setUserId(session.user.id)
        } else {
          console.log('No authenticated user found')
          setLoading(false)
        }
      } catch (error) {
        console.error('Auth check error:', error)
        setLoading(false)
      }
    }
    void checkAuth()
  }, [])

  useEffect(() => {
    if (!userId) return;
    void fetchProjects();
  }, [fetchProjects, userId])

  // Refetch files when project selection changes
  useEffect(() => {
    if (userId) {
      void fetchFiles(userId, selectedProject)
    }
  }, [selectedProject, userId, fetchFiles])

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "document");
      
      // Add project context if a specific project is selected
      if (selectedProject && selectedProject !== "all") {
        formData.append("projectId", selectedProject);
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: 'include', // Send auth cookies
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Succes",
          description: "Document succesvol geüpload",
        });
        void fetchFiles(userId, selectedProject);
      } else {
        throw new Error(result.error || "Upload mislukt");
      }
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!userId || !confirm("Weet je zeker dat je dit document wilt verwijderen?")) return;

    try {
      // Determine the correct file path based on current project selection
      let filePath = `${userId}/${filename}`;
      if (selectedProject && selectedProject !== "all") {
        filePath = `${userId}/projects/${selectedProject}/${filename}`;
      }

      const { error } = await supabase.storage
        .from("user-assets")
        .remove([filePath]);

      if (error) throw error;

      toast({
        title: "Succes",
        description: "Document verwijderd",
      });
      setFiles((current) => current.filter((file) => file.name !== filename));
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        title: "Fout",
        description: "Kon document niet verwijderen",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype.includes("image")) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    if (mimetype.includes("pdf")) return <FileText className="w-8 h-8 text-red-500" />;
    if (mimetype.includes("json") || mimetype.includes("javascript")) return <FileCode className="w-8 h-8 text-amber-500" />;
    return <File className="w-8 h-8 text-muted-foreground" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getPublicUrl = (filename: string) => {
    if (!userId) return "#";

    // Determine the correct file path based on current project selection
    let filePath = `${userId}/${filename}`;
    if (selectedProject && selectedProject !== "all") {
      filePath = `${userId}/projects/${selectedProject}/${filename}`;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("user-assets")
      .getPublicUrl(filePath);
    return publicUrl;
  };

  const formatFileDate = (value?: string) => {
    if (!value) return "Onbekend";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Onbekend";
    return parsed.toLocaleDateString("nl-NL");
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && files.length === 0) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <ArchonLoader text="Documenten kluis openen..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">Mijn Documenten</h1>
          <p className="text-muted-foreground">Beheer al je bestanden in je persoonlijke ArchonPro kluis.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Project Selector */}
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecteer project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <FolderClosed className="w-4 h-4" />
                  Alle documenten
                </div>
              </SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-4 h-4" />
                    {project.naam}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Document zoeken..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64"
          />
          <div className="relative">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
            <Button 
              asChild 
              disabled={uploading}
              className="font-medium"
            >
              <label htmlFor="file-upload" className="cursor-pointer flex items-center gap-2">
                {uploading ? <ArchonInlineLoader size={18} /> : <Plus className="w-4 h-4" />}
                Uploaden
              </label>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <FileText className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Totaal Bestanden</p>
                <p className="text-2xl font-bold text-foreground">{files.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Filter className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Opslag Gebruik</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatSize(files.reduce((acc, curr) => acc + (curr.metadata?.size || 0), 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Sparkles className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nieuw Vandaag</p>
                <p className="text-2xl font-bold text-foreground">
                  {files.filter((file) => {
                    if (!file.created_at) return false;
                    return new Date(file.created_at).toDateString() === new Date().toDateString();
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <FolderKanban className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {selectedProject === "all" ? "Alle Projecten" : "Huidig Project"}
                </p>
                <p className="text-xl md:text-2xl font-bold text-foreground truncate max-w-[220px]">
                  {selectedProject === "all" ? projects.length : 
                   projects.find((project) => project.id === selectedProject)?.naam || "Onbekend"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredFiles.map((file, index) => (
            <motion.div
              key={file.id || file.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="group relative hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-muted/50 border transition-colors">
                      {getFileIcon(file.metadata?.mimetype || "")}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground -mr-2">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => window.open(getPublicUrl(file.name), '_blank')}>
                          <ExternalLink className="w-4 h-4 mr-2" /> Openen
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={getPublicUrl(file.name)} download={file.name}>
                            <Download className="w-4 h-4 mr-2" /> Downloaden
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(file.name)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Verwijderen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground truncate pr-6" title={file.name}>
                      {file.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatSize(file.metadata?.size || 0)}</span>
                      <span>•</span>
                      <span>{formatFileDate(file.created_at)}</span>
                    </div>
                  </div>

                  {/* Quick view button on hover */}
                  <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                    <Button 
                      variant="secondary" 
                      className="w-full"
                      onClick={() => window.open(getPublicUrl(file.name), '_blank')}
                    >
                      Bekijken
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredFiles.length === 0 && !loading && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-3xl border-2 border-dashed border-border">
            <FolderClosed className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">
              {selectedProject === "all" 
                ? "Geen documenten gevonden" 
                : `Geen documenten voor ${projects.find((project) => project.id === selectedProject)?.naam || "dit project"}`
              }
            </p>
            <p className="text-sm mt-1">
              {selectedProject === "all"
                ? "Upload je eerste bestand om te beginnen."
                : "Upload bestanden voor dit project om ze hier te zien."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
