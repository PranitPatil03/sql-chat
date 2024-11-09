"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

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

type ServerResponse = {
  steps: Step[];
  final_answer: string;
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

// const sampleQuestions = [
//   "What is the total production of Rice in the year 2000?",
//   "Which state had the highest production of Arecanut in the year 2000?",
//   "What is the total area of crop production in the district of NICOBARS in the year 2000?",
//   "What are the different crops produced in the Andaman and Nicobar Islands in the year 2000?",
//   "Which season had the highest production of crops in the year 2000?",
// ];

export default function SQLAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { type: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setCurrentStep(null);

    try {
      for (const step of steps) {
        setCurrentStep(step);
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }

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
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error fetching response:", error);
      setMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setCurrentStep(null);
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Database className="w-6 h-6" />
          <h1 className="text-2xl font-bold">SQL Assistant</h1>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">Welcome to SQL Assistant</h2>
            <p className="text-muted-foreground">
              Ask me questions about your database and I&apos;ll help you
              generate and execute SQL queries.
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
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
        {isLoading && currentStep && (
          <Card className="mb-4 p-4">
            <div className="flex items-center space-x-2">
              <currentStep.icon className="w-5 h-5 animate-pulse" />
              <span className="font-semibold">{currentStep.step}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {currentStep.detail}
            </p>
          </Card>
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
    </div>
  );
}
