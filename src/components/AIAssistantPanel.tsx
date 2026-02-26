'use client'

import { memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  Bot,
  Send,
  Sparkles,
  PanelRightClose,
  ListTodo,
  Zap,
  Mic,
  Volume2,
  Loader2,
  PhoneCall,
  PhoneOff,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import {
  buildDashboardPageUrl,
  buildFactuurCreateUrl,
  type AiAssistantAction,
} from '@/lib/ai-assistant-actions'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

type BrowserSpeechRecognitionResult = {
  isFinal: boolean
  length: number
  [index: number]: { transcript: string }
}

type BrowserSpeechRecognitionEvent = {
  resultIndex: number
  results: ArrayLike<BrowserSpeechRecognitionResult>
}

type BrowserSpeechRecognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onstart: (() => void) | null
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

const initialMessages: Message[] = [
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
] as const

type ModelId = (typeof models)[number]['id']

function AIAssistantPanel() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isExpanded, setIsExpanded] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [activeModel, setActiveModel] = useState<ModelId>('llama')
  const [activeTab, setActiveTab] = useState<'chat' | 'tasks'>('chat')
  const [openTasks] = useState(0)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [autoSpeakResponses, setAutoSpeakResponses] = useState(false)
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null)
  const [voiceQuestionMode, setVoiceQuestionMode] = useState(false)

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const inputRef = useRef('')
  const shouldSubmitAfterStopRef = useRef(false)
  const isVoiceQuestionRecordingRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const browserWindow = window as unknown as {
      SpeechRecognition?: new () => BrowserSpeechRecognition
      webkitSpeechRecognition?: new () => BrowserSpeechRecognition
    }

    setVoiceSupported(Boolean(browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition))
  }, [])

  useEffect(() => {
    inputRef.current = input
  }, [input])

  const handleAssistantAction = useCallback((action?: AiAssistantAction | null) => {
    if (!action || typeof window === 'undefined') return

    if (action.type === 'open_factuur_modal') {
      window.location.assign(buildFactuurCreateUrl(action.prefillData))
      return
    }

    if (action.type === 'open_page') {
      window.location.assign(buildDashboardPageUrl(action.page))
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      return
    }
    setIsRecording(false)
  }, [])

  const speakText = useCallback((content: string, messageId?: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast({
        title: 'Spraak niet beschikbaar',
        description: 'Deze browser ondersteunt tekst-naar-spraak niet.',
        variant: 'destructive',
      })
      return
    }

    const synth = window.speechSynthesis
    if (synth.speaking && speakingMessageId === messageId) {
      synth.cancel()
      setSpeakingMessageId(null)
      return
    }

    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(content)
    utterance.lang = 'nl-NL'
    utterance.rate = 1
    utterance.pitch = 1
    utterance.onend = () => {
      setSpeakingMessageId(null)
    }
    utterance.onerror = () => {
      setSpeakingMessageId(null)
      toast({
        title: 'Voorlezen mislukt',
        description: 'Kon het AI-antwoord niet voorlezen.',
        variant: 'destructive',
      })
    }

    setSpeakingMessageId(messageId ?? null)
    synth.speak(utterance)
  }, [speakingMessageId])

  const handleSend = useCallback(async (overrideInput?: string) => {
    const value = (overrideInput ?? inputRef.current).trim()
    if (!value || isLoading) return
    if (isRecording) stopRecording()

    shouldSubmitAfterStopRef.current = false
    isVoiceQuestionRecordingRef.current = false
    if (voiceQuestionMode) setVoiceQuestionMode(false)

    const userMessage: Message = {
      id: `${Date.now()}`,
      role: 'user',
      content: value,
      timestamp: 'nu'
    }

    const history = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }))

    setMessages(prev => [...prev, userMessage])
    setInput('')
    inputRef.current = ''
    setIsLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          message: value,
          history,
          model: activeModel,
          context: {
            pagePath: typeof window !== 'undefined' ? window.location.pathname : null,
            locale: typeof navigator !== 'undefined' ? navigator.language : 'nl-NL',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        }),
      })

      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Kon geen antwoord ophalen.')
      }

      handleAssistantAction(result.action as AiAssistantAction | undefined)

      const aiResponse: Message = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: typeof result.reply === 'string' && result.reply.trim().length > 0
          ? result.reply
          : 'Ik kon geen antwoord genereren. Probeer het opnieuw.',
        timestamp: 'nu',
      }

      setMessages(prev => [...prev, aiResponse])

      if (autoSpeakResponses && aiResponse.content.trim()) {
        speakText(aiResponse.content, aiResponse.id)
      }
    } catch (error: any) {
      toast({
        title: 'AI fout',
        description: error?.message || 'Kon geen verbinding maken met de AI.',
        variant: 'destructive',
      })

      setMessages(prev => [
        ...prev,
        {
          id: `${Date.now()}-assistant-error`,
          role: 'assistant',
          content: 'Er ging iets mis bij het ophalen van een antwoord. Probeer het opnieuw.',
          timestamp: 'nu',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [
    activeModel,
    autoSpeakResponses,
    handleAssistantAction,
    isLoading,
    isRecording,
    messages,
    speakText,
    stopRecording,
    voiceQuestionMode,
  ])

  const startRecording = useCallback((options?: { resetInput?: boolean }) => {
    if (typeof window === 'undefined') return

    const browserWindow = window as unknown as {
      SpeechRecognition?: new () => BrowserSpeechRecognition
      webkitSpeechRecognition?: new () => BrowserSpeechRecognition
    }
    const RecognitionCtor = browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition

    if (!RecognitionCtor) {
      toast({
        title: 'Spraak niet ondersteund',
        description: 'Gebruik Chrome of Safari voor spraak-naar-tekst.',
        variant: 'destructive',
      })
      return
    }

    const resetInput = Boolean(options?.resetInput)
    const baseInput = resetInput ? '' : inputRef.current.trim()

    if (resetInput) {
      setInput('')
      inputRef.current = ''
    }

    const recognition = new RecognitionCtor()
    recognition.lang = 'nl-NL'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onstart = () => setIsRecording(true)
    recognition.onresult = (event) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i += 1) {
        const part = event.results[i]?.[0]?.transcript?.trim()
        if (part) transcript += `${part} `
      }

      const merged = [baseInput, transcript.trim()].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
      setInput(merged)
      inputRef.current = merged
    }
    recognition.onerror = (event) => {
      setIsRecording(false)
      recognitionRef.current = null
      shouldSubmitAfterStopRef.current = false
      isVoiceQuestionRecordingRef.current = false
      setVoiceQuestionMode(false)
      toast({
        title: 'Microfoonfout',
        description: event.error ? `Spraakherkenning fout: ${event.error}` : 'Spraakherkenning stopte onverwacht.',
        variant: 'destructive',
      })
    }
    recognition.onend = () => {
      setIsRecording(false)
      recognitionRef.current = null
      const shouldSubmitVoiceQuestion = shouldSubmitAfterStopRef.current && isVoiceQuestionRecordingRef.current
      shouldSubmitAfterStopRef.current = false
      isVoiceQuestionRecordingRef.current = false
      setVoiceQuestionMode(false)

      if (shouldSubmitVoiceQuestion) {
        const spokenPrompt = inputRef.current.trim()
        if (!spokenPrompt) {
          toast({
            title: 'Geen spraak herkend',
            description: 'Probeer opnieuw en spreek iets duidelijker in.',
            variant: 'destructive',
          })
          return
        }
        void handleSend(spokenPrompt)
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [handleSend])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      shouldSubmitAfterStopRef.current = false
      isVoiceQuestionRecordingRef.current = false
    }
  }, [])

  const toggleVoiceQuestion = useCallback(() => {
    if (!voiceSupported || isLoading) return

    if (!voiceQuestionMode) {
      isVoiceQuestionRecordingRef.current = true
      shouldSubmitAfterStopRef.current = false
      setVoiceQuestionMode(true)
      startRecording({ resetInput: true })
      return
    }

    shouldSubmitAfterStopRef.current = true
    stopRecording()
  }, [isLoading, startRecording, stopRecording, voiceQuestionMode, voiceSupported])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  return (
    <div className={cn(
      'transition-all duration-300 ease-in-out',
      isExpanded ? 'w-full max-w-md' : 'w-auto'
    )}>
      {/* Toggle Button (when collapsed) */}
      {!isExpanded && (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl',
            'bg-gradient-to-r from-red-500/20 to-orange-500/20',
            'backdrop-blur-xl border border-red-500/30',
            'hover:from-red-500/30 hover:to-orange-500/30',
            'transition-all duration-200 text-foreground',
            'shadow-lg shadow-red-500/10'
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
            <div className="flex items-start justify-between gap-2">
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
                <button
                  type="button"
                  onClick={toggleVoiceQuestion}
                  disabled={!voiceSupported || isLoading}
                  className={cn(
                    'h-8 rounded-md border inline-flex items-center gap-1.5 px-2 text-xs transition-colors',
                    voiceQuestionMode
                      ? 'border-red-500/40 bg-red-500/20 text-red-500'
                      : 'border-red-500/20 text-muted-foreground hover:text-foreground hover:bg-red-500/10',
                    (!voiceSupported || isLoading) && 'opacity-50 cursor-not-allowed'
                  )}
                  title={voiceQuestionMode ? 'Stop & verstuur voice vraag' : 'Start voice vraag'}
                >
                  {voiceQuestionMode ? <PhoneOff className="w-3.5 h-3.5" /> : <PhoneCall className="w-3.5 h-3.5" />}
                  <span>{voiceQuestionMode ? 'Stop' : 'Voice'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAutoSpeakResponses((value) => !value)}
                  className={cn(
                    'h-8 w-8 rounded-md border flex items-center justify-center transition-colors',
                    autoSpeakResponses
                      ? 'border-red-500/40 bg-red-500/20 text-red-500'
                      : 'border-red-500/20 text-muted-foreground hover:text-foreground hover:bg-red-500/10'
                  )}
                  title={autoSpeakResponses ? 'Auto voice uit' : 'Auto voice aan'}
                >
                  <Volume2 className="w-4 h-4" />
                </button>
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
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      activeModel === model.id
                        ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                        : 'bg-card/40 text-muted-foreground hover:bg-card/60 border border-transparent'
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
                  'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  activeTab === 'chat'
                    ? 'bg-background/80 text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                )}
              >
                <Bot className="w-4 h-4" />
                AI Chat
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tasks')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  activeTab === 'tasks'
                    ? 'bg-background/80 text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
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
                        'flex gap-3',
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shrink-0">
                          <Zap className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-[85%] p-3 rounded-xl text-sm',
                          message.role === 'user'
                            ? 'bg-red-500 text-white rounded-br-md'
                            : 'bg-card/60 text-foreground rounded-bl-md border border-red-500/20'
                        )}
                      >
                        <p>{message.content}</p>
                        {message.role === 'assistant' && (
                          <div className="mt-2 flex justify-end">
                            <button
                              type="button"
                              className={cn(
                                'inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors',
                                speakingMessageId === message.id
                                  ? 'bg-red-500/15 text-red-500 border-red-500/30'
                                  : 'bg-background/40 text-muted-foreground border-red-500/20 hover:text-foreground'
                              )}
                              onClick={() => speakText(message.content, message.id)}
                              title={speakingMessageId === message.id ? 'Stop voorlezen' : 'Lees voor'}
                            >
                              <Volume2 className={cn('h-3.5 w-3.5', speakingMessageId === message.id && 'animate-pulse')} />
                            </button>
                          </div>
                        )}
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
                  onKeyDown={handleKeyDown}
                  placeholder={`Vraag ${models.find(m => m.id === activeModel)?.name} iets...`}
                  className="flex-1 bg-card/60 border-red-500/20 focus:border-red-500/40 h-10"
                />
                <Button
                  type="button"
                  variant={isRecording ? 'destructive' : 'outline'}
                  size="icon"
                  onClick={() => {
                    if (isRecording) {
                      shouldSubmitAfterStopRef.current = false
                      isVoiceQuestionRecordingRef.current = false
                      setVoiceQuestionMode(false)
                      stopRecording()
                      return
                    }
                    setVoiceQuestionMode(false)
                    shouldSubmitAfterStopRef.current = false
                    isVoiceQuestionRecordingRef.current = false
                    startRecording()
                  }}
                  disabled={!voiceSupported || isLoading || voiceQuestionMode}
                  className="h-10 w-10"
                  title={isRecording ? 'Stop opname' : 'Start spraakopname'}
                >
                  {isRecording ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Button
                  size="icon"
                  onClick={() => void handleSend()}
                  disabled={isLoading || !input.trim()}
                  className="bg-blue-500 hover:bg-blue-600 text-white h-10 w-10"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {voiceQuestionMode
                  ? 'Voice-vraag actief: spreek je vraag in en klik opnieuw op Voice om te stoppen en direct te versturen.'
                  : voiceSupported
                    ? isRecording
                      ? 'Luistert... klik op de microfoon om te stoppen.'
                      : 'Tip: gebruik de microfoon voor spraak-naar-tekst, of Voice voor direct versturen.'
                    : 'Spraak is niet beschikbaar in deze browser.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default memo(AIAssistantPanel)
