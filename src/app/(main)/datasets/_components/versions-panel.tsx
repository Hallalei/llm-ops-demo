"use client";

import { History, Loader2, Plus } from "lucide-react";
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
  DialogTrigger,
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
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

interface Version {
  id: string;
  version: number;
  name: string | null;
  description: string | null;
  itemCount: number;
  createdAt: Date;
}

interface VersionsPanelProps {
  versions: Version[];
  datasetId: string;
  currentItemCount: number;
}

export function VersionsPanel({
  versions,
  datasetId,
  currentItemCount,
}: VersionsPanelProps) {
  const { canEdit } = useAuth();
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);

  const handleCreateVersion = async () => {
    setIsCreating(true);
    try {
      await fetch(`/api/datasets/${datasetId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });
      router.refresh();
      setIsCreateOpen(false);
      setName("");
      setDescription("");
    } catch (error) {
      console.error("Failed to create version:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="mr-2 size-4" />
          Versions ({versions.length})
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Version History</SheetTitle>
          <SheetDescription>
            Create snapshots of your dataset for versioning
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Create version button - only show for users with edit permission */}
          {canEdit && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" disabled={currentItemCount === 0}>
                  <Plus className="mr-2 size-4" />
                  Create Version Snapshot
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Version</DialogTitle>
                  <DialogDescription>
                    Create a snapshot of the current {currentItemCount} items
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="version-name">Name (optional)</Label>
                    <Input
                      id="version-name"
                      placeholder={`v${versions.length + 1}`}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="version-desc">Description (optional)</Label>
                    <Textarea
                      id="version-desc"
                      placeholder="What's in this version..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateVersion} disabled={isCreating}>
                    {isCreating && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Versions list */}
          <ScrollArea className="h-[calc(100vh-280px)]">
            {versions.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground text-sm">
                No versions yet. Create your first snapshot.
              </p>
            ) : (
              <div className="space-y-2">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="rounded-md border p-3 hover:bg-muted/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {version.name || `v${version.version}`}
                      </span>
                      <Badge variant="secondary">
                        {version.itemCount} items
                      </Badge>
                    </div>
                    {version.description && (
                      <p className="mt-1 text-muted-foreground text-sm">
                        {version.description}
                      </p>
                    )}
                    <p className="mt-2 text-muted-foreground text-xs">
                      {new Date(version.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
