"use client";

import { useState, useEffect, useCallback, useMemo, type ChangeEvent } from"react";
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
 FolderKanban,
 RefreshCw,
 ArrowUpDown
} from"lucide-react";
import { supabase } from"@/lib/supabase";
import { Card, CardContent } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { toast } from"@/hooks/use-toast";
import { ArchonInlineLoader, ArchonLoader } from"@/components/archon-loader";
import { motion, AnimatePresence } from"framer-motion";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from"@/components/ui/dropdown-menu";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from"@/components/ui/select";

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

type FileTypeFilter ="all"|"images"|"pdf"|"docs"|"code"|"other";
type SortOption ="nieuwste"|"oudste"|"naam_az"|"naam_za"|"grootste"|"kleinste";

interface DocumentRecord {
 id: string;
 name: string;
 path: string;
 size: number;
 mimetype: string;
 createdAt?: string;
 updatedAt?: string;
 projectId: string | null;
 projectName: string | null;
}

const typeLabel: Record<FileTypeFilter, string> = {
 all:"Alle types",
 images:"Afbeeldingen",
 pdf:"PDF",
 docs:"Documenten",
 code:"Code/JSON",
 other:"Overig",
};

function getExtension(filename: string) {
 const parts = filename.toLowerCase().split(".");
 if (parts.length <= 1) return"";
 return parts.pop() ??"";
}

function guessMimeType(filename: string) {
 const ext = getExtension(filename);
 if (!ext) return"application/octet-stream";
 if (["png","jpg","jpeg","gif","webp","svg","heic"].includes(ext)) return `image/${ext ==="jpg"?"jpeg": ext}`;
 if (ext ==="pdf") return"application/pdf";
 if (["json"].includes(ext)) return"application/json";
 if (["js","jsx","ts","tsx","mjs","cjs"].includes(ext)) return"application/javascript";
 if (["md","txt","csv","doc","docx","xls","xlsx","rtf","odt"].includes(ext)) return"text/plain";
 return"application/octet-stream";
}

function getFileCategory(file: Pick<DocumentRecord,"mimetype"|"name">): FileTypeFilter {
 const ext = getExtension(file.name);
 const mime = file.mimetype.toLowerCase();

 if (mime.includes("image") || ["png","jpg","jpeg","gif","webp","svg","heic"].includes(ext)) {
 return"images";
 }
 if (mime.includes("pdf") || ext ==="pdf") {
 return"pdf";
 }
 if (
 mime.includes("json") ||
 mime.includes("javascript") ||
 ["json","js","jsx","ts","tsx","mjs","cjs","xml","yml","yaml","md"].includes(ext)
 ) {
 return"code";
 }
 if (["doc","docx","xls","xlsx","txt","csv","rtf","odt"].includes(ext)) {
 return"docs";
 }
 if (mime.startsWith("text/")) return"docs";
 return"other";
}

