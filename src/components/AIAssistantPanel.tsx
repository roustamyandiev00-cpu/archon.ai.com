'use client'

import { memo, useState } from 'react'
import { Bot, Send, Sparkles, PanelRightClose, ListTodo, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

const mockMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Hoi! Ik ben je AI assistent. Geef me een taak of stel een vraag en ik pak het direct op.',
    timestamp: 'nu'
  }
]

const models = [
  { id: 'llama', name: 'Llama 3.3', icon: Bot },
  { id: 'gemini', name: 'Gemini', icon: Sparkles }
]

function AIAssistantPanel() {
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [input, setInput] = useState('')
  const [isExpanded, setIsExpanded] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [activeModel, setActiveModel] = useState('llama')
  const [activeTab, setActiveTab] = useState<'chat' | 'tasks'>('chat')
  const [openTasks, setOpenTasks] = useState(0)

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: 'nu'
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    await new Promise(resolve => setTimeout(resolve, 1000))

    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: 'Ik begrijp je vraag. Laat me even kijken hoe ik je het beste kan helpen met dit onderwerp.',
      timestamp: 'nu'
    }

    setMessages(prev => [...prev, aiResponse])
    setIsLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={cn(
      "transition-all duration-300 ease-in-out",
      isExpanded ? "w-full max-w-md" : "w-auto"
    )}>
      {/* Toggle Button (when collapsed) */}
      {!isExpanded && (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl",
            "bg-gradient-to-r from-red-500/20 to-orange-500/20",
            "backdrop-blur-xl border border-red-500/30",
            "hover:from-red-500/30 hover:to-orange-500/30",
            "transition-all duration-200 text-foreground",
            "shadow-lg shadow-red-500/10"
          )}
          title="AI Werkruimte openen"
        >
          <Zap className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium">AI</span>
        </button>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="bg-gradient-to-b from-red-500/10 to-orange-500/10 backdrop-blur-xl border border-red-500/20 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-red-500/20">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">AI Werkruimte</h3>
                  <p className="text-xs text-muted-foreground">Praat met AI en zet acties om in taken.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs bg-red-500/10 text-red-500 border-red-500/20">
                  {openTasks} open
                </Badge>
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <PanelRightClose className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Model Selector */}
          <div className="px-4 py-2 border-b border-red-500/20">
            <div className="flex gap-2">
              {models.map((model) => {
                const Icon = model.icon
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => setActiveModel(model.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      activeModel === model.id
                        ? "bg-red-500/20 text-red-500 border border-red-500/30"
                        : "bg-card/40 text-muted-foreground hover:bg-card/60 border border-transparent"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {model.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-4 py-2 border-b border-red-500/20">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  activeTab === 'chat'
                    ? "bg-background/80 text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                )}
              >
                <Bot className="w-4 h-4" />
                AI Chat
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tasks')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  activeTab === 'tasks'
                    ? "bg-background/80 text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                )}
              >
                <ListTodo className="w-4 h-4" />
                Taken
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-4 min-h-[300px] max-h-[400px] overflow-y-auto">
            {activeTab === 'chat' ? (
              <div className="space-y-4">
                {/* Messages */}
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shrink-0">
                          <Zap className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[85%] p-3 rounded-xl text-sm",
                          message.role === 'user'
                            ? "bg-red-500 text-white rounded-br-md"
                            : "bg-card/60 text-foreground rounded-bl-md border border-red-500/20"
                        )}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      <div className="p-3 rounded-xl bg-card/60 border border-red-500/20">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce" />
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce delay-100" />
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce delay-200" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <ListTodo className="w-12 h-12 text-red-500/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Geen open taken</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Vraag de AI om taken aan te maken
                </p>
              </div>
            )}
          </div>

          {/* Input (only in chat tab) */}
          {activeTab === 'chat' && (
            <div className="p-4 border-t border-red-500/20">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Vraag ${models.find(m => m.id === activeModel)?.name} iets...`}
                  className="flex-1 bg-card/60 border-red-500/20 focus:border-red-500/40 h-10"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="bg-blue-500 hover:bg-blue-600 text-white h-10 w-10"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default memo(AIAssistantPanel)
