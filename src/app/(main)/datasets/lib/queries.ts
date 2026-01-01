"use cache";

import "server-only";

import { desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { datasetItems, datasets, datasetVersions } from "@/db/schema";

/**
 * Get all datasets (shared across all users)
 */
export async function getDatasets() {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag("datasets");

  try {
    const data = await db
      .select()
      .from(datasets)
      .orderBy(desc(datasets.updatedAt));

    return data;
  } catch (error) {
    console.error("getDatasets error:", error);
    return [];
  }
}

/**
 * Get a single dataset by ID (shared across all users)
 */
export async function getDataset(datasetId: string) {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag(`dataset-${datasetId}`);

  try {
    const [dataset] = await db
      .select()
      .from(datasets)
      .where(eq(datasets.id, datasetId))
      .limit(1);

    return dataset ?? null;
  } catch (error) {
    console.error("getDataset error:", error);
    return null;
  }
}

/**
 * Get all items in a dataset
 */
export async function getDatasetItems(datasetId: string) {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag(`dataset-items-${datasetId}`);

  try {
    const items = await db
      .select()
      .from(datasetItems)
      .where(eq(datasetItems.datasetId, datasetId))
      .orderBy(desc(datasetItems.createdAt));

    return items;
  } catch (error) {
    console.error("getDatasetItems error:", error);
    return [];
  }
}

/**
 * Get all versions for a dataset
 */
export async function getDatasetVersions(datasetId: string) {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag(`dataset-versions-${datasetId}`);

  try {
    const versions = await db
      .select({
        id: datasetVersions.id,
        version: datasetVersions.version,
        name: datasetVersions.name,
        description: datasetVersions.description,
        itemCount: datasetVersions.itemCount,
        createdAt: datasetVersions.createdAt,
      })
      .from(datasetVersions)
      .where(eq(datasetVersions.datasetId, datasetId))
      .orderBy(desc(datasetVersions.version));

    return versions;
  } catch (error) {
    console.error("getDatasetVersions error:", error);
    return [];
  }
}
