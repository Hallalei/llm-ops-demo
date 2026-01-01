import { ArrowLeft, Edit, Settings } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { DatasetItemsTable } from "../_components/dataset-items-table";
import { VersionsPanel } from "../_components/versions-panel";
import {
  getDataset,
  getDatasetItems,
  getDatasetVersions,
} from "../lib/queries";

interface DatasetDetailPageProps {
  params: Promise<{ datasetId: string }>;
}

export default async function DatasetDetailPage({
  params,
}: DatasetDetailPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { datasetId } = await params;
  const [dataset, items, versions] = await Promise.all([
    getDataset(datasetId),
    getDatasetItems(datasetId),
    getDatasetVersions(datasetId),
  ]);

  if (!dataset) {
    notFound();
  }

  return (
    <div className="container max-w-6xl py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/datasets">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-semibold text-2xl">{dataset.name}</h1>
            {dataset.description && (
              <p className="mt-1 text-muted-foreground">
                {dataset.description}
              </p>
            )}
            <p className="mt-2 text-muted-foreground text-sm">
              {dataset.itemCount} items | Updated{" "}
              {new Date(dataset.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <VersionsPanel
            versions={versions}
            datasetId={datasetId}
            currentItemCount={dataset.itemCount}
          />
        </div>
      </div>

      {/* Items table */}
      <DatasetItemsTable items={items} datasetId={datasetId} />
    </div>
  );
}
