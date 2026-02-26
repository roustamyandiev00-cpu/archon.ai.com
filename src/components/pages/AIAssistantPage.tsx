'use client'

import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react'
import { Bot, Sparkles, Send, ArrowUpRight, User, Loader2, Zap, RotateCcw, Mic, Volume2, PhoneCall, PhoneOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface Message {
  role: 'user' | 'ai'
  content: string
  timestamp: Date
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

type SpeakOptions = {
  messageIndex?: number
  onEnd?: () => void
}

const quickPrompts = [
  'Vat de openstaande deals samen.',
  'Hoeveel onbetaalde facturen heb ik?',
  'Wat is de totale waarde van mijn lopende projecten?',
]

export default function AIAssistantPage() {
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: 'Hoi! Ik ben je ArchonPro AI assistent. Ik heb toegang tot je live bedrijfsdata. Hoe kan ik je vandaag helpen?',
      timestamp: new Date()
    }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null)
  const [autoSpeakResponses, setAutoSpeakResponses] = useState(false)
  const [voiceQuestionMode, setVoiceQuestionMode] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const promptBeforeRecordingRef = useRef('')
  const promptRef = useRef('')
  const shouldSubmitAfterStopRef = useRef(false)
  const isVoiceQuestionRecordingRef = useRef(false)

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth'
        })
      }
    }
  }, [messages, isLoading])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const browserWindow = window as unknown as {
      SpeechRecognition?: new () => BrowserSpeechRecognition
      webkitSpeechRecognition?: new () => BrowserSpeechRecognition
    }
    setVoiceSupported(Boolean(browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition))
  }, [])

  useEffect(() => {
    promptRef.current = prompt
  }, [prompt])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      return
    }
    setIsRecording(false)
  }, [])

  const speakText = useCallback((content: string, options?: SpeakOptions) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast({
        title: 'Spraak niet beschikbaar',
        description: 'Deze browser ondersteunt tekst-naar-spraak niet.',
        variant: 'destructive',
      })
      return
    }

    const messageIndex = options?.messageIndex
    const onEnd = options?.onEnd
    const synth = window.speechSynthesis
    if (synth.speaking && speakingMessageIndex === messageIndex) {
      synth.cancel()
      setSpeakingMessageIndex(null)
      onEnd?.()
      return
    }

    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(content)
    utterance.lang = 'nl-NL'
    utterance.rate = 1
    utterance.pitch = 1
    utterance.onend = () => {
      setSpeakingMessageIndex(null)
      onEnd?.()
    }
    utterance.onerror = () => {
      setSpeakingMessageIndex(null)
      toast({
        title: 'Voorlezen mislukt',
        description: 'Kon de AI-reactie niet uitspreken.',
        variant: 'destructive',
      })
      onEnd?.()
    }

    setSpeakingMessageIndex(messageIndex ?? null)
    synth.speak(utterance)
  }, [speakingMessageIndex])

  const submitPromptText = useCallback(async (userMessage: string, options?: { forceSpeak?: boolean }) => {
    if (!userMessage.trim() || isLoading) return
    if (isRecording) stopRecording()

    setPrompt('')
    promptRef.current = ''

    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userMessage, timestamp: new Date() }
    ]
    setMessages(newMessages)
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
          message: userMessage,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      })

      const result = await response.json()

      if (result.success) {
        const aiReply = result.reply as string
        const aiMessageIndex = newMessages.length
        setMessages(prev => [
          ...prev,
          { role: 'ai', content: aiReply, timestamp: new Date() }
        ])
        const shouldSpeak = Boolean(options?.forceSpeak || autoSpeakResponses)
        if (shouldSpeak && aiReply?.trim()) {
          speakText(aiReply, { messageIndex: aiMessageIndex })
        }
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast({
        title: 'Fout',
        description: error.message || 'Kon geen verbinding maken met de AI.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [autoSpeakResponses, isLoading, isRecording, messages, speakText, stopRecording])

  const startRecording = useCallback((options?: { resetPrompt?: boolean }) => {
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

    const resetPrompt = Boolean(options?.resetPrompt)
    const existingPrompt = resetPrompt ? '' : promptRef.current.trim()
    promptBeforeRecordingRef.current = existingPrompt
    if (resetPrompt) {
      setPrompt('')
      promptRef.current = ''
    }

    const recognition = new RecognitionCtor()
    recognition.lang = 'nl-NL'
    recognition.continuous = true
    recognition.interimResults = true
    shouldSubmitAfterStopRef.current = false

    recognition.onstart = () => setIsRecording(true)
    recognition.onresult = (event) => {
      const spokenChunks: string[] = []
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const chunk = event.results[i]?.[0]?.transcript?.trim()
        if (chunk) spokenChunks.push(chunk)
      }

      const transcript = spokenChunks.join(' ').trim()
      if (!transcript) return
      const nextPrompt = [promptBeforeRecordingRef.current, transcript].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
      setPrompt(nextPrompt)
      promptRef.current = nextPrompt
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
        const spokenPrompt = promptRef.current.trim()
        if (!spokenPrompt) {
          toast({
            title: 'Geen spraak herkend',
            description: 'Probeer opnieuw en spreek iets duidelijker in.',
            variant: 'destructive',
          })
          return
        }
        void submitPromptText(spokenPrompt, { forceSpeak: true })
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [submitPromptText])

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

  const submitPrompt = async (e?: FormEvent) => {
    e?.preventDefault()
    const userMessage = prompt.trim()
    if (!userMessage || isLoading) return
    if (voiceQuestionMode) setVoiceQuestionMode(false)
    await submitPromptText(userMessage)
  }

  const toggleVoiceQuestion = () => {
    if (!voiceSupported || isLoading) return

    if (!voiceQuestionMode) {
      isVoiceQuestionRecordingRef.current = true
      setVoiceQuestionMode(true)
      startRecording({ resetPrompt: true })
      return
    }

    shouldSubmitAfterStopRef.current = true
    stopRecording()
  }

  const resetChat = () => {
    setVoiceQuestionMode(false)
    shouldSubmitAfterStopRef.current = false
    isVoiceQuestionRecordingRef.current = false
    stopRecording()
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setSpeakingMessageIndex(null)
    setMessages([
      {
        role: 'ai',
        content: 'Sessie gereset. Hoe kan ik je opnieuw van dienst zijn?',
        timestamp: new Date()
      }
    ])
  }

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-foreground">
            <span className="rounded-xl bg-linear-to-br from-violet-500/20 to-blue-500/20 p-2 border border-violet-500/20">
              <Bot className="h-6 w-6 text-violet-500" />
            </span>
            AI Assistant
          </h1>
          <p className="mt-1 text-muted-foreground italic text-sm">Altijd verbonden met je live data.</p>
        </div>

        <Button
          variant="outline"
          className="border-border/30 text-muted-foreground hover:text-foreground"
          onClick={resetChat}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Chat wissen
        </Button>

        <Button
          type="button"
          variant={autoSpeakResponses ? 'default' : 'outline'}
          className={cn(
            autoSpeakResponses ? 'bg-violet-600 hover:bg-violet-700 text-white' : 'border-border/30 text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setAutoSpeakResponses((current) => !current)}
        >
          <Volume2 className="mr-2 h-4 w-4" />
          {autoSpeakResponses ? 'Voice Antwoord: Aan' : 'Voice Antwoord: Uit'}
        </Button>

        <Button
          type="button"
          variant={voiceQuestionMode ? 'destructive' : 'outline'}
          className={cn(
            voiceQuestionMode ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'border-border/30 text-muted-foreground hover:text-foreground'
          )}
          onClick={toggleVoiceQuestion}
          disabled={!voiceSupported || isLoading}
        >
          {voiceQuestionMode ? <PhoneOff className="mr-2 h-4 w-4" /> : <PhoneCall className="mr-2 h-4 w-4" />}
          {voiceQuestionMode ? 'Stop & Verstuur' : 'Voice Vraag'}
        </Button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
        {/* Chat Main Area */}
        <Card className="flex-1 bg-card/40 backdrop-blur-xl border-border/30 flex flex-col overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-violet-500/50 via-blue-500/50 to-violet-500/50 opacity-20" />
          
          <ScrollArea className="flex-1 p-6" ref={scrollRef}>
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "flex w-full gap-3",
                      msg.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === 'ai' && (
                      <div className="w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-violet-500" />
                      </div>
                    )}
                    
                  <div className={cn(
                    "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                    msg.role === 'user' 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-card border border-border text-card-foreground rounded-tl-none"
                  )}>
                      {msg.content}
                      {msg.role === 'ai' && (
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            className={cn(
                              'inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/40 transition-colors',
                              speakingMessageIndex === idx
                                ? 'bg-violet-500/10 text-violet-500 border-violet-500/30'
                                : 'bg-background/40 text-muted-foreground hover:text-foreground'
                            )}
                            onClick={() => speakText(msg.content, { messageIndex: idx })}
                            title={speakingMessageIndex === idx ? 'Stop voorlezen' : 'Lees antwoord voor'}
                          >
                            <Volume2 className={cn('h-3.5 w-3.5', speakingMessageIndex === idx && 'animate-pulse')} />
                          </button>
                        </div>
                      )}
                      <div className={cn(
                        "mt-2 text-[10px] opacity-50",
                        msg.role === 'user' ? "text-right" : "text-left"
                      )}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="flex justify-start gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  </div>
                  <div className="bg-card border border-border p-4 rounded-2xl rounded-tl-none">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 bg-card/20 border-t border-border">
            <form onSubmit={submitPrompt} className="space-y-2">
              <div className="flex gap-2">
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Stel een vraag over je data..."
                className="flex-1 bg-background h-12 focus-visible:ring-primary/30"
                disabled={isLoading}
              />
                <Button
                  type="button"
                  variant={isRecording ? 'destructive' : 'outline'}
                  size="icon"
                  className="h-12 w-12"
                  onClick={() => {
                    if (isRecording) {
                      shouldSubmitAfterStopRef.current = false
                      isVoiceQuestionRecordingRef.current = false
                      setVoiceQuestionMode(false)
                      stopRecording()
                      return
                    }
                    setVoiceQuestionMode(false)
                    isVoiceQuestionRecordingRef.current = false
                    startRecording()
                  }}
                  disabled={!voiceSupported || isLoading}
                  title={isRecording ? 'Stop spraakopname' : 'Start spraak-naar-tekst'}
                >
                  {isRecording ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button
                  type="submit"
                  size="icon"
                  className="h-12 w-12 bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={!prompt.trim() || isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {voiceQuestionMode
                  ? 'Voice-vraag actief: spreek je vraag in en klik op "Stop & Verstuur" voor direct AI-antwoord met voice.'
                  : isRecording
                    ? 'Luistert... spreek je vraag in, klik opnieuw op de microfoon om te stoppen.'
                    : voiceSupported
                      ? 'Tip: gebruik de microfoon voor spraak-naar-tekst.'
                      : 'Spraak-naar-tekst wordt niet ondersteund in deze browser.'}
              </p>
            </form>
          </div>
        </Card>

        {/* Sidebar Info */}
        <div className="w-full lg:w-80 space-y-6">
          <Card className="bg-card/60 backdrop-blur-xl border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-violet-500 uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Quick Prompts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickPrompts.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl border border-border/30 bg-background/20 p-3 text-left text-xs text-foreground transition-all hover:bg-violet-500/5 hover:border-violet-500/30 group"
                  onClick={() => setPrompt(item)}
                >
                  <span className="line-clamp-2">{item}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-violet-500 transition-colors shrink-0" />
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-violet-500/5 border-violet-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-violet-500/20 rounded-lg">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                </div>
                <p className="text-sm font-semibold">Privacy & Data</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ArchonPro AI analyseert je data veilig binnen je eigen omgeving. Je data wordt nooit gebruikt om publieke modellen te trainen.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