function formatSize(bytes: number) {
 if (bytes === 0) return"0 Bytes";
 const k = 1024;
 const sizes = ["Bytes","KB","MB","GB"];
 const i = Math.floor(Math.log(bytes) / Math.log(k));
 return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatFileDate(value?: string) {
 if (!value) return"Onbekend";
 const parsed = new Date(value);
 if (Number.isNaN(parsed.getTime())) return"Onbekend";
 return parsed.toLocaleDateString("nl-NL");
}

function normalizeStorageItem(params: {
 item: UserFile;
 path: string;
 projectId: string | null;
 projectName: string | null;
}): DocumentRecord | null {
 const { item, path, projectId, projectName } = params;
 if (!item?.name) return null;
 if (item.name ===".emptyFolderPlaceholder") return null;

 const rawMime = typeof item.metadata?.mimetype ==="string"? item.metadata.mimetype :"";
 const mime = rawMime || guessMimeType(item.name);
 const extension = getExtension(item.name);

 // Skip likely folders from storage.list results.
 if (!rawMime && !extension) return null;

 const size = Number(item.metadata?.size ?? 0);

 return {
 id: `${path}:${item.id ?? item.updated_at ?? item.created_at ?? item.name}`,
 name: item.name,
 path,
 size: Number.isFinite(size) ? size : 0,
 mimetype: mime,
 createdAt: item.created_at,
 updatedAt: item.updated_at,
 projectId,
 projectName,
 };
}

export default function DocumentenPage() {
 const [files, setFiles] = useState<DocumentRecord[]>([]);
 const [projects, setProjects] = useState<Project[]>([]);
 const [loading, setLoading] = useState(true);
 const [uploading, setUploading] = useState(false);
 const [refreshing, setRefreshing] = useState(false);
 const [uploadQueueSize, setUploadQueueSize] = useState(0);
 const [searchQuery, setSearchQuery] = useState("");
 const [typeFilter, setTypeFilter] = useState<FileTypeFilter>("all");
 const [sortBy, setSortBy] = useState<SortOption>("nieuwste");
 const [selectedProject, setSelectedProject] = useState<string>("all");
 const [userId, setUserId] = useState<string | null>(null);
 const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
 const [syncError, setSyncError] = useState<string | null>(null);

 const fetchProjects = useCallback(async (): Promise<Project[]> => {
 try {
 const { data: { session }, error: sessionError } = await supabase.auth.getSession();
 if (sessionError) throw sessionError;
 if (!session?.access_token) {
 setProjects([]);
 return [];
 }

 const response = await fetch("/api/projecten?limit=200&offset=0", {
 headers: {
 Authorization: `Bearer ${session.access_token}`,
 },
 cache:"no-store",
 });

 if (!response.ok) {
 const body = await response.json().catch(() => null);
 throw new Error(body?.error ??"Kon projecten niet laden.");
 }

 const payload = await response.json();
 const rows = Array.isArray(payload?.data) ? payload.data as ProjectApiRow[] : [];
 const mapped: Project[] = rows.map((row) => ({
 id: String(row.id),
 naam: String(row.naam ??""),
 status: String(row.status ??"Actief"),
 }));

 mapped.sort((a, b) => a.naam.localeCompare(b.naam,"nl-NL"));
 setProjects(mapped);
 return mapped;
 } catch (error) {
 // In dev toont Next een overlay bij console.error; gebruik een zachte melding i.p.v. een harde fout.
 console.warn('Projecten konden niet worden geladen:', error);
 setProjects([]);
 toast({
 title:'Projecten niet geladen',
 description:'We konden uw projecten niet ophalen, maar uw documentenkluis blijft beschikbaar.',
 variant:'default',
 });
 return [];
 }
 }, []);

 const fetchFiles = useCallback(async (uid: string, projectId: string, projectList: Project[]) => {
 try {
 setLoading(true);
 setSyncError(null);
 const collected: DocumentRecord[] = [];

 const listAndNormalize = async (params: {
 folderPath: string;
 projectId: string | null;
 projectName: string | null;
 }) => {
 const { data, error } = await supabase.storage
 .from("user-assets")
 .list(params.folderPath, {
 limit: 200,
 offset: 0,
 sortBy: { column:"created_at", order:"desc"},
 });

 if (error) throw error;

 for (const item of (data ?? []) as UserFile[]) {
 const normalized = normalizeStorageItem({
 item,
 path: `${params.folderPath}/${item.name}`,
 projectId: params.projectId,
 projectName: params.projectName,
 });
 if (normalized) collected.push(normalized);
 }
 };

 if (projectId !=="all") {
 const currentProject = projectList.find((project) => project.id === projectId) ?? null;
 await listAndNormalize({
 folderPath: `${uid}/projects/${projectId}`,
 projectId,
 projectName: currentProject?.naam ?? null,
 });
 } else {
 await listAndNormalize({
 folderPath: uid,
 projectId: null,
 projectName: null,
 });

 // In"Alle documenten": neem ook bestanden uit projectmappen mee.
 await Promise.all(
 projectList.map(async (project) => {
 try {
 await listAndNormalize({
 folderPath: `${uid}/projects/${project.id}`,
 projectId: project.id,
 projectName: project.naam,
 });
 } catch (projectFolderError) {
 console.warn(`Projectmap kon niet geladen worden voor project ${project.id}`, projectFolderError);
 }
 })
 );
 }

 setFiles(collected);
 setLastSyncedAt(new Date());
 } catch (error) {
 console.error("Error fetching files:", error);
 const message = error instanceof Error ? error.message.toLowerCase() :"";
 const bucketMissing = message.includes("bucket") && message.includes("not found");
 const nextError = bucketMissing
 ?"Storage bucket 'user-assets' ontbreekt. Maak deze bucket aan in Supabase."
 :"Kon documenten niet ophalen.";
 setSyncError(nextError);
  toast({
  title:"Fout",
 description: nextError,
  variant:"destructive",
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

 // Refetch files when context changes
 useEffect(() => {
 if (userId) {
 void fetchFiles(userId, selectedProject, projects)
 }
 }, [selectedProject, userId, fetchFiles, projects])

 const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
 const selectedFiles = Array.from(e.target.files ?? []);
 if (selectedFiles.length === 0 || !userId) return;

 try {
 setUploading(true);
 setUploadQueueSize(selectedFiles.length);

 let successCount = 0;
 let failureCount = 0;

 for (const currentFile of selectedFiles) {
 const formData = new FormData();
 formData.append("file", currentFile);
 formData.append("type","document");

 if (selectedProject !=="all") {
 formData.append("projectId", selectedProject);
 }

 const response = await fetch("/api/upload", {
 method:"POST",
 body: formData,
 credentials:"include",
 });

 const result = await response.json().catch(() => ({ success: false, error:"Upload mislukt"}));
 if (response.ok && result.success) {
 successCount += 1;
 } else {
 failureCount += 1;
 }
 }

 if (successCount > 0) {
 toast({
 title:"Upload voltooid",
 description:
 failureCount > 0
 ? `${successCount} bestand(en) geüpload, ${failureCount} mislukt.`
 : `${successCount} bestand(en) succesvol geüpload.`,
 });
 void fetchFiles(userId, selectedProject, projects);
 } else {
 throw new Error("Geen bestanden geüpload.");
 }
 } catch (error: any) {
 toast({
 title:"Fout",
 description: error?.message ??"Upload mislukt",
 variant:"destructive",
 });
 } finally {
 setUploading(false);
 setUploadQueueSize(0);
 e.target.value ="";
 }
 };

 const handleDelete = async (file: DocumentRecord) => {
 if (!confirm(`Weet je zeker dat je "${file.name}" wilt verwijderen?`)) return;

 try {
 const { error } = await supabase.storage
 .from("user-assets")
 .remove([file.path]);

 if (error) throw error;

 toast({
 title:"Succes",
 description:"Document verwijderd",
 });
 setFiles((current) => current.filter((entry) => entry.path !== file.path));
 } catch (error) {
 console.error("Error deleting file:", error);
 toast({
 title:"Fout",
 description:"Kon document niet verwijderen",
 variant:"destructive",
 });
 }
 };

 const handleRefresh = async () => {
 if (!userId) return;

 setRefreshing(true);
 try {
 const nextProjects = await fetchProjects();
 await fetchFiles(userId, selectedProject, nextProjects);
 toast({
 title:"Vernieuwd",
 description:"Documenten zijn opnieuw geladen.",
 });
 } finally {
 setRefreshing(false);
 }
 };

 const getFileIcon = (mimetype: string, name: string) => {
 const category = getFileCategory({ mimetype, name });
 if (category ==="images") return <ImageIcon className="w-8 h-8 text-blue-500"/>;
 if (category ==="pdf") return <FileText className="w-8 h-8 text-red-500"/>;
 if (category ==="code") return <FileCode className="w-8 h-8 text-amber-500"/>;
 if (mimetype.includes("image")) return <ImageIcon className="w-8 h-8 text-blue-500"/>;
 if (mimetype.includes("pdf")) return <FileText className="w-8 h-8 text-red-500"/>;
 if (mimetype.includes("json") || mimetype.includes("javascript")) return <FileCode className="w-8 h-8 text-amber-500"/>;
 return <File className="w-8 h-8 text-muted-foreground"/>;
 };

 const getPublicUrl = (filePath: string) => {
 const { data: { publicUrl } } = supabase.storage
 .from("user-assets")
 .getPublicUrl(filePath);
 return publicUrl;
 };

 const selectedProjectName = useMemo(() => {
 if (selectedProject ==="all") return null;
 return projects.find((project) => project.id === selectedProject)?.naam ??"Onbekend";
 }, [projects, selectedProject]);

 const totalStorage = useMemo(() => {
 return files.reduce((acc, file) => acc + file.size, 0);
 }, [files]);

 const uploadedToday = useMemo(() => {
 const now = new Date().toDateString();
 return files.filter((file) => {
 if (!file.createdAt) return false;
 return new Date(file.createdAt).toDateString() === now;
 }).length;
 }, [files]);

 const filteredFiles = useMemo(() => {
 const loweredQuery = searchQuery.trim().toLowerCase();

 let next = files.filter((file) => {
 if (typeFilter !=="all"&& getFileCategory(file) !== typeFilter) return false;
 if (!loweredQuery) return true;

 return (
 file.name.toLowerCase().includes(loweredQuery) ||
 file.path.toLowerCase().includes(loweredQuery) ||
 (file.projectName ??"").toLowerCase().includes(loweredQuery)
 );
 });

 next = [...next].sort((a, b) => {
 if (sortBy ==="naam_az") return a.name.localeCompare(b.name,"nl-NL");
 if (sortBy ==="naam_za") return b.name.localeCompare(a.name,"nl-NL");
 if (sortBy ==="grootste") return b.size - a.size;
 if (sortBy ==="kleinste") return a.size - b.size;

 const aDate = new Date(a.createdAt ?? a.updatedAt ?? 0).getTime();
 const bDate = new Date(b.createdAt ?? b.updatedAt ?? 0).getTime();
 if (sortBy ==="oudste") return aDate - bDate;
 return bDate - aDate;
 });

 return next;
 }, [files, searchQuery, typeFilter, sortBy]);

 const activeProjectCount = useMemo(() => {
 if (selectedProject ==="all") return projects.length;
 return selectedProjectName ??"Onbekend";
 }, [projects.length, selectedProject, selectedProjectName]);

 if (loading && files.length === 0) {
 return (
 <div className="h-[60vh] flex items-center justify-center">
 <ArchonLoader text="Documenten kluis openen..."/>
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
 <p className="text-xs text-muted-foreground mt-2">
 Laatst gesynchroniseerd: {lastSyncedAt
 ? lastSyncedAt.toLocaleTimeString("nl-NL")
 : syncError
 ? "Synchronisatie mislukt"
 : "Nog niet geladen"}
 </p>
 {syncError && <p className="text-xs text-red-400 mt-1">{syncError}</p>}
 </div>

 <div className="w-full xl:w-auto flex flex-col xl:flex-row items-stretch xl:items-center gap-2">
 {/* Project Selector */}
 <Select value={selectedProject} onValueChange={setSelectedProject}>
 <SelectTrigger className="w-full sm:w-64">
 <SelectValue placeholder="Selecteer project"/>
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">
 <div className="flex items-center gap-2">
 <FolderClosed className="w-4 h-4"/>
 Alle documenten
 </div>
 </SelectItem>
 {projects.map((project) => (
 <SelectItem key={project.id} value={project.id}>
 <div className="flex items-center gap-2">
 <FolderKanban className="w-4 h-4"/>
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
 className="w-full sm:w-80"
 />
 <Select value={typeFilter} onValueChange={(value: FileTypeFilter) => setTypeFilter(value)}>
 <SelectTrigger className="w-full sm:w-44">
 <SelectValue placeholder="Type"/>
 </SelectTrigger>
 <SelectContent>
 {(Object.keys(typeLabel) as FileTypeFilter[]).map((type) => (
 <SelectItem key={type} value={type}>{typeLabel[type]}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
 <SelectTrigger className="w-full sm:w-44">
 <SelectValue placeholder="Sorteren"/>
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="nieuwste">Nieuwste eerst</SelectItem>
 <SelectItem value="oudste">Oudste eerst</SelectItem>
 <SelectItem value="naam_az">Naam A-Z</SelectItem>
 <SelectItem value="naam_za">Naam Z-A</SelectItem>
 <SelectItem value="grootste">Grootste eerst</SelectItem>
 <SelectItem value="kleinste">Kleinste eerst</SelectItem>
 </SelectContent>
 </Select>
 <Button
 variant="outline"
 onClick={() => void handleRefresh()}
 disabled={refreshing || loading}
 className="shrink-0"
 >
 {refreshing ? <ArchonInlineLoader size={16} /> : <RefreshCw className="w-4 h-4 mr-2"/>}
 Vernieuwen
 </Button>
 <div className="relative">
 <input
 type="file"
 id="file-upload"
 className="hidden"
 onChange={handleUpload}
 multiple
 disabled={uploading}
 />
 <Button 
 asChild 
 disabled={uploading}
 className="font-medium shrink-0"
 >
 <label htmlFor="file-upload"className="cursor-pointer flex items-center gap-2">
 {uploading ? <ArchonInlineLoader size={18} /> : <Plus className="w-4 h-4"/>}
 {uploading ? `Uploaden (${uploadQueueSize})` :"Uploaden"}
 </label>
 </Button>
 </div>
 </div>
 </div>

 {/* Stats row */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
 <Card>
 <CardContent className="p-3">
 <div className="flex items-center gap-2.5">
 <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
 <FileText className="w-3.5 h-3.5 text-blue-500"/>
 </div>
 <div>
 <p className="text-[11px] text-muted-foreground">Totaal Bestanden</p>
 <p className="text-base font-bold text-foreground leading-tight">{filteredFiles.length}</p>
 {filteredFiles.length !== files.length && (
 <p className="text-[11px] text-muted-foreground">van {files.length} totaal</p>
 )}
 </div>
 </div>
 </CardContent>
 </Card>
 <Card>
 <CardContent className="p-3">
 <div className="flex items-center gap-2.5">
 <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
 <Filter className="w-3.5 h-3.5 text-amber-500"/>
 </div>
 <div>
 <p className="text-[11px] text-muted-foreground">Opslag Gebruik</p>
 <p className="text-base font-bold text-foreground leading-tight">
 {formatSize(totalStorage)}
 </p>
 </div>
 </div>
 </CardContent>
 </Card>
 <Card>
 <CardContent className="p-3">
 <div className="flex items-center gap-2.5">
 <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
 <Sparkles className="w-3.5 h-3.5 text-emerald-500"/>
 </div>
 <div>
 <p className="text-[11px] text-muted-foreground">Nieuw Vandaag</p>
 <p className="text-base font-bold text-foreground leading-tight">
 {uploadedToday}
 </p>
 </div>
 </div>
 </CardContent>
 </Card>
 <Card>
 <CardContent className="p-3">
 <div className="flex items-center gap-2.5">
 <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
 <FolderKanban className="w-3.5 h-3.5 text-purple-500"/>
 </div>
 <div>
 <p className="text-[11px] text-muted-foreground">
 {selectedProject ==="all"?"Alle Projecten":"Huidig Project"}
 </p>
 <p className="text-base font-bold text-foreground truncate max-w-[140px] leading-tight">
 {activeProjectCount}
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
 key={file.id}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95 }}
 transition={{ delay: index * 0.05 }}
 >
 <Card className="group relative hover:shadow-lg transition-all duration-300">
 <CardContent className="p-6">
 <div className="flex items-start justify-between mb-4">
 <div className="p-3 rounded-xl bg-muted border transition-colors">
 {getFileIcon(file.mimetype ||"", file.name)}
 </div>
 
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost"size="icon"className="text-muted-foreground hover:text-foreground -mr-2">
 <MoreVertical className="w-4 h-4"/>
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end"className="w-48">
 <DropdownMenuItem onClick={() => window.open(getPublicUrl(file.path),"_blank")}>
 <ExternalLink className="w-4 h-4 mr-2"/> Openen
 </DropdownMenuItem>
 <DropdownMenuItem asChild>
 <a href={getPublicUrl(file.path)} download={file.name}>
 <Download className="w-4 h-4 mr-2"/> Downloaden
 </a>
 </DropdownMenuItem>
 <DropdownMenuItem className="text-destructive focus:text-destructive"onClick={() => void handleDelete(file)}>
 <Trash2 className="w-4 h-4 mr-2"/> Verwijderen
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>

 <div className="space-y-1">
 <h3 className="font-semibold text-foreground truncate pr-6"title={file.name}>
 {file.name}
 </h3>
 <div className="flex items-center gap-2 text-xs text-muted-foreground">
 <span>{formatSize(file.size)}</span>
 <span>•</span>
 <span>{formatFileDate(file.createdAt)}</span>
 {file.projectName && (
 <>
 <span>•</span>
 <span className="truncate max-w-[130px]"title={file.projectName}>{file.projectName}</span>
 </>
 )}
 </div>
 </div>

 {/* Quick view button on hover */}
 <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
 <Button 
 variant="secondary"
 className="w-full"
 onClick={() => window.open(getPublicUrl(file.path),"_blank")}
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
 <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground bg-muted rounded-3xl border-2 border-dashed border-border">
 <FolderClosed className="w-12 h-12 mb-4 opacity-20"/>
 <p className="text-lg font-medium">
 {selectedProject ==="all"
 ?"Geen documenten gevonden"
 : `Geen documenten voor ${selectedProjectName ||"dit project"}`
 }
 </p>
 <p className="text-sm mt-1">
 {searchQuery || typeFilter !=="all"?"Pas je zoekopdracht of filters aan.": (
 selectedProject ==="all"
 ?"Upload je eerste bestand om te beginnen."
 :"Upload bestanden voor dit project om ze hier te zien."
 )}
 </p>
 <div className="mt-4">
 <Button
 variant="outline"
 size="sm"
 onClick={() => {
 setSearchQuery("");
 setTypeFilter("all");
 setSortBy("nieuwste");
 }}
 className="gap-2"
 >
 <ArrowUpDown className="w-4 h-4"/>
 Filters resetten
 </Button>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}
