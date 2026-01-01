"use client";

import type { Table } from "@tanstack/react-table";
import { Download, FolderPlus } from "lucide-react";
import * as React from "react";
import {
  DataTableActionBar,
  DataTableActionBarAction,
  DataTableActionBarSelection,
} from "@/components/data-table/data-table-action-bar";
import { BatchAddToDatasetDialog } from "@/components/datasets/batch-add-to-dataset-dialog";
import { Separator } from "@/components/ui/separator";
import { exportTableToCSV } from "@/lib/export";
import type { ConversationWithExtras } from "../_lib/queries";

interface ConversationsTableActionBarProps {
  table: Table<ConversationWithExtras>;
}

export function ConversationsTableActionBar({
  table,
}: ConversationsTableActionBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows;
  const [isPending, startTransition] = React.useTransition();
  const [showBatchAdd, setShowBatchAdd] = React.useState(false);

  const onExport = React.useCallback(() => {
    startTransition(() => {
      exportTableToCSV(table, {
        excludeColumns: ["select", "actions"],
        onlySelected: true,
      });
    });
  }, [table]);

  const selectedConversations = React.useMemo(
    () =>
      rows.map((row) => ({
        id: row.original.id,
        query: row.original.query || "",
      })),
    [rows],
  );

  return (
    <>
      <DataTableActionBar table={table} visible={rows.length > 0}>
        <DataTableActionBarSelection table={table} />
        <Separator
          orientation="vertical"
          className="hidden data-[orientation=vertical]:h-5 sm:block"
        />
        <div className="flex items-center gap-1.5">
          <DataTableActionBarAction
            size="icon"
            tooltip="批量添加到数据集"
            onClick={() => setShowBatchAdd(true)}
          >
            <FolderPlus />
          </DataTableActionBarAction>
          <DataTableActionBarAction
            size="icon"
            tooltip="导出选中数据"
            isPending={isPending}
            onClick={onExport}
          >
            <Download />
          </DataTableActionBarAction>
        </div>
      </DataTableActionBar>
      <BatchAddToDatasetDialog
        open={showBatchAdd}
        onOpenChange={setShowBatchAdd}
        conversations={selectedConversations}
        onSuccess={() => table.toggleAllRowsSelected(false)}
      />
    </>
  );
}
