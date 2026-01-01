"use client";

import { Search } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { Input } from "@/components/ui/input";

export function UsersToolbar() {
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault("").withOptions({
      shallow: false,
      clearOnDefault: true,
    }),
  );

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="-translate-y-1/2 absolute top-1/2 left-2.5 size-4 text-muted-foreground" />
        <Input
          id="search-users"
          placeholder="搜索用户ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-[180px] pl-8 text-sm"
        />
      </div>

      {/* Date Range Filter */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">时间:</span>
        <DateRangePicker />
      </div>
    </div>
  );
}
