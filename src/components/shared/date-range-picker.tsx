"use client";

import { zhCN } from "date-fns/locale";
import { CalendarIcon, Check, X } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import * as React from "react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DATE_RANGE_PRESETS,
  formatDateForUrl,
  formatDateRange,
  getCurrentPreset,
  getDateRangeFromPreset,
} from "@/lib/core/date-range";
import { cn } from "@/lib/core/utils";

interface DateRangePickerProps {
  className?: string;
  /** URL 参数名称 - 开始日期，默认 "from" */
  fromParamKey?: string;
  /** URL 参数名称 - 结束日期，默认 "to" */
  toParamKey?: string;
}

export function DateRangePicker({
  className,
  fromParamKey = "from",
  toParamKey = "to",
}: DateRangePickerProps) {
  const [from, setFrom] = useQueryState(
    fromParamKey,
    parseAsString.withOptions({
      shallow: false,
      clearOnDefault: true,
    }),
  );

  const [to, setTo] = useQueryState(
    toParamKey,
    parseAsString.withOptions({
      shallow: false,
      clearOnDefault: true,
    }),
  );

  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [tempRange, setTempRange] = React.useState<DateRange | undefined>();

  // 获取当前选中的预设值
  const currentPreset = getCurrentPreset(from, to);
  const isCustom = currentPreset === "custom";

  // 打开弹窗时初始化临时选择
  const handleOpenChange = (open: boolean) => {
    if (open) {
      // 打开时，如果已有选中的日期，用它初始化
      if (from && to) {
        setTempRange({ from: new Date(from), to: new Date(to) });
      } else {
        setTempRange(undefined);
      }
    }
    setCalendarOpen(open);
  };

  // 处理快捷选项选择
  const handlePresetSelect = (value: string) => {
    if (!value || value === "custom") return;

    const range = getDateRangeFromPreset(value);

    if (range.from && range.to) {
      void setFrom(formatDateForUrl(range.from));
      void setTo(formatDateForUrl(range.to));
    } else {
      // "全部" 选项 - 清除日期参数
      void setFrom(null);
      void setTo(null);
    }
  };

  // 处理日历日期选择（只��新临时状态，不关闭弹窗）
  const handleCalendarSelect = (range: DateRange | undefined) => {
    setTempRange(range);
  };

  // 确认选择
  const handleConfirm = () => {
    if (tempRange?.from && tempRange.to) {
      void setFrom(formatDateForUrl(tempRange.from));
      void setTo(formatDateForUrl(tempRange.to));
    }
    setCalendarOpen(false);
  };

  // 取消选择
  const handleCancel = () => {
    setTempRange(undefined);
    setCalendarOpen(false);
  };

  // 获取自定义日期显示文本
  const getCustomDisplayText = () => {
    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      return formatDateRange(fromDate, toDate);
    }
    return "自定义";
  };

  // 获取下拉菜单的当前值
  const selectValue = isCustom ? "" : currentPreset;

  // 检查是否可以确认（已选择完整日期范围）
  const canConfirm = !!tempRange?.from && !!tempRange?.to;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select value={selectValue} onValueChange={handlePresetSelect}>
        <SelectTrigger className="h-8 w-[100px]" size="sm">
          <SelectValue placeholder="选择时间" />
        </SelectTrigger>
        <SelectContent>
          {DATE_RANGE_PRESETS.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={calendarOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant={isCustom ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-8 gap-1.5 px-3 text-xs",
              isCustom && "min-w-[120px]",
            )}
          >
            <CalendarIcon className="size-3.5" />
            {isCustom ? getCustomDisplayText() : "自定义"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col">
            <Calendar
              mode="range"
              selected={tempRange}
              onSelect={handleCalendarSelect}
              locale={zhCN}
              numberOfMonths={2}
            />
            {/* 底部操作栏 */}
            <div className="flex items-center justify-between border-t px-3 py-2">
              <div className="text-muted-foreground text-xs">
                {tempRange?.from && tempRange.to
                  ? formatDateRange(tempRange.from, tempRange.to)
                  : tempRange?.from
                    ? "请选择结束日期"
                    : "请选择开始日期"}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={handleCancel}
                >
                  <X className="mr-1 size-3.5" />
                  取消
                </Button>
                <Button
                  size="sm"
                  className="h-7 px-2"
                  disabled={!canConfirm}
                  onClick={handleConfirm}
                >
                  <Check className="mr-1 size-3.5" />
                  确定
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
