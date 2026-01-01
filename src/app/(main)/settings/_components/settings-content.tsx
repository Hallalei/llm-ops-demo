"use client";

import { Shell } from "@/components/shared/shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountsSettings } from "./accounts-settings";
import { ClassificationSettings } from "./classification-settings";
import { LanguageDetectionSettings } from "./language-detection-settings";
import { TranslationSettings } from "./translation-settings";

export function SettingsContent() {
  return (
    <Shell variant="markdown">
      <div className="space-y-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">设置</h1>
          <p className="mt-2 text-muted-foreground">配置系统功能和用户权限</p>
        </div>

        <Tabs defaultValue="accounts" className="w-full">
          <TabsList>
            <TabsTrigger value="accounts">账号管理</TabsTrigger>
            <TabsTrigger value="translation">翻译设置</TabsTrigger>
            <TabsTrigger value="classification">分类设置</TabsTrigger>
            <TabsTrigger value="language-detection">语种识别</TabsTrigger>
          </TabsList>
          <TabsContent value="accounts" className="mt-6">
            <AccountsSettings />
          </TabsContent>
          <TabsContent value="translation" className="mt-6">
            <TranslationSettings />
          </TabsContent>
          <TabsContent value="classification" className="mt-6">
            <ClassificationSettings />
          </TabsContent>
          <TabsContent value="language-detection" className="mt-6">
            <LanguageDetectionSettings />
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
}
