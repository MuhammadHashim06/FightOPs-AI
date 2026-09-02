"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/providers/toast-provider";

export function DeleteFightButton({
  eventSlug,
  fightId,
  fightLabel,
}: {
  eventSlug: string;
  fightId: string;
  fightLabel: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${fightLabel}"? This will remove this fight card from the event.`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/v1/fights/${fightId}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? "Unable to delete fight.");
      }

      showToast({
        title: "Fight deleted successfully.",
        variant: "success",
      });

      startTransition(() => {
        router.push(`/dashboard/promoter/events/${eventSlug}`);
        router.refresh();
      });
    } catch (error) {
      showToast({
        title: error instanceof Error ? error.message : "Unable to delete fight.",
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex h-11 items-center justify-center rounded-[12px] border border-danger-border bg-panel px-4 text-sm font-medium text-danger transition hover:bg-danger-surface-strong disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isDeleting ? "Deleting..." : "Delete Fight Card"}
    </button>
  );
}
