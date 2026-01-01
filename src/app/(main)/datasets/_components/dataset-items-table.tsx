"use client";

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  MessageSquare,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { DatasetItem, DatasetItemContent } from "@/db/schema";

interface DatasetItemsTableProps {
  items: DatasetItem[];
  datasetId: string;
}

export function DatasetItemsTable({
  items,
  datasetId,
}: DatasetItemsTableProps) {
  const { canEdit } = useAuth();
  const router = useRouter();
  const [selectedItem, setSelectedItem] = React.useState<DatasetItem | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = React.useState<DatasetItem | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await fetch(`/api/datasets/${datasetId}/items/${deleteTarget.id}`, {
        method: "DELETE",
      });
      router.refresh();
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete item:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <MessageSquare className="mb-4 size-12 text-muted-foreground/50" />
          <p className="mb-2 font-medium">No items yet</p>
          <p className="text-center text-muted-foreground text-sm">
            Add conversations from the Traces table or Session view
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead className="w-[400px]">Input</TableHead>
                <TableHead className="text-right">Context</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const content = item.content as DatasetItemContent;
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {item.source === "session" ? "Session" : "Trace"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[400px]">
                      <p className="line-clamp-2 text-sm">{content.input}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      {content.context?.length ?? 0}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-muted-foreground">
                      {item.note || "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => setSelectedItem(item)}
                        >
                          <Eye className="size-4" />
                        </Button>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(item)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Item detail sheet */}
      <ItemDetailSheet
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this item from the dataset? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ItemDetailSheet({
  item,
  onClose,
}: {
  item: DatasetItem | null;
  onClose: () => void;
}) {
  if (!item) return null;

  const content = item.content as DatasetItemContent;

  return (
    <Sheet open={!!item} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Item Detail
            <Badge variant="outline">
              {item.source === "session" ? "Session" : "Trace"}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            Conversation ID: {content.conversationId}
            {content.sessionId && ` | Session: ${content.sessionId}`}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="mt-4 h-[calc(100vh-180px)]">
          <div className="space-y-4 pr-4">
            {/* Context messages */}
            {content.context && content.context.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">
                  Context ({content.context.length} messages)
                </h4>
                <div className="space-y-2 rounded-md bg-muted/50 p-3">
                  {content.context.map((msg, i) => (
                    <div
                      key={i}
                      className={`text-sm ${msg.role === "user" ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}
                    >
                      <span className="font-medium">
                        {msg.role === "user" ? "User: " : "AI: "}
                      </span>
                      <span className="line-clamp-3">{msg.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Input (User Query)</h4>
              <div className="rounded-md border bg-blue-50 p-3 dark:bg-blue-950/20">
                <p className="whitespace-pre-wrap text-sm">{content.input}</p>
              </div>
            </div>

            {/* Note */}
            {item.note && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Note</h4>
                <p className="text-muted-foreground text-sm">{item.note}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="space-y-2 border-t pt-4">
              <h4 className="font-medium text-sm">Metadata</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Source:</span>{" "}
                  {item.source}
                </div>
                <div>
                  <span className="text-muted-foreground">Added:</span>{" "}
                  {new Date(item.createdAt).toLocaleString()}
                </div>
                {content.positionInSession !== undefined && (
                  <div>
                    <span className="text-muted-foreground">Position:</span>{" "}
                    {content.positionInSession + 1} in session
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
