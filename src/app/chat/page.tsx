"use client";

import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { useMcpServers } from "@/components/tambo/mcp-config-modal";
import { components, tools } from "@/lib/tambo";
import { TamboProvider } from "@tambo-ai/react";
import { GitBranch } from "lucide-react";

export default function Home() {
  const mcpServers = useMcpServers();

  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={components}
      tools={tools}
      tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL}
      mcpServers={mcpServers}
    >
      <div className="h-screen flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-primary" />
            <span className="font-semibold">GitStory</span>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <MessageThreadFull className="max-w-4xl mx-auto h-full" />
        </div>
      </div>
    </TamboProvider>
  );
}
