/**
 * 数据库工具函数
 */

import { type AnyColumn, sql } from "drizzle-orm";
import {
  conversationsTableName,
  databaseSchema,
} from "@/lib/constants";

export function takeFirstOrNull<TData>(data: TData[]) {
  return data[0] ?? null;
}

export function takeFirstOrThrow<TData>(data: TData[], errorMessage?: string) {
  const first = takeFirstOrNull(data);

  if (!first) {
    throw new Error(errorMessage ?? "Item not found");
  }

  return first;
}

export function isEmpty<TColumn extends AnyColumn>(column: TColumn) {
  return sql<boolean>`
    case
      when ${column} is null then true
      when ${column} = '' then true
      when ${column}::text = '[]' then true
      when ${column}::text = '{}' then true
      else false
    end
  `;
}

/**
 * 获取对话表的完整引用（schema.table）
 * Demo 模式使用 public.conversations
 * 生产模式使用 pz9cwpnyi2mbyf3."灵思 实时数据"
 */
export function getConversationsTableRef(): string {
  return `${databaseSchema}."${conversationsTableName}"`;
}
