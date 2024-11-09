import { Suspense } from 'react'
import { Loader2, Send, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Card } from '@/components/ui/card'

type Step = {
  step: string;
  detail: string;
};

type BackendResponse = {
  steps: Step[];
  final_answer: string;
  sql_queries: string[];
};

async function getQueryResponse(input: string): Promise<BackendResponse> {
  const response = await fetch('https://your-backend-api-url.com/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question: input }),
  });

  if (!response.ok) {
    throw new Error('Failed to get response from the server');
  }

  return response.json();
}

function QueryResult({ result }: { result: BackendResponse }) {
  return (
    <div className="space-y-4">
      {result.steps.map((step, index) => (
        <Card key={index} className="p-4">
          <h3 className="font-semibold">{step.step}</h3>
          <p className="text-sm text-muted-foreground">{step.detail}</p>
        </Card>
      ))}
      <div className="bg-muted p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Final Answer:</h3>
        <p>{result.final_answer}</p>
      </div>
      {result.sql_queries.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Generated SQL Queries:</h3>
          {result.sql_queries.map((query, index) => (
            <pre key={index} className="p-2 bg-muted-foreground/10 rounded text-sm overflow-x-auto mb-2">
              {query}
            </pre>
          ))}
        </div>
      )}
    </div>
  );
}

function QueryForm() {
  return (
    <form action="/api/query" method="POST" className="flex space-x-2">
      <Input
        type="text"
        name="question"
        placeholder="Ask me about your database..."
        className="flex-1"
      />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="submit">
              <Send className="w-4 h-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Send message</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </form>
  );
}

export default async function SQLAssistant({ searchParams }: { searchParams: { question?: string } }) {
  let result: BackendResponse | null = null;

  if (searchParams.question) {
    result = await getQueryResponse(searchParams.question);
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Database className="w-6 h-6" />
          <h1 className="text-2xl font-bold">SQL Assistant</h1>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-4">
        <ScrollArea className="h-full">
          {!result && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <Database className="h-12 w-12 text-muted-foreground" />
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Welcome to SQL Assistant</h2>
                <p className="text-muted-foreground max-w-sm">
                  Ask me questions about your database and I'll help you generate and execute SQL queries.
                </p>
              </div>
            </div>
          )}
          
          <Suspense fallback={<Loader2 className="w-6 h-6 animate-spin" />}>
            {result && <QueryResult result={result} />}
          </Suspense>
        </ScrollArea>
      </main>

      <footer className="p-4 border-t">
        <QueryForm />
      </footer>
    </div>
  );
}