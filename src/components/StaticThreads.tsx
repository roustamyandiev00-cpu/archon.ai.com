'use client'

import { memo, useState } from 'react'
import { MessageCircle, Users, Hash, TrendingUp, Clock, Pin, Plus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface Thread {
  id: string
  title: string
  message: string
  author: string
  timestamp: string
  replies: number
  category: 'general' | 'project' | 'support' | 'announcement'
  isPinned?: boolean
  isActive?: boolean
}

interface Stream {
  id: string
  name: string
  status: 'online' | 'offline' | 'busy'
  participants: number
  lastActivity: string
  topic: string
}

const mockThreads: Thread[] = [
  {
    id: '1',
    title: 'Project Archon - Status Update',
    message: 'De nieuwe dashboard features zijn live! Check de Analytics sectie voor de laatste updates.',
    author: 'Team Archon',
    timestamp: '2 min geleden',
    replies: 12,
    category: 'announcement',
    isPinned: true,
    isActive: true
  },
  {
    id: '2',
    title: 'Bug Report: Export Functionaliteit',
    message: 'Exporteren naar PDF geeft een error bij grote datasets. We werken aan een fix.',
    author: 'Support Team',
    timestamp: '15 min geleden',
    replies: 8,
    category: 'support'
  },
  {
    id: '3',
    title: 'Nieuwe Feature Request',
    message: 'Zou het mogelijk zijn om batch processing toe te voegen voor meerdere deals tegelijk?',
    author: 'Jan de Vries',
    timestamp: '1 uur geleden',
    replies: 5,
    category: 'general'
  },
  {
    id: '4',
    title: 'Project Milestone Behaald!',
    message: 'Phase 1 van de CRM integratie is succesvol afgerond. Dank aan het hele team!',
    author: 'Project Manager',
    timestamp: '3 uur geleden',
    replies: 18,
    category: 'project',
    isPinned: true
  }
]

const mockStreams: Stream[] = [
  {
    id: '1',
    name: 'General Chat',
    status: 'online',
    participants: 24,
    lastActivity: 'nu',
    topic: 'Algemene discussie'
  },
  {
    id: '2',
    name: 'Project Updates',
    status: 'online',
    participants: 12,
    lastActivity: '2 min geleden',
    topic: 'Project gerelateerde updates'
  },
  {
    id: '3',
    name: 'Support Channel',
    status: 'busy',
    participants: 8,
    lastActivity: '5 min geleden',
    topic: 'Help en ondersteuning'
  }
]

const categoryConfig = {
  general: { icon: MessageCircle, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  project: { icon: TrendingUp, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  support: { icon: Users, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  announcement: { icon: Pin, color: 'text-red-500 bg-red-500/10 border-red-500/20' }
}

const statusConfig = {
  online: { color: 'bg-emerald-500', label: 'Online' },
  offline: { color: 'bg-muted-foreground/60', label: 'Offline' },
  busy: { color: 'bg-amber-500', label: 'Bezet' }
}

function StaticThreads() {
  const [activeTab, setActiveTab] = useState<'threads' | 'streams'>('threads')
  const [selectedThread, setSelectedThread] = useState<string | null>(null)
  const [threads, setThreads] = useState<Thread[]>(mockThreads)
  const [streams, setStreams] = useState<Stream[]>(mockStreams)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState<Thread['category']>('general')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOpenModal = () => {
    setTitle('')
    setMessage('')
    setCategory('general')
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: 'Validatie fout',
        description: 'Vul een titel en bericht in.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))

    if (activeTab === 'threads') {
      const newThread: Thread = {
        id: Date.now().toString(),
        title: title.trim(),
        message: message.trim(),
        author: 'Jij',
        timestamp: 'nu',
        replies: 0,
        category,
        isActive: true,
      }
      setThreads(prev => [newThread, ...prev])
      toast({
        title: 'Discussie aangemaakt',
        description: `Discussie "${title}" is succesvol aangemaakt.`,
      })
    } else {
      const newStream: Stream = {
        id: Date.now().toString(),
        name: title.trim(),
        status: 'online',
        participants: 1,
        lastActivity: 'nu',
        topic: message.trim(),
      }
      setStreams(prev => [newStream, ...prev])
      toast({
        title: 'Kanaal aangemaakt',
        description: `Kanaal "${title}" is succesvol aangemaakt.`,
      })
    }

    setIsSubmitting(false)
    setIsModalOpen(false)
    setTitle('')
    setMessage('')
  }

  return (
    <div className="w-full max-w-md space-y-4">
      {/* Tab Navigation */}
      <div
        role="tablist"
        aria-label="Discussies en kanalen"
        className="flex gap-2 p-1 bg-card/40 backdrop-blur-xl rounded-xl border border-border/30"
      >
        <button
          id="threads-tab"
          type="button"
          role="tab"
          aria-selected={activeTab === 'threads'}
          aria-controls="threads-panel"
          onClick={() => setActiveTab('threads')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            activeTab === 'threads'
              ? "bg-background/80 text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-background/40"
          )}
        >
          <MessageCircle className="w-4 h-4" />
          Discussies
        </button>
        <button
          id="streams-tab"
          type="button"
          role="tab"
          aria-selected={activeTab === 'streams'}
          aria-controls="streams-panel"
          onClick={() => setActiveTab('streams')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            activeTab === 'streams'
              ? "bg-background/80 text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-background/40"
          )}
        >
          <Hash className="w-4 h-4" />
          Kanalen
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-2xl p-4">
        {activeTab === 'threads' ? (
          <div
            id="threads-panel"
            role="tabpanel"
            aria-labelledby="threads-tab"
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Recente discussies</h3>
              <Badge variant="secondary" className="text-xs">
                {mockThreads.filter(t => t.isActive).length} Actief
              </Badge>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {threads.map((thread) => {
                const CategoryIcon = categoryConfig[thread.category].icon
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => {
                      setSelectedThread(thread.id)
                      toast({
                        title: 'Discussie Geopend',
                        description: `Discussie "${thread.title}" wordt geopend.`,
                      })
                    }}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-all duration-200",
                      selectedThread === thread.id
                        ? "bg-background/60 border-border/50"
                        : "bg-card/40 border-border/30 hover:border-border/50 hover:bg-background/40"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg", categoryConfig[thread.category].color)}>
                        <CategoryIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {thread.isPinned && <Pin className="w-3 h-3 text-amber-500" />}
                          <h4 className="text-sm font-medium text-foreground truncate">
                            {thread.title}
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {thread.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{thread.author}</span>
                            <span>{thread.timestamp}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{thread.replies}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div
            id="streams-panel"
            role="tabpanel"
            aria-labelledby="streams-tab"
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Actieve kanalen</h3>
              <Badge variant="secondary" className="text-xs">
                {mockStreams.filter(s => s.status === 'online').length} Online
              </Badge>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {streams.map((stream) => (
                <button
                  key={stream.id}
                  type="button"
                  onClick={() => {
                    toast({
                      title: 'Kanaal Geopend',
                      description: `Kanaal "${stream.name}" wordt geopend.`,
                    })
                  }}
                  className="w-full text-left p-3 rounded-xl border border-border/30 bg-card/40 hover:border-border/50 hover:bg-background/40 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", statusConfig[stream.status].color)} />
                      <h4 className="text-sm font-medium text-foreground">{stream.name}</h4>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {statusConfig[stream.status].label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{stream.topic}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{stream.participants} deelnemers</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{stream.lastActivity}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-4 pt-3 border-t border-border/30">
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-card/40 border-border/30 hover:bg-card/60 text-foreground"
            onClick={handleOpenModal}
          >
            <Plus className="w-4 h-4 mr-2" />
            {activeTab === 'threads' ? 'Nieuwe discussie' : 'Nieuw kanaal'}
          </Button>
        </div>
      </div>

      {/* Create Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activeTab === 'threads' ? 'Nieuwe Discussie' : 'Nieuw Kanaal'}
            </DialogTitle>
            <DialogDescription>
              {activeTab === 'threads'
                ? 'Start een nieuwe discussie met het team.'
                : 'Maak een nieuw kanaal aan voor gesprekken.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {activeTab === 'threads' ? 'Titel' : 'Kanaal naam'}
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={activeTab === 'threads' ? 'Bijv. Project Update' : 'Bijv. Marketing Team'}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {activeTab === 'threads' ? 'Bericht' : 'Onderwerp'}
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  activeTab === 'threads'
                    ? 'Beschrijf waar je over wilt discussiëren...'
                    : 'Waar gaat dit kanaal over?'
                }
                rows={4}
              />
            </div>
            {activeTab === 'threads' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Categorie</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Thread['category'])}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="general">Algemeen</option>
                  <option value="project">Project</option>
                  <option value="support">Support</option>
                  <option value="announcement">Aankondiging</option>
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !title.trim() || !message.trim()}>
              {isSubmitting ? 'Aanmaken...' : 'Aanmaken'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default memo(StaticThreads)
