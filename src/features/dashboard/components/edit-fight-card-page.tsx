"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/providers/toast-provider";

type EditFightCardPageProps = {
  eventId: string;
  eventSlug: string;
  rows: Array<{
    id: string;
    order: string;
    division: string;
    leftFighter: {
      name: string;
    };
    rightFighter: {
      name: string;
    };
  }>;
};

export function EditFightCardPage({
  eventId,
  eventSlug,
  rows,
}: EditFightCardPageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [orderedRows, setOrderedRows] = useState(rows);
  const [draggedRowId, setDraggedRowId] = useState<string | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  function handleDrop(targetRowId: string) {
    if (!draggedRowId || draggedRowId === targetRowId) {
      return;
    }

    setOrderedRows((currentRows) => {
      const nextRows = [...currentRows];
      const sourceIndex = nextRows.findIndex((row) => row.id === draggedRowId);
      const targetIndex = nextRows.findIndex((row) => row.id === targetRowId);

      if (sourceIndex === -1 || targetIndex === -1) {
        return currentRows;
      }

      const [movedRow] = nextRows.splice(sourceIndex, 1);
      nextRows.splice(targetIndex, 0, movedRow);
      return nextRows;
    });
    setDraggedRowId(null);
  }

  async function handleSave() {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/v1/events/${eventId}/fights/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fightIds: orderedRows.map((row) => row.id) }),
      });

      const payload = (await response.json()) as {
        data?: { fights?: unknown };
        error?: { message?: string };
      };

      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Unable to save fight order.");
      }

      showToast({
        title: "Fight card order saved successfully.",
        variant: "success",
      });

      startTransition(() => {
        router.push(`/dashboard/promoter/events/${eventSlug}`);
      });
    } catch (error) {
      showToast({
        title: error instanceof Error ? error.message : "Unable to save fight order.",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
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
            Reorder Fight Card
          </h1>
          <p className="text-lg text-text-body">
            Drag to reorder bouts. Fighter editing happens on each fight separately.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/dashboard/promoter/events/${eventSlug}/add-fight`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[12px] border border-border-subtle bg-panel px-4 text-sm font-medium text-text-strong transition hover:bg-panel-muted"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Fight</span>
          </Link>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="inline-flex h-11 items-center justify-center rounded-[12px] bg-brand px-4 text-sm font-medium text-text-inverse transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save order"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {orderedRows.map((row, index) => (
          <article
            key={row.id}
            draggable={!isSaving}
            onDragStart={() => setDraggedRowId(row.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(row.id)}
            onDragEnd={() => setDraggedRowId(null)}
            className="rounded-[16px] border border-border-subtle bg-panel shadow-[var(--shadow-card)]"
          >
            <div className="grid items-center gap-4 px-4 py-4 lg:grid-cols-[auto_48px_1.2fr_1.2fr_auto_auto]">
              <DragDots />
              <span className="text-[18px] font-semibold text-icon-muted">{String(index + 1).padStart(2, "0")}</span>
              <div><p className="text-[18px] font-medium text-text-strong">{row.leftFighter.name}</p><p className="text-[15px] text-text-muted">{row.division}</p></div>
              <div><p className="text-[18px] font-medium text-text-strong">{row.rightFighter.name}</p><p className="text-[15px] text-text-muted">{row.division}</p></div>
              <div className="flex flex-wrap gap-2"><StatusPill label={row.division} tone="processing" /></div>
              <button type="button" onClick={() => setExpandedRowId(expandedRowId === row.id ? null : row.id)} className="justify-self-end rounded-full p-2 text-text-muted transition hover:bg-panel-muted hover:text-text-strong" aria-expanded={expandedRowId === row.id} aria-label={expandedRowId === row.id ? "Collapse fight row" : "Expand fight row"}>
                <ChevronDownIcon className={`h-5 w-5 transition ${expandedRowId === row.id ? "rotate-180" : ""}`} />
              </button>
            </div>
            {expandedRowId === row.id ? <div className="border-t border-border-subtle bg-panel-muted px-4 py-3 text-sm text-text-body">Edit fighter details from the fight page, or drag this row to change its card position.</div> : null}
          </article>
        ))}

        {orderedRows.length === 0 ? (
          <section className="rounded-[16px] border border-border-subtle bg-panel px-5 py-10 text-center shadow-[var(--shadow-card)]">
            <p className="text-[20px] font-semibold text-text-strong">
              No fights to reorder
            </p>
            <p className="mt-2 text-[15px] text-text-body">
              Add fights to this event before changing the card order.
            </p>
          </section>
        ) : null}
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
      ? "bg-success-surface-strong text-success"
      : tone === "warning"
        ? "bg-warning-surface-muted text-warning"
        : "bg-brand-surface-strong text-brand";

  return (
    <span className={`inline-flex rounded-[10px] border border-current/15 px-3 py-1 text-sm font-medium ${styles}`}>
      {label}
    </span>
  );
}

function DragDots() {
  return (
    <div className="grid grid-cols-2 gap-1 text-drag-handle">
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
