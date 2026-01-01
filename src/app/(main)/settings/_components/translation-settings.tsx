"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSettingsForm } from "@/hooks/use-settings-form";
import { DEFAULT_PROMPTS } from "@/lib/constants";
import { ProcessingProgress } from "./processing-progress";

interface TranslationConfig {
  systemPrompt: string;
}

export function TranslationSettings() {
  const { data, setData, isLoading, isSaving, lastUpdated, save, reset } =
    useSettingsForm<TranslationConfig>({
      apiEndpoint: "/api/settings/translation",
      defaultValue: { systemPrompt: DEFAULT_PROMPTS.translation },
      transformResponse: (res) => ({
        systemPrompt:
          (res as { systemPrompt?: string }).systemPrompt ||
          DEFAULT_PROMPTS.translation,
      }),
    });

  const handleSave = async () => {
    if (!data.systemPrompt.trim()) {
      return;
    }
    await save();
  };

  if (isLoading) {
    return <p className="py-8 text-center text-muted-foreground">加载中...</p>;
  }

  return (
    <div className="space-y-4">
      <ProcessingProgress
        apiEndpoint="/api/translate"
        title="翻译"
        taskName="translation"
      />

      <div className="space-y-2">
        <label htmlFor="translation-prompt" className="font-medium text-sm">
          System Prompt
        </label>
        <Textarea
          id="translation-prompt"
          value={data.systemPrompt}
          onChange={(e) => setData({ systemPrompt: e.target.value })}
          placeholder="输入翻译使用的 System Prompt..."
          className="min-h-[300px] font-mono text-sm"
        />
        {lastUpdated && (
          <p className="text-muted-foreground text-xs">
            最后更新：{new Date(lastUpdated).toLocaleString("zh-CN")}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "保存中..." : "保存配置"}
        </Button>
        <Button
          variant="outline"
          onClick={() => reset({ systemPrompt: DEFAULT_PROMPTS.translation })}
          disabled={isSaving}
        >
          恢复默认
        </Button>
      </div>

      <div className="rounded-lg border p-4">
        <h3 className="mb-2 font-semibold">使用说明</h3>
        <ul className="space-y-1 text-muted-foreground text-sm">
          <li>System Prompt 用于指导 AI 如何进行翻译</li>
          <li>修改后点击"保存配置"才会生效</li>
          <li>新的配置会应用到后续的翻译任务中</li>
          <li>建议在 Prompt 中明确返回格式为 JSON</li>
        </ul>
      </div>
    </div>
  );
}
