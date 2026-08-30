"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { useToast } from "@/providers/toast-provider";

export function LogoutButton() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    if (isPending) {
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch("/api/v1/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Unable to log out right now.");
      }

      startTransition(() => {
        router.push("/auth/sign-in");
        router.refresh();
      });
    } catch (error) {
      showToast({
        title:
          error instanceof Error ? error.message : "Unable to log out right now.",
        variant: "error",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="rounded-full p-2 text-text-muted transition hover:bg-panel-muted hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
      aria-label="Log out"
      title="Log out"
    >
      <LogoutIcon className="h-4 w-4" />
    </button>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 7V5.8A1.8 1.8 0 0 0 12.2 4H6.8A1.8 1.8 0 0 0 5 5.8v12.4A1.8 1.8 0 0 0 6.8 20h5.4A1.8 1.8 0 0 0 14 18.2V17" />
      <path d="M10 12h9" />
      <path d="m16 8 4 4-4 4" />
    </svg>
  );
}
