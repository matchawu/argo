"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

type Props = {
  /** 預設為 true：多數彈窗是「有資料才 render」，關閉時由 onClose 卸載 */
  open?: boolean;
  onClose: () => void;
  title: React.ReactNode;
  /** 標題上方的小字，例如日期 / 時間 */
  eyebrow?: React.ReactNode;
  /** 標題下方的說明 */
  description?: React.ReactNode;
  size?: "md" | "lg";
  children: React.ReactNode;
};

/*
 * 共用彈窗（Radix Dialog）
 *
 * - 手機：從底部滑上來的面板（bottom sheet），大拇指好按
 * - 桌面：置中
 * - Esc / 點背景關閉、焦點鎖定、螢幕閱讀器標題都由 Radix 處理
 */
export default function Dialog({
  open = true,
  onClose,
  title,
  eyebrow,
  description,
  size = "md",
  children,
}: Props) {
  return (
    <RadixDialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="argo-overlay fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />

        <RadixDialog.Content
          className={`argo-dialog fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-3xl border-t border-line bg-surface px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 text-foreground shadow-2xl outline-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:border sm:pb-6 sm:pt-6 ${
            size === "lg" ? "sm:max-w-lg" : "sm:max-w-md"
          }`}
        >
          {/* 手機面板的把手 */}
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-fill-strong sm:hidden" />

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {eyebrow && (
                <p className="font-display text-sm font-semibold text-muted">
                  {eyebrow}
                </p>
              )}

              <RadixDialog.Title className="mt-0.5 text-xl font-semibold">
                {title}
              </RadixDialog.Title>

              {description ? (
                <RadixDialog.Description className="mt-1.5 text-sm text-muted">
                  {description}
                </RadixDialog.Description>
              ) : (
                <RadixDialog.Description className="sr-only">
                  {typeof title === "string" ? title : "對話框"}
                </RadixDialog.Description>
              )}
            </div>

            <RadixDialog.Close
              aria-label="關閉"
              className="-mr-2 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-fill hover:text-foreground"
            >
              <X aria-hidden className="h-5 w-5" />
            </RadixDialog.Close>
          </div>

          <div className="mt-5">{children}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/*
 * 彈窗底部的按鈕列
 */
export function DialogActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      {children}
    </div>
  );
}

export const dialogButtonClassName = {
  secondary:
    "h-11 rounded-full px-5 text-sm text-muted transition hover:bg-fill hover:text-foreground disabled:opacity-50",
  primary:
    "h-11 rounded-full bg-primary px-5 text-sm font-medium text-on-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50",
  danger:
    "h-11 rounded-full bg-danger px-5 text-sm font-medium text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
};

export const textareaClassName =
  "w-full resize-y rounded-2xl border border-line-strong bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none placeholder:text-subtle focus:border-foreground/40";

export const inputClassName =
  "block h-12 w-full rounded-2xl border border-line-strong bg-background px-4 text-foreground outline-none focus:border-foreground/40";
