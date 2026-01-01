"use client";
import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/core/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Markdown 渲染组件
 * 支持 GFM（GitHub Flavored Markdown）语法
 */
export function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  return (
    <>
      <div className={cn("markdown-body min-w-0 max-w-full", className)}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // 自定义图片组件：支持点击预览
            img: ({ node, ...props }) => (
              // biome-ignore lint/performance/noImgElement: Markdown images may be remote/untrusted; Next/Image requires explicit allowlist.
              <img
                {...props}
                style={{ maxWidth: "500px", height: "auto" }}
                className="cursor-pointer rounded-md border transition-opacity hover:opacity-80"
                onClick={() =>
                  setImagePreview(
                    typeof props.src === "string" ? props.src : null,
                  )
                }
                alt={props.alt || ""}
              />
            ),
            // 自定义代码块：添加背景色
            code: ({ node, className, children, ...props }) => {
              const isInline = !className;
              if (isInline) {
                return (
                  <code
                    className="rounded bg-muted px-1 py-0.5 font-mono text-sm"
                    {...props}
                  >
                    {children}
                  </code>
                );
              }
              return (
                <code
                  className={cn(
                    "block overflow-x-auto rounded-md bg-muted p-3",
                    className,
                  )}
                  {...props}
                >
                  {children}
                </code>
              );
            },
            // 自定义链接：新窗口打开
            a: ({ node, ...props }) => (
              <a
                {...props}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400"
              />
            ),
            // 自定义表格：紧凑边框样式
            table: ({ node, ...props }) => (
              <div className="my-4 overflow-x-auto">
                <table
                  className="w-full max-w-full table-fixed border-collapse border border-border"
                  {...props}
                />
              </div>
            ),
            th: ({ node, ...props }) => (
              <th
                className="border border-border bg-muted px-3 py-2 text-left font-semibold"
                {...props}
              />
            ),
            td: ({ node, ...props }) => (
              <td
                className="break-words border border-border px-3 py-2"
                {...props}
              />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {/* 图片预览模态框 */}
      {imagePreview && (
        <button
          type="button"
          aria-label="Close image preview"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setImagePreview(null)}
        >
          {/* biome-ignore lint/performance/noImgElement: Preview needs to render arbitrary remote URLs without Next/Image allowlist. */}
          <img
            src={imagePreview}
            alt="Preview"
            className="max-h-full max-w-full object-contain"
          />
        </button>
      )}
    </>
  );
}
