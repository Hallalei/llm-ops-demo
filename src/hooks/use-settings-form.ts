"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface UseSettingsFormOptions<T> {
  apiEndpoint: string;
  defaultValue: T;
  transformResponse?: (data: unknown) => T;
}

interface SettingsFormState<T> {
  data: T;
  isLoading: boolean;
  isSaving: boolean;
  lastUpdated: string;
}

export function useSettingsForm<T>({
  apiEndpoint,
  defaultValue,
  transformResponse,
}: UseSettingsFormOptions<T>) {
  const [state, setState] = useState<SettingsFormState<T>>({
    data: defaultValue,
    isLoading: true,
    isSaving: false,
    lastUpdated: "",
  });

  // 使用 ref 存储 transformResponse，避免它作为依赖导致重复加载
  const transformResponseRef = useRef(transformResponse);
  transformResponseRef.current = transformResponse;

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch(apiEndpoint);
      if (!res.ok) throw new Error("加载失败");
      const responseData = (await res.json()) as { updatedAt?: string } & T;
      const transform = transformResponseRef.current;
      const data = transform ? transform(responseData) : (responseData as T);
      setState((prev) => ({
        ...prev,
        data,
        lastUpdated: responseData.updatedAt || "",
        isLoading: false,
      }));
    } catch {
      toast.error("加载配置失败");
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [apiEndpoint]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const setData = useCallback((updater: T | ((prev: T) => T)) => {
    setState((prev) => ({
      ...prev,
      data:
        typeof updater === "function"
          ? (updater as (prev: T) => T)(prev.data)
          : updater,
    }));
  }, []);

  const save = useCallback(
    async (dataToSave?: T) => {
      setState((prev) => ({ ...prev, isSaving: true }));
      try {
        const res = await fetch(apiEndpoint, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSave ?? state.data),
        });
        if (!res.ok) throw new Error("保存失败");
        const responseData = (await res.json()) as { updatedAt?: string };
        setState((prev) => ({
          ...prev,
          lastUpdated: responseData.updatedAt || "",
          isSaving: false,
        }));
        toast.success("配置已保存");
        return true;
      } catch {
        toast.error("保存配置失败");
        setState((prev) => ({ ...prev, isSaving: false }));
        return false;
      }
    },
    [apiEndpoint, state.data],
  );

  const reset = useCallback(
    (resetValue: T) => {
      setData(resetValue);
      toast.info("已恢复默认配置（请点击保存）");
    },
    [setData],
  );

  return {
    data: state.data,
    setData,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    lastUpdated: state.lastUpdated,
    save,
    reset,
    reload: loadConfig,
  };
}
