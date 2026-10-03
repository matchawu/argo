"use client";

import { useEffect, useState } from "react";
import Dialog, {
  DialogActions,
  dialogButtonClassName,
} from "@/components/ui/Dialog";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  /** danger：確認按鈕用紅色（刪除、停用等） */
  tone?: "default" | "danger";
};

type ConfirmRequest = ConfirmOptions & {
  resolve: (confirmed: boolean) => void;
};

let showConfirm: ((request: ConfirmRequest) => void) | null = null;

/*
 * 取代 window.confirm()
 *
 *   if (!(await confirmDialog({ title: "確定要刪除嗎？", tone: "danger" }))) return;
 *
 * 需要在 root layout 放 <ConfirmDialogHost />。
 */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (!showConfirm) {
      resolve(window.confirm(options.title));
      return;
    }

    showConfirm({ ...options, resolve });
  });
}

export default function ConfirmDialogHost() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  useEffect(() => {
    showConfirm = setRequest;

    return () => {
      showConfirm = null;
    };
  }, []);

  if (!request) {
    return null;
  }

  function close(confirmed: boolean) {
    request?.resolve(confirmed);
    setRequest(null);
  }

  return (
    <Dialog
      onClose={() => close(false)}
      title={request.title}
      description={request.description}
    >
      <DialogActions>
        <button
          type="button"
          onClick={() => close(false)}
          className={dialogButtonClassName.secondary}
        >
          {request.cancelText ?? "取消"}
        </button>

        <button
          type="button"
          onClick={() => close(true)}
          className={
            request.tone === "danger"
              ? dialogButtonClassName.danger
              : dialogButtonClassName.primary
          }
        >
          {request.confirmText ?? "確定"}
        </button>
      </DialogActions>
    </Dialog>
  );
}
