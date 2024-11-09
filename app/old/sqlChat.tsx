'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2, Send, Copy, Download, Database, Menu, X, Link, Bot, Cpu, FileQuestion, FileCheck, PlayCircle, CheckSquare, MessageSquare, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

type Message = {
  type: 'user' | 'bot';
  content: string;
  result?: {
    sql: string;
    columns: string[];
    rows: Array<{ [key: string]: number | string }>;
  };
};

type Step = {
  step: string;
  detail: string;
  icon: React.ComponentType;
};

export default function SQLChatbot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState<string>('')
  const [processing, setProcessing] = useState<boolean>(false)
  const [currentStep, setCurrentStep] = useState<Step | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement | null>(null)
  const [showConnectionModal, setShowConnectionModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dbConnection, setDbConnection] = useState({
    type: '',
    host: '',
    port: '',
    username: '',
    password: '',
    database: '',
  })

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages, currentStep])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = { type: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setProcessing(true)

    try {
      // Simulate bot response
      await simulateBotResponse()
    } catch (error) {
      console.error('Error simulating bot response:', error)
    } finally {
      setProcessing(false)
      setCurrentStep(null)
    }
  }

  const steps = [
    { step: "Connecting to Database", detail: "Establishing connection to the database to retrieve schema.", icon: Link },
    { step: "Retrieved Schema", detail: "Successfully retrieved the database schema.", icon: CheckCircle2 },
    { step: "Initializing SQL Agent", detail: "Creating SQL agent with the retrieved schema.", icon: Bot },
    { step: "SQL Agent Initialized", detail: "SQL agent is ready to generate queries.", icon: Cpu },
    { step: "Generating SQL Query", detail: "Generating SQL query for the question: 'How many employees are there?'", icon: FileQuestion },
    { step: "SQL Query Generated", detail: "SQL query generated successfully.", icon: FileCheck },
    { step: "Executing SQL Query", detail: "Running the SQL query against the database.", icon: PlayCircle },
    { step: "SQL Query Executed", detail: "SQL query executed successfully.", icon: CheckSquare },
    { step: "Generating Final Answer", detail: "Formatting the response to the user.", icon: MessageSquare },
    { step: "Final Answer Generated", detail: "Final answer generated successfully.", icon: CheckCircle2 },
  ]

  const simulateBotResponse = async () => {
    for (const step of steps) {
      setCurrentStep(step)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Simulated result
    const result = {
      sql: 'SELECT COUNT(*) AS employee_count FROM employees',
      columns: ['employee_count'],
      rows: [{ employee_count: 8 }],
    }

    setMessages(prev => [...prev, { type: 'bot', content: 'Here are the results:', result }])
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleConnectionSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically validate the connection and store it securely
    console.log('Database connection submitted:', dbConnection)
    setShowConnectionModal(false)
  }

  return (
    <div className="flex h-screen bg-background">
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
          <nav className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4">
              <h2 className="text-lg font-semibold">Conversation History</h2>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              {messages.map((message, index) => (
                <div key={index} className="p-2 hover:bg-accent rounded-lg cursor-pointer">
                  <p className="font-medium">{message.type === 'user' ? 'You' : 'SQL Bot'}</p>
                  <p className="text-sm text-muted-foreground truncate">{message.content}</p>
                </div>
              ))}
            </ScrollArea>
          </nav>
        </SheetContent>
      </Sheet>

      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold">SQL Chatbot</h1>
          </div>
          
          <Dialog open={showConnectionModal} onOpenChange={setShowConnectionModal}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Database className="w-4 h-4 mr-2" />
                Database Connection
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Database Connection</DialogTitle>
                <DialogDescription>
                  Enter your database connection details. This information will be used to execute your SQL queries.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleConnectionSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="dbType" className="text-right">
                      Type
                    </Label>
                    <Select
                      value={dbConnection.type}
                      onValueChange={(value) => setDbConnection({ ...dbConnection, type: value })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select database type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mysql">MySQL</SelectItem>
                        <SelectItem value="postgresql">PostgreSQL</SelectItem>
                        <SelectItem value="sqlite">SQLite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="host" className="text-right">
                      Host
                    </Label>
                    <Input
                      id="host"
                      value={dbConnection.host}
                      onChange={(e) => setDbConnection({ ...dbConnection, host: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="port" className="text-right">
                      Port
                    </Label>
                    <Input
                      id="port"
                      value={dbConnection.port}
                      onChange={(e) => setDbConnection({ ...dbConnection, port: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">
                      Username
                    </Label>
                    <Input
                      id="username"
                      value={dbConnection.username}
                      onChange={(e) => setDbConnection({ ...dbConnection, username: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={dbConnection.password}
                      onChange={(e) => setDbConnection({ ...dbConnection, password: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="database" className="text-right">
                      Database
                    </Label>
                    <Input
                      id="database"
                      value={dbConnection.database}
                      onChange={(e) => setDbConnection({ ...dbConnection, database: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save Connection</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <nav className="w-[300px] hidden md:block p-4 border-r overflow-auto">
            <h2 className="text-lg font-semibold mb-4">Conversation History</h2>
            {messages.map((message, index) => (
              <div key={index} className="mb-2 p-2 hover:bg-accent rounded-lg cursor-pointer">
                <p className="font-medium">{message.type === 'user' ? 'You' : 'SQL Bot'}</p>
                <p className="text-sm text-muted-foreground truncate">{message.content}</p>
              </div>
            ))}
          </nav>

          <main className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-4 ${
                    message.type === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-block p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.content}
                    {message.result && (
                      <div className="mt-2">
                        <div className="mb-2 font-semibold">Generated SQL:</div>
                        <pre className="p-2 bg-muted-foreground/10 rounded text-sm overflow-x-auto">
                          {message.result.sql}
                        </pre>
                        <div className="mt-2 mb-2 font-semibold">Query Results:</div>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
                                {message.result.columns.map((column, index) => (
                                  <th key={index} className="border p-2 bg-muted">
                                    {column}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {message.result.rows.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                  {message.result.columns.map((column, colIndex) => (
                                    <td key={colIndex} className="border p-2">
                                      {row[column]}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-2 space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(message.result.sql)}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy SQL
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              /* Implement download logic */
                            }}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Results
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
            </ScrollArea>

            <footer className="p-4 border-t">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <Input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter your SQL query or question..."
                  className="flex-1"
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
                        <span className="sr-only">Send</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Send query</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </form>
            </footer>
          </main>
        </div>
      </div>
    </div>
  )
}
