"use client";

import { Check, Loader2, Plus } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/core/utils";

interface Dataset {
  id: string;
  name: string;
  description: string | null;
  itemCount: number;
}

interface ConversationItem {
  id: number;
  query: string;
}

interface BatchAddToDatasetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversations: ConversationItem[];
  onSuccess?: () => void;
}

export function BatchAddToDatasetDialog({
  open,
  onOpenChange,
  conversations,
  onSuccess,
}: BatchAddToDatasetDialogProps) {
  const [datasets, setDatasets] = React.useState<Dataset[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [note, setNote] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showNewForm, setShowNewForm] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newDescription, setNewDescription] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);

  // Load datasets
  React.useEffect(() => {
    if (open) {
      setIsLoading(true);
      fetch("/api/datasets")
        .then((res) => res.json() as Promise<Dataset[]>)
        .then((data) => setDatasets(data))
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      // Reset state when closing
      setSelectedIds(new Set());
      setNote("");
      setShowNewForm(false);
      setNewName("");
      setNewDescription("");
    }
  }, [open]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreateDataset = async () => {
    if (!newName.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/datasets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim() || undefined,
        }),
      });
      const dataset = (await res.json()) as Dataset;
      setDatasets((prev) => [dataset, ...prev]);
      setSelectedIds((prev) => new Set(prev).add(dataset.id));
      setShowNewForm(false);
      setNewName("");
      setNewDescription("");
    } catch (error) {
      console.error("Failed to create dataset:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0 || conversations.length === 0) return;

    setIsSubmitting(true);
    try {
      let successCount = 0;
      let failCount = 0;

      // Add all conversations to all selected datasets
      for (const datasetId of selectedIds) {
        for (const conversation of conversations) {
          try {
            const res = await fetch(`/api/datasets/${datasetId}/items`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                source: "trace",
                conversationId: conversation.id,
                note: note.trim() || undefined,
              }),
            });
            if (res.ok) {
              successCount++;
            } else {
              failCount++;
            }
          } catch {
            failCount++;
          }
        }
      }

      if (successCount > 0) {
        toast.success(
          `成功添加 ${successCount} 条数据到 ${selectedIds.size} 个数据集`,
        );
      }
      if (failCount > 0) {
        toast.error(`${failCount} 条数据添加失败`);
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to add to datasets:", error);
      toast.error("批量添加失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>批量添加到数据集</DialogTitle>
          <DialogDescription>
            将 {conversations.length} 条对话添加到数据集
          </DialogDescription>
        </DialogHeader>

        {/* Preview */}
        <div className="space-y-2 rounded-md border bg-muted/50 p-3">
          <div className="flex items-center gap-2">
            <Badge variant="default">{conversations.length} 条对话</Badge>
          </div>
          <div className="space-y-1">
            {conversations.slice(0, 3).map((conv) => (
              <p
                key={conv.id}
                className="line-clamp-1 text-muted-foreground text-xs"
              >
                {conv.query}
              </p>
            ))}
            {conversations.length > 3 && (
              <p className="text-muted-foreground text-xs">
                ...还有 {conversations.length - 3} 条
              </p>
            )}
          </div>
        </div>

        {/* Dataset list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>选择数据集</Label>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowNewForm(!showNewForm)}
            >
              <Plus className="mr-1 size-3" />
              新建
            </Button>
          </div>

          {/* New dataset form */}
          {showNewForm && (
            <div className="space-y-2 rounded-md border p-3">
              <Input
                id="batch-new-dataset-name"
                placeholder="数据集名称"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <Input
                id="batch-new-dataset-description"
                placeholder="描述（可选）"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewForm(false)}
                >
                  取消
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateDataset}
                  disabled={!newName.trim() || isCreating}
                >
                  {isCreating && (
                    <Loader2 className="mr-1 size-3 animate-spin" />
                  )}
                  创建
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : datasets.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              暂无数据集，请先创建
            </div>
          ) : (
            <ScrollArea className="h-48">
              <div className="space-y-1">
                {datasets.map((dataset) => (
                  <div
                    key={dataset.id}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50",
                      selectedIds.has(dataset.id) &&
                        "border-primary bg-primary/5",
                    )}
                    onClick={() => toggleSelection(dataset.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleSelection(dataset.id);
                      }
                    }}
                  >
                    <Checkbox
                      id={`batch-dataset-checkbox-${dataset.id}`}
                      checked={selectedIds.has(dataset.id)}
                      onCheckedChange={() => toggleSelection(dataset.id)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sm">
                        {dataset.name}
                      </p>
                      {dataset.description && (
                        <p className="truncate text-muted-foreground text-xs">
                          {dataset.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {dataset.itemCount} 条
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Note */}
        <div className="space-y-2">
          <Label htmlFor="batch-note">批量备注（可选）</Label>
          <Textarea
            id="batch-note"
            placeholder="为这批数据添加备注，如：低忠诚度样本、回复离题..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedIds.size === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Check className="mr-2 size-4" />
            )}
            添加 {conversations.length} 条到 {selectedIds.size} 个数据集
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
