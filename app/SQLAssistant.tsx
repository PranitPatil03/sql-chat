"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Send,
  Database,
  CheckCircle2,
  Link,
  Bot,
  Cpu,
  FileQuestion,
  FileCheck,
  PlayCircle,
  CheckSquare,
  MessageSquare,
  Plus,
  Menu,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_URL = "https://sql-chatbot-poc.onrender.com/query";

type Step = {
  step: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
};

type Message = {
  type: "user" | "assistant";
  content: string;
};

type Chat = {
  id: string;
  name: string;
  messages: Message[];
};

type ServerResponse = {
  steps: Step[];
  final_answer: string;
};

type DBConnection = {
  type: string;
  host: string;
  port: string;
  username: string;
  password: string;
  database: string;
};

const steps: Step[] = [
  {
    step: "Connecting to Database",
    detail: "Establishing connection to the database to retrieve schema.",
    icon: Link,
  },
  {
    step: "Retrieved Schema",
    detail: "Successfully retrieved the database schema.",
    icon: CheckCircle2,
  },
  {
    step: "Initializing SQL Agent",
    detail: "Creating SQL agent with the retrieved schema.",
    icon: Bot,
  },
  {
    step: "SQL Agent Initialized",
    detail: "SQL agent is ready to generate queries.",
    icon: Cpu,
  },
  {
    step: "Generating SQL Query",
    detail: "Generating SQL query for the question.",
    icon: FileQuestion,
  },
  {
    step: "SQL Query Generated",
    detail: "SQL query generated successfully.",
    icon: FileCheck,
  },
  {
    step: "Executing SQL Query",
    detail: "Running the SQL query against the database.",
    icon: PlayCircle,
  },
  {
    step: "SQL Query Executed",
    detail: "SQL query executed successfully.",
    icon: CheckSquare,
  },
  {
    step: "Generating Final Answer",
    detail: "Formatting the response to the user.",
    icon: MessageSquare,
  },
  {
    step: "Final Answer Generated",
    detail: "Final answer generated successfully.",
    icon: CheckCircle2,
  },
];

// LoadingDots component
const LoadingDots = () => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "") return ".";
        if (prev === ".") return "..";
        if (prev === "..") return "...";
        return "";
      });
    }, 500); // Change dots every 500ms

    return () => clearInterval(interval);
  }, []);

  return <span className="inline-block min-w-[24px] text-left">{dots}</span>;
};

