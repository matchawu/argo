"use client";

import { Toaster as SonnerToaster } from "sonner";

/*
 * 全站 Toast（取代 alert）
 *
 * 用法：import { toast } from "sonner";
 *       toast.success("已完成簽到");
 *       toast.error("儲存失敗");
 *
 * 放在畫面上方：手機底部之後會有分頁列，避免互相遮住。
 */
export default function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      offset={16}
      mobileOffset={12}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-foreground shadow-lg",
          title: "font-medium",
          description: "text-muted",
          icon: "shrink-0",
          success: "[&_[data-icon]]:text-success",
          error: "border-danger/30 [&_[data-icon]]:text-danger",
          warning: "[&_[data-icon]]:text-warning",
        },
      }}
    />
  );
}
