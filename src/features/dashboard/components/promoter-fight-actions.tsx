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
          className="inline-flex h-10 items-center justify-center rounded-[10px] border border-[#b8cbff] bg-[#eef3ff] px-4 text-sm font-medium text-brand transition hover:bg-[#e5eeff]"
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
          className="inline-flex h-10 items-center justify-center rounded-[10px] border border-[#f7c4c0] bg-[#fff1f1] px-4 text-sm font-medium text-[#d92d20] transition hover:bg-[#ffe8e8]"
        >
          Remove / Replace
        </button>
      ) : null}
    </div>
  );
}
