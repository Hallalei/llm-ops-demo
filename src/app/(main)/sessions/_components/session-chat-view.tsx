"use client";

import * as React from "react";
import { AddToDatasetDialog } from "@/components/datasets/add-to-dataset-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/core/utils";
import type { SessionConversation } from "../lib/queries";
import { ChatBubble } from "./chat-bubble";

type Language = "zh" | "original";

interface SessionChatViewProps {
  conversations: SessionConversation[];
  sessionId: string;
}

interface DatasetDialogState {
  open: boolean;
  conversationId: number;
  contextCount: number;
  query: string;
}

/**
 * Session chat view component
 * Shows complete conversation history with Chinese/original toggle
 */
export function SessionChatView({
  conversations,
  sessionId,
}: SessionChatViewProps) {
  const [language, setLanguage] = React.useState<Language>("zh");
  const showTranslation = language === "zh";

  const [dialogState, setDialogState] = React.useState<DatasetDialogState>({
    open: false,
    conversationId: 0,
    contextCount: 0,
    query: "",
  });

  const handleAddToDataset = (conv: SessionConversation, index: number) => {
    setDialogState({
      open: true,
      conversationId: conv.id,
      contextCount: index, // Previous conversations count
      query: conv.query || "",
    });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="text-muted-foreground text-sm">
          {conversations.length} messages
        </div>
        <LanguageToggle language={language} onChange={setLanguage} />
      </div>

      {/* Chat content */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 py-4">
          {conversations.map((conv, index) => (
            <React.Fragment key={conv.id}>
              {/* User message */}
              {conv.query && (
                <ChatBubble
                  messageRole="user"
                  content={conv.query}
                  contentZh={conv.queryZh}
                  timestamp={conv.createdTime}
                  showTranslation={showTranslation}
                />
              )}
              {/* AI response */}
              {conv.response && (
                <ChatBubble
                  messageRole="assistant"
                  content={conv.response}
                  contentZh={conv.responseZh}
                  showTranslation={showTranslation}
                  conversationId={conv.id}
                  contextCount={index}
                  onAddToDataset={() => handleAddToDataset(conv, index)}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </ScrollArea>

      {/* Add to Dataset Dialog */}
      <AddToDatasetDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((prev) => ({ ...prev, open }))}
        source="session"
        conversationId={dialogState.conversationId}
        sessionId={sessionId}
        preview={{
          query: dialogState.query,
          contextCount: dialogState.contextCount,
        }}
      />
    </div>
  );
}

/**
 * Language toggle button
 */
function LanguageToggle({
  language,
  onChange,
}: {
  language: Language;
  onChange: (language: Language) => void;
}) {
  return (
    <div className="inline-flex h-8 items-center rounded-md border bg-muted p-0.5 text-muted-foreground">
      <button
        onClick={() => onChange("zh")}
        className={cn(
          "inline-flex items-center justify-center rounded-sm px-3 py-1.5 font-medium text-sm transition-colors",
          language === "zh"
            ? "bg-background text-foreground shadow-sm"
            : "hover:bg-background/50",
        )}
      >
        Chinese
      </button>
      <button
        onClick={() => onChange("original")}
        className={cn(
          "inline-flex items-center justify-center rounded-sm px-3 py-1.5 font-medium text-sm transition-colors",
          language === "original"
            ? "bg-background text-foreground shadow-sm"
            : "hover:bg-background/50",
        )}
      >
        Original
      </button>
    </div>
  );
}
