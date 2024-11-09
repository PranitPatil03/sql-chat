'use client'

import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Loader2, Send, Copy, Database, Menu, X, Plus, FileQuestion, FileCheck, PlayCircle, Cpu, MessageSquare, AlertCircle } from 'lucide-react'
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const API_URL = 'https://sql-chatbot-poc.onrender.com/query'

type Message = {
  type: 'user' | 'bot' | 'error';
  content: string;
  result?: {
    sql: string;
    answer: string;
    columns?: string[];
    rows?: any[];
  };
};

type Chat = {
  id: string;
  title: string;
  messages: Message[];
};

type DBConnection = {
  type: string;
  host: string;
  port: string;
  username: string;
  password: string;
  database: string;
};

type Step = {
  step: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
};

const steps: Step[] = [
  { step: "Analyzing Query", detail: "Interpreting your question...", icon: FileQuestion },
  { step: "Generating SQL", detail: "Creating an SQL query based on the analysis...", icon: FileCheck },
  { step: "Executing Query", detail: "Running the SQL query...", icon: PlayCircle },
  { step: "Processing Results", detail: "Analyzing the query results...", icon: Cpu },
  { step: "Generating Answer", detail: "Formulating your answer...", icon: MessageSquare },
];

export default function SQLChatbot() {
  const [chats, setChats] = useState<Chat[]>(() => {
    if (typeof window !== 'undefined') {
      const savedChats = localStorage.getItem('sqlChatbotChats');
      return savedChats ? JSON.parse(savedChats) : [{ id: uuidv4(), title: 'New Chat', messages: [] }];
    }
    return [{ id: uuidv4(), title: 'New Chat', messages: [] }];
  });
  const [currentChatId, setCurrentChatId] = useState<string>(chats[0].id);
  const [input, setInput] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<Step | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dbConnection, setDbConnection] = useState<DBConnection>({
    type: '',
    host: '',
    port: '',
    username: '',
    password: '',
    database: '',
  });
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [showConnectionModal, setShowConnectionModal] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sqlChatbotChats', JSON.stringify(chats));
    }
  }, [chats]);

  const currentChat = chats.find(chat => chat.id === currentChatId) || chats[0];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { type: 'user', content: input };
    updateChat(currentChatId, [...currentChat.messages, userMessage]);
    setInput('');
    setProcessing(true);
    setError(null);

    try {
      for (const step of steps) {
        setCurrentStep(step);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: input }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from the server');
      }

      const data = await response.json();
      
      const botMessage: Message = {
        type: 'bot',
        content: data.answer || 'Here is the generated SQL query:',
        result: {
          sql: data.sql || 'SELECT * FROM users LIMIT 1',
          answer: data.answer || 'Query executed successfully',
          columns: data.columns,
          rows: data.rows,
        },
      };

      updateChat(currentChatId, [...currentChat.messages, userMessage, botMessage]);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to get response from the server. Please try again later.');
      updateChat(currentChatId, [...currentChat.messages, userMessage, { 
        type: 'error', 
        content: 'Sorry, I encountered an error while processing your request. Please try again.' 
      }]);
    } finally {
      setProcessing(false);
      setCurrentStep(null);
    }
  };

  const handleConnectionSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Database connection submitted:', dbConnection);
    setShowConnectionModal(false);
  };

  const createNewChat = () => {
    const newChat: Chat = { id: uuidv4(), title: 'New Chat', messages: [] };
    setChats([...chats, newChat]);
    setCurrentChatId(newChat.id);
  };

  const updateChat = (chatId: string, messages: Message[]) => {
    setChats(chats.map(chat => 
      chat.id === chatId ? { ...chat, messages, title: messages[0]?.content.slice(0, 30) || 'New Chat' } : chat
    ));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
          <nav className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4">
              <h2 className="text-lg font-semibold">Chat History</h2>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-2 cursor-pointer ${chat.id === currentChatId ? 'bg-accent' : 'hover:bg-accent'}`}
                  onClick={() => {
                    setCurrentChatId(chat.id);
                    setSidebarOpen(false);
                  }}
                >
                  {chat.title}
                </div>
              ))}
            </ScrollArea>
            <Button className="m-4" onClick={createNewChat}>
              <Plus className="mr-2 h-4 w-4" /> New Chat
            </Button>
          </nav>
        </SheetContent>
      </Sheet>

      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <h1 className="text-2xl font-bold">SQL Assistant</h1>
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
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">
                      Password
                    </Label>
                    <Input
                      id="password"
                      value={dbConnection.password}
                      onChange={(e) => setDbConnection({ ...dbConnection, password: e.target.value })}
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
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save changes</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </header>

        <main className="flex-1 overflow-hidden p-4">
          <ScrollArea className="h-full">
            {currentChat.messages.length === 0 && (
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
            
            {currentChat.messages.map((message, index) => (
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
    </div>
  )
}