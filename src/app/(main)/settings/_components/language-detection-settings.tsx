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

interface Language {
  code: string;
  name: string;
  nameEn: string;
}

interface LanguageDetectionConfig {
  languages: Language[];
  systemPrompt: string;
}

export function LanguageDetectionSettings() {
  const { data, setData, isLoading, isSaving, lastUpdated, save, reset } =
    useSettingsForm<LanguageDetectionConfig>({
      apiEndpoint: "/api/settings/language-detection",
      defaultValue: {
        languages: [],
        systemPrompt: DEFAULT_PROMPTS.languageDetection,
      },
      transformResponse: (res) => {
        const typed = res as { languages?: Language[]; systemPrompt?: string };
        return {
          languages: typed.languages || [],
          systemPrompt: typed.systemPrompt || DEFAULT_PROMPTS.languageDetection,
        };
      },
    });

  const addLanguage = useCallback(() => {
    setData((prev) => ({
      ...prev,
      languages: [...prev.languages, { code: "", name: "", nameEn: "" }],
    }));
  }, [setData]);

  const removeLanguage = useCallback(
    (index: number) => {
      setData((prev) => ({
        ...prev,
        languages: prev.languages.filter((_, i) => i !== index),
      }));
    },
    [setData],
  );

  const updateLanguage = useCallback(
    (index: number, field: keyof Language, value: string) => {
      setData((prev) => ({
        ...prev,
        languages: prev.languages.map((lang, i) =>
          i === index ? { ...lang, [field]: value } : lang,
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
        apiEndpoint="/api/language-detect"
        title="语种识别"
        taskName="language-detection"
      />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">支持的语种</h3>
          <Button size="sm" variant="outline" onClick={addLanguage}>
            <Plus className="mr-1 size-4" />
            添加语种
          </Button>
        </div>
        <div className="max-h-[400px] overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">代码</TableHead>
                <TableHead className="w-32">中文名</TableHead>
                <TableHead>英文名</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.languages.map((lang, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Input
                      value={lang.code}
                      onChange={(e) =>
                        updateLanguage(idx, "code", e.target.value)
                      }
                      placeholder="zh-CN"
                      className="font-mono text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={lang.name}
                      onChange={(e) =>
                        updateLanguage(idx, "name", e.target.value)
                      }
                      placeholder="简体中文"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={lang.nameEn}
                      onChange={(e) =>
                        updateLanguage(idx, "nameEn", e.target.value)
                      }
                      placeholder="Simplified Chinese"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeLanguage(idx)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="language-detection-prompt"
          className="font-medium text-sm"
        >
          System Prompt
        </label>
        <Textarea
          id="language-detection-prompt"
          value={data.systemPrompt}
          onChange={(e) =>
            setData((prev) => ({ ...prev, systemPrompt: e.target.value }))
          }
          placeholder="输入语种识别使用的 System Prompt..."
          className="min-h-[300px] font-mono text-sm"
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
              languages: data.languages,
              systemPrompt: DEFAULT_PROMPTS.languageDetection,
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
