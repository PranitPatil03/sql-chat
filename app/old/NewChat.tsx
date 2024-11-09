'use client'

import { useState } from 'react'
import { Loader2, Send, Copy, FileQuestion, FileCheck, PlayCircle, Cpu, MessageSquare, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const API_URL = 'https://sql-chatbot-poc.onrender.com/query'

type Message = {
  type: 'user' | 'bot' | 'error';
  content: string;
  result?: {
    sql: string;
    answer: string;
  };
};

type Step = {
  step: string;
  detail: string;
  icon: React.ComponentType;
};

const steps: Step[] = [
  { step: "Analyzing Query", detail: "Interpreting your question...", icon: FileQuestion },
  { step: "Generating SQL", detail: "Creating an SQL query based on the analysis...", icon: FileCheck },
  { step: "Executing Query", detail: "Running the SQL query...", icon: PlayCircle },
  { step: "Processing Results", detail: "Analyzing the query results...", icon: Cpu },
  { step: "Generating Answer", detail: "Formulating your answer...", icon: MessageSquare },
];

export default function NewChar() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [processing, setProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState<Step | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = { type: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setProcessing(true)
    setError(null)

    try {
      for (const step of steps) {
        setCurrentStep(step)
        await new Promise(resolve => setTimeout(resolve, 800))
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: input }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response from the server')
      }

      const data = await response.json()
      
      const botMessage: Message = {
        type: 'bot',
        content: data.answer || 'Here is the generated SQL query:',
        result: {
          sql: data.sql || 'SELECT * FROM users LIMIT 1',
          answer: data.answer || 'Query executed successfully',
        },
      }

      setMessages(prev => [...prev, botMessage])
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to get response from the server. Please try again later.')
      setMessages(prev => [...prev, { 
        type: 'error', 
        content: 'Sorry, I encountered an error while processing your request. Please try again.' 
      }])
    } finally {
      setProcessing(false)
      setCurrentStep(null)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold">SQL Assistant</h1>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-4">
        <ScrollArea className="h-full">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <MessageSquare className="h-12 w-12 text-muted-foreground" />
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Welcome to SQL Assistant</h2>
                <p className="text-muted-foreground max-w-sm">
                  Ask me questions about your database and I'll help you generate and execute SQL queries.
                </p>
              </div>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 ${
                message.type === 'user' ? 'text-right' : 'text-left'
              }`}
            >
              <div
                className={`inline-block p-3 rounded-lg max-w-[80%] ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : message.type === 'error'
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.result && (
                  <div className="mt-2">
                    <div className="mb-2 font-semibold">Generated SQL:</div>
                    <pre className="p-2 bg-muted-foreground/10 rounded text-sm overflow-x-auto">
                      {message.result.sql}
                    </pre>
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(message.result.sql)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy SQL
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {processing && currentStep && (
            <Card className="mb-4 p-4">
              <div className="flex items-center space-x-2">
                <currentStep.icon className="w-5 h-5 animate-pulse" />
                <span>{currentStep.step}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{currentStep.detail}</p>
            </Card>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </ScrollArea>
      </main>

      <footer className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about your database..."
            className="flex-1"
            disabled={processing}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="submit" disabled={processing}>
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span className="sr-only">Send message</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send message</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </form>
      </footer>
    </div>
  )
}