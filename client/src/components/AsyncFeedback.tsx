import React from "react";
import { Loader2 } from "lucide-react";

type AsyncFeedbackProps = {
  isPending: boolean;
  pendingLabel: string;
  errorMessage?: string;
};

/** 顯示非同步後台操作的進度與失敗訊息，供 CMS 頁面共用。 */
export function AsyncFeedback({ isPending, pendingLabel, errorMessage }: AsyncFeedbackProps) {
  if (!isPending && !errorMessage) return null;

  return (
    <div className="mb-5 space-y-3">
      {isPending && (
        <p role="status" aria-live="polite" className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          {pendingLabel}
        </p>
      )}
      {errorMessage && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>}
    </div>
  );
}
