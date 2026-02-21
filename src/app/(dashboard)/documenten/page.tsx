"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  FileText, 
  Upload, 
  Trash2, 
  Download, 
  Search, 
  File, 
  Image as ImageIcon, 
  FileCode, 
  MoreVertical,
  ExternalLink,
  Plus,
  Filter,
  FolderClosed,
  Sparkles
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArchonInlineLoader, ArchonLoader } from "@/components/archon-loader";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: {
    size: number;
    mimetype: string;
  };
}

export default function DocumentenPage() {
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const fetchFiles = useCallback(async (uid: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.storage
        .from("user-assets")
        .list(uid, {
          limit: 100,
          offset: 0,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) throw error;
      setFiles(data as any || []);
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("Kon documenten niet ophalen");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchFiles(user.id);
      }
    };
    checkAuth();
  }, [fetchFiles]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "document");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Document succesvol geüpload");
        fetchFiles(userId);
      } else {
        throw new Error(result.error || "Upload mislukt");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!userId || !confirm("Weet je zeker dat je dit document wilt verwijderen?")) return;

    try {
      const { error } = await supabase.storage
        .from("user-assets")
        .remove([`${userId}/${filename}`]);

      if (error) throw error;

      toast.success("Document verwijderd");
      setFiles(files.filter(f => f.name !== filename));
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Kon document niet verwijderen");
    }
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype.includes("image")) return <ImageIcon className="w-8 h-8 text-blue-400" />;
    if (mimetype.includes("pdf")) return <FileText className="w-8 h-8 text-red-400" />;
    if (mimetype.includes("json") || mimetype.includes("javascript")) return <FileCode className="w-8 h-8 text-amber-400" />;
    return <File className="w-8 h-8 text-slate-400" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getPublicUrl = (filename: string) => {
    const { data: { publicUrl } } = supabase.storage
      .from("user-assets")
      .getPublicUrl(`${userId}/${filename}`);
    return publicUrl;
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
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Mijn Documenten</h1>
          <p className="text-slate-400">Beheer al je bestanden in je persoonlijke ArchonPro kluis.</p>
        </div>

        <div className="flex items-center gap-3">
          <Input
            placeholder="Document zoeken..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 bg-slate-900/40 border-white/10 text-white placeholder:text-slate-500 rounded-xl focus:ring-amber-500/50"
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
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20"
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/40 backdrop-blur-xl border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Totaal Bestanden</p>
                <p className="text-2xl font-bold text-white">{files.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/40 backdrop-blur-xl border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Filter className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Opslag Gebruik</p>
                <p className="text-2xl font-bold text-white">
                  {formatSize(files.reduce((acc, curr) => acc + (curr.metadata?.size || 0), 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/40 backdrop-blur-xl border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Sparkles className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Ging Vandaag</p>
                <p className="text-2xl font-bold text-white">
                  {files.filter(f => new Date(f.created_at).toDateString() === new Date().toDateString()).length}
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
              <Card className="group relative bg-slate-900/40 backdrop-blur-xl border-white/10 hover:border-amber-500/50 hover:bg-slate-800/40 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5 group-hover:border-amber-500/30 transition-colors">
                      {getFileIcon(file.metadata?.mimetype || "")}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white -mr-2">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-white/10">
                        <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-white/5" onClick={() => window.open(getPublicUrl(file.name), '_blank')}>
                          <ExternalLink className="w-4 h-4 mr-2" /> Openen
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-white/5" asChild>
                          <a href={getPublicUrl(file.name)} download={file.name}>
                            <Download className="w-4 h-4 mr-2" /> Downloaden
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-400 focus:text-red-300 focus:bg-red-500/10" onClick={() => handleDelete(file.name)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Verwijderen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-semibold text-white truncate pr-6" title={file.name}>
                      {file.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{formatSize(file.metadata?.size || 0)}</span>
                      <span>•</span>
                      <span>{new Date(file.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Quick view button on hover */}
                  <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                    <Button 
                      variant="secondary" 
                      className="w-full bg-slate-950/50 border-white/10 text-white hover:bg-slate-800"
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
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 bg-slate-900/20 rounded-3xl border-2 border-dashed border-white/5">
            <FolderClosed className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">Geen documenten gevonden</p>
            <p className="text-sm">Upload je eerste bestand om te beginnen.</p>
          </div>
        )}
      </div>
    </div>
  );
}

