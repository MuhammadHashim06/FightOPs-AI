"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/providers/toast-provider";

export function DeleteEventButton({
  eventId,
  eventName,
  variant = "outline",
}: {
  eventId: string;
  eventName: string;
  variant?: "outline" | "text";
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${eventName}"? This will remove the event record.`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/v1/events/${eventId}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? "Unable to delete event.");
      }

      showToast({
        title: "Event deleted successfully.",
        variant: "success",
      });

      startTransition(() => {
        router.push("/dashboard/promoter/events");
        router.refresh();
      });
    } catch (error) {
      showToast({
        title: error instanceof Error ? error.message : "Unable to delete event.",
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  const className =
    variant === "text"
      ? "text-[15px] font-medium text-danger transition hover:opacity-80"
      : "inline-flex h-11 items-center justify-center rounded-[12px] border border-danger-border bg-panel px-4 text-sm font-medium text-danger transition hover:bg-danger-surface-strong";

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {isDeleting ? "Deleting..." : "Delete Event"}
    </button>
  );
}
