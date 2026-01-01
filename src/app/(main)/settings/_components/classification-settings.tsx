"use client";

import { Plus, Trash2 } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useSettingsForm } from "@/hooks/use-settings-form";
import { DEFAULT_PROMPTS } from "@/lib/constants";
import { ProcessingProgress } from "./processing-progress";

interface Category {
  id: string;
  name: string;
  description: string;
}

interface ClassificationConfig {
  categories: Category[];
  systemPrompt: string;
}

export function ClassificationSettings() {
  const { data, setData, isLoading, isSaving, lastUpdated, save, reset } =
    useSettingsForm<ClassificationConfig>({
      apiEndpoint: "/api/settings/classification",
      defaultValue: {
        categories: [],
        systemPrompt: DEFAULT_PROMPTS.classification,
      },
      transformResponse: (res) => {
        const typed = res as { categories?: Category[]; systemPrompt?: string };
        return {
          categories: typed.categories || [],
          systemPrompt: typed.systemPrompt || DEFAULT_PROMPTS.classification,
        };
      },
    });

  const addCategory = useCallback(() => {
    setData((prev) => ({
      ...prev,
      categories: [...prev.categories, { id: "", name: "", description: "" }],
    }));
  }, [setData]);

  const removeCategory = useCallback(
    (index: number) => {
      setData((prev) => ({
        ...prev,
        categories: prev.categories.filter((_, i) => i !== index),
      }));
    },
    [setData],
  );

  const updateCategory = useCallback(
    (index: number, field: keyof Category, value: string) => {
      setData((prev) => ({
        ...prev,
        categories: prev.categories.map((cat, i) =>
          i === index ? { ...cat, [field]: value } : cat,
        ),
      }));
    },
    [setData],
  );

  if (isLoading) {
    return <p className="py-8 text-center text-muted-foreground">加载中...</p>;
  }

  return (
    <div className="space-y-6">
      <ProcessingProgress
        apiEndpoint="/api/classify"
        title="意图分类"
        taskName="classification"
      />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">意图类别</h3>
          <Button size="sm" variant="outline" onClick={addCategory}>
            <Plus className="mr-1 size-4" />
            添加类别
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">ID</TableHead>
              <TableHead className="w-32">名称</TableHead>
              <TableHead>描述</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.categories.map((cat, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <Input
                    value={cat.id}
                    onChange={(e) => updateCategory(idx, "id", e.target.value)}
                    placeholder="category_id"
                    className="font-mono text-sm"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={cat.name}
                    onChange={(e) =>
                      updateCategory(idx, "name", e.target.value)
                    }
                    placeholder="类别名称"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={cat.description}
                    onChange={(e) =>
                      updateCategory(idx, "description", e.target.value)
                    }
                    placeholder="类别描述（可选）"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeCategory(idx)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-2">
        <label htmlFor="classification-prompt" className="font-medium text-sm">
          System Prompt
        </label>
        <Textarea
          id="classification-prompt"
          value={data.systemPrompt}
          onChange={(e) =>
            setData((prev) => ({ ...prev, systemPrompt: e.target.value }))
          }
          placeholder="输入分类使用的 System Prompt..."
          className="min-h-[200px] font-mono text-sm"
        />
        {lastUpdated && (
          <p className="text-muted-foreground text-xs">
            最后更新：{new Date(lastUpdated).toLocaleString("zh-CN")}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={() => save()} disabled={isSaving}>
          {isSaving ? "保存中..." : "保存配置"}
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            reset({
              categories: data.categories,
              systemPrompt: DEFAULT_PROMPTS.classification,
            })
          }
          disabled={isSaving}
        >
          恢复默认 Prompt
        </Button>
      </div>
    </div>
  );
}
