"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { editFightCardRows } from "@/features/dashboard/data/promoter-events";
import { useToast } from "@/providers/toast-provider";

export function EditFightCardPage({ eventSlug }: { eventSlug: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  function handleSave() {
    setIsSaving(true);

    window.setTimeout(() => {
      showToast({
        title: "Fight card order saved successfully.",
        variant: "success",
      });

      startTransition(() => {
        router.push(`/dashboard/promoter/events/${eventSlug}`);
      });

      setIsSaving(false);
    }, 300);
  }

  return (
    <main className="space-y-5">
      <Link
        href={`/dashboard/promoter/events/${eventSlug}`}
        className="inline-flex items-center gap-2 text-[15px] text-text-body transition hover:text-text-strong"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        <span>Back</span>
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-[28px] font-semibold tracking-tight text-text-strong sm:text-[40px]">
            Edit Fight Card
          </h1>
          <p className="text-lg text-text-body">
            Drag to reorder bouts. Order is saved explicitly.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/dashboard/promoter/events/${eventSlug}/add-fight`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[12px] border border-border-subtle bg-white px-4 text-sm font-medium text-text-strong transition hover:bg-panel-muted"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Fight</span>
          </Link>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="inline-flex h-11 items-center justify-center rounded-[12px] bg-brand px-4 text-sm font-medium text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save order"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {editFightCardRows.map((row) => (
          <article
            key={row.order}
            className="grid items-center gap-4 rounded-[16px] border border-border-subtle bg-panel px-4 py-4 shadow-[0_8px_20px_rgba(23,32,51,0.03)] lg:grid-cols-[auto_48px_1.2fr_1.2fr_auto_auto]"
          >
            <DragDots />
            <span className="text-[18px] font-semibold text-[#8ea0ba]">{row.order}</span>
            <div>
              <p className="text-[18px] font-medium text-text-strong">{row.leftName}</p>
              <p className="text-[15px] text-text-muted">{row.leftDivision}</p>
            </div>
            <div>
              <p className="text-[18px] font-medium text-text-strong">{row.rightName}</p>
              <p className="text-[15px] text-text-muted">{row.rightDivision}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {row.tags.map((tag) => (
                <StatusPill key={tag.label} label={tag.label} tone={tag.tone} />
              ))}
            </div>
            <button
              type="button"
              className="justify-self-end rounded-full p-2 text-text-muted transition hover:bg-panel-muted hover:text-text-strong"
              aria-label="Expand fight row"
            >
              <ChevronDownIcon className="h-5 w-5" />
            </button>
          </article>
        ))}
      </div>
    </main>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning" | "processing";
}) {
  const styles =
    tone === "success"
      ? "bg-[#e6f8ec] text-success"
      : tone === "warning"
        ? "bg-[#fff2d8] text-[#d97706]"
        : "bg-[#edf3ff] text-brand";

  return (
    <span className={`inline-flex rounded-[10px] border border-current/15 px-3 py-1 text-sm font-medium ${styles}`}>
      {label}
    </span>
  );
}

function DragDots() {
  return (
    <div className="grid grid-cols-2 gap-1 text-[#c8d4e7]">
      {Array.from({ length: 6 }).map((_, index) => (
        <span key={index} className="h-1 w-1 rounded-full bg-current" />
      ))}
    </div>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
      <path d="M9 12h11" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