export default function SQLAssistant() {
  const [chats, setChats] = useState<Chat[]>(() => {
    if (typeof window !== "undefined") {
      const savedChats = localStorage.getItem("sqlAssistantChats");
      return savedChats
        ? JSON.parse(savedChats)
        : [{ id: uuidv4(), name: "New Chat", messages: [] }];
    }
    return [{ id: uuidv4(), name: "New Chat", messages: [] }];
  });
  const [currentChatId, setCurrentChatId] = useState<string>(chats[0].id);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number>(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dbConnection, setDbConnection] = useState<DBConnection>({
    type: "",
    host: "",
    port: "",
    username: "",
    password: "",
    database: "",
  });
  console.log(completedSteps);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sqlAssistantChats", JSON.stringify(chats));
    }
  }, [chats]);

  const currentChat =
    chats.find((chat) => chat.id === currentChatId) || chats[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { type: "user", content: input };
    updateChat(currentChatId, [...currentChat.messages, userMessage]);
    setInput("");
    setIsLoading(true);
    setCurrentStep(null);
    setCompletedSteps(0);

    try {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i]);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setCompletedSteps(i + 1);
      }

      setCurrentStep({
        step: "Finalizing",
        detail: "Preparing the final response",
        icon: Loader2,
      });
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from the server");
      }

      const data: ServerResponse = await response.json();

      const assistantMessage: Message = {
        type: "assistant",
        content: data.final_answer,
      };
      updateChat(currentChatId, [
        ...currentChat.messages,
        userMessage,
        assistantMessage,
      ]);
    } catch (error) {
      console.error("Error fetching response:", error);
      updateChat(currentChatId, [
        ...currentChat.messages,
        userMessage,
        {
          type: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setCurrentStep(null);
      setCompletedSteps(0);
    }
  }

  function createNewChat() {
    const newChat: Chat = { id: uuidv4(), name: "New Chat", messages: [] };
    setChats((prev) => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setSidebarOpen(false);
  }

  function updateChat(chatId: string, messages: Message[]) {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages,
              name: messages[0]?.content.slice(0, 30) || "New Chat",
            }
          : chat
      )
    );
  }

  function handleConnectionSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("Database connection submitted:", dbConnection);
  }

  return (
    <div className="flex h-screen bg-background">
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-200 ease-in-out md:relative md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <Button className="w-full" onClick={createNewChat}>
              <Plus className="mr-2 h-4 w-4" /> New Chat
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Chat History</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="md:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="flex-grow">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`p-2 cursor-pointer ${
                  chat.id === currentChatId ? "bg-accent" : "hover:bg-accent"
                }`}
                onClick={() => {
                  setCurrentChatId(chat.id);
                  setSidebarOpen(false);
                }}
              >
                {chat.name}
              </div>
            ))}
          </ScrollArea>
        </div>
      </div>

      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <Database className="w-6 h-6" />
            <h1 className="text-2xl font-bold">SQL Assistant</h1>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Database className="w-4 h-4 mr-2" />
                Database Connection
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <form onSubmit={handleConnectionSubmit} className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dbType">Type</Label>
                  <Select
                    value={dbConnection.type}
                    onValueChange={(value) =>
                      setDbConnection((prev) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger id="dbType">
                      <SelectValue placeholder="Select database type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mysql">MySQL</SelectItem>
                      <SelectItem value="postgresql">PostgreSQL</SelectItem>
                      <SelectItem value="sqlite">SQLite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="host">Host</Label>
                  <Input
                    id="host"
                    value={dbConnection.host}
                    onChange={(e) =>
                      setDbConnection((prev) => ({
                        ...prev,
                        host: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    value={dbConnection.port}
                    onChange={(e) =>
                      setDbConnection((prev) => ({
                        ...prev,
                        port: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={dbConnection.username}
                    onChange={(e) =>
                      setDbConnection((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={dbConnection.password}
                    onChange={(e) =>
                      setDbConnection((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="database">Database</Label>
                  <Input
                    id="database"
                    value={dbConnection.database}
                    onChange={(e) =>
                      setDbConnection((prev) => ({
                        ...prev,
                        database: e.target.value,
                      }))
                    }
                  />
                </div>
                <Button type="submit">Save Connection</Button>
              </form>
            </PopoverContent>
          </Popover>
        </header>

        <main className="flex-1 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-10rem)] p-4">
            {currentChat.messages.length === 0 ? (
              <div className="text-center space-y-4">
                <h2 className="text-xl font-semibold">
                  Welcome to SQL Assistant
                </h2>
                <p className="text-muted-foreground">
                  Ask me questions about your database and I&apos;ll help you
                  generate and execute SQL queries.
                </p>
              </div>
            ) : (
              currentChat.messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-4 ${
                    message.type === "user" ? "text-right" : "text-left"
                  }`}
                >
                  <div
                    className={`inline-block p-3 rounded-lg ${
                      message.type === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="mb-4 p-4">
                <div className="flex items-center space-x-2">
                  {currentStep && (
                    <>
                      {currentStep.step === "Finalizing" ? (
                        <Loader2 className="w-5 h-5 animate-spin text-black" />
                      ) : (
                        <currentStep.icon className="w-5 h-5 animate-pulse text-black" />
                      )}
                      <span className="text-black">
                        {currentStep.step}
                        <span className="ml-1">
                          <LoadingDots />
                        </span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>

          <footer className="p-4 border-t">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me about your database..."
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading}>
                <Send className="w-4 h-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </form>
          </footer>
        </main>
      </div>
    </div>
  );
}
