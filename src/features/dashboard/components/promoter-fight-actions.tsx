"use client";

import { useToast } from "@/providers/toast-provider";

type PromoterFightActionsProps = {
  fighterName: string;
  actions: Array<"reinvite" | "replace">;
};

export function PromoterFightActions({
  fighterName,
  actions,
}: PromoterFightActionsProps) {
  const { showToast } = useToast();

  return (
    <div className="flex flex-wrap gap-2">
      {actions.includes("reinvite") ? (
        <button
          type="button"
          onClick={() =>
            showToast({
              title: `Re-invite flow for ${fighterName} is ready to wire next.`,
              variant: "success",
            })
          }
          className="inline-flex h-10 items-center justify-center rounded-[10px] border border-brand-border bg-brand-surface-strong px-4 text-sm font-medium text-brand transition hover:bg-brand-soft"
        >
          Re-invite
        </button>
      ) : null}

      {actions.includes("replace") ? (
        <button
          type="button"
          onClick={() =>
            showToast({
              title: `Replace action for ${fighterName} is ready to wire next.`,
              variant: "error",
            })
          }
          className="inline-flex h-10 items-center justify-center rounded-[10px] border border-danger-border bg-danger-surface px-4 text-sm font-medium text-danger-strong transition hover:bg-danger-surface-strong"
        >
          Remove / Replace
        </button>
      ) : null}
    </div>
  );
}
