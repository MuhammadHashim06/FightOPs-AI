"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { DeleteFightButton } from "@/features/dashboard/components/delete-fight-button";
import type { PromoterFightDetailData } from "@/server/services/events.service";
import { useToast } from "@/providers/toast-provider";

type FightSide = "fighterA" | "fighterB";

type FighterFormState = {
  fullName: string;
  division: string;
  managerName: string;
  managerEmail: string;
  managerPhone: string;
  contractReference: string;
};

type RemoveModalState = {
  side: FightSide;
  fighterName: string;
} | null;

const weightClassOptions = [
  "Strawweight",
  "Flyweight",
  "Bantamweight",
  "Featherweight",
  "Lightweight",
  "Welterweight",
  "Middleweight",
  "Light Heavyweight",
  "Heavyweight",
  "Catchweight",
];

export function EditFightPage({
  fight,
}: {
  fight: PromoterFightDetailData;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [editingSide, setEditingSide] = useState<FightSide | null>(null);
  const [division, setDivision] = useState(() =>
    weightClassOptions.includes(fight.bout.division)
      ? fight.bout.division
      : "Lightweight",
  );
  const [fighterA, setFighterA] = useState(() => mapInitialFighterState(fight, 0));
  const [fighterB, setFighterB] = useState(() => mapInitialFighterState(fight, 1));
  const [isSavingDivision, setIsSavingDivision] = useState(false);
  const [savingSide, setSavingSide] = useState<FightSide | null>(null);
  const [reinvitingSide, setReinvitingSide] = useState<FightSide | null>(null);
  const [removeModal, setRemoveModal] = useState<RemoveModalState>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleDivisionSave() {
    setIsSavingDivision(true);

    try {
      const response = await fetch(`/api/v1/fights/${fight.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          division,
          fighterA: buildPayload(fighterA, division),
          fighterB: buildPayload(fighterB, division),
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? "Unable to save fight division.");
      }

      showToast({
        title: "Fight division updated.",
        variant: "success",
      });

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      showToast({
        title:
          error instanceof Error ? error.message : "Unable to save fight division.",
        variant: "error",
      });
    } finally {
      setIsSavingDivision(false);
    }
  }

  async function handleSideSave(side: FightSide) {
    const fighter = side === "fighterA" ? fighterA : fighterB;
    setSavingSide(side);

    try {
      const response = await fetch(`/api/v1/fights/${fight.id}/fighters/${side}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: fighter.fullName,
          division: fighter.division || division,
          managerName: fighter.managerName,
          managerEmail: fighter.managerEmail,
          managerPhone: fighter.managerPhone,
          contractReference: fighter.contractReference,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? "Unable to save fighter.");
      }

      showToast({
        title: `${side === "fighterA" ? "Fighter A" : "Fighter B"} saved successfully.`,
        variant: "success",
      });

      setEditingSide(null);

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      showToast({
        title: error instanceof Error ? error.message : "Unable to save fighter.",
        variant: "error",
      });
    } finally {
      setSavingSide(null);
    }
  }

  async function handleReinvite(side: FightSide) {
    setReinvitingSide(side);

    try {
      const response = await fetch(
        `/api/v1/fights/${fight.id}/fighters/${side}/reinvite`,
        {
          method: "POST",
        },
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? "Unable to re-invite fighter.");
      }

      showToast({
        title: "Invite sent successfully.",
        variant: "success",
      });

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      showToast({
        title:
          error instanceof Error ? error.message : "Unable to re-invite fighter.",
        variant: "error",
      });
    } finally {
      setReinvitingSide(null);
    }
  }

  async function confirmRemove() {
    if (!removeModal) {
      return;
    }

    setIsRemoving(true);

    try {
      const response = await fetch(
        `/api/v1/fights/${fight.id}/fighters/${removeModal.side}`,
        {
          method: "DELETE",
        },
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? "Unable to remove fighter.");
      }

      showToast({
        title: `${removeModal.fighterName} removed from this fight.`,
        variant: "success",
      });

      setRemoveModal(null);
      setEditingSide(null);

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      showToast({
        title: error instanceof Error ? error.message : "Unable to remove fighter.",
        variant: "error",
      });
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <main className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/dashboard/promoter/events/${fight.eventSlug}/fights/${fight.id}`}
          className="inline-flex items-center gap-2 text-[15px] text-text-body transition hover:text-text-strong"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Back</span>
        </Link>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/dashboard/promoter/events/${fight.eventSlug}/edit-fight-card`}
            className="inline-flex h-11 items-center justify-center rounded-[12px] border border-border-subtle bg-panel px-4 text-sm font-medium text-text-strong transition hover:bg-panel-muted"
          >
            Reorder card
          </Link>
          <DeleteFightButton
            eventSlug={fight.eventSlug}
            fightId={fight.id}
            fightLabel={`${fight.bout.label} ${fight.bout.division}`}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-[28px] font-semibold tracking-tight text-text-strong sm:text-[40px]">
            Edit Fight
          </h1>
          <p className="text-lg text-text-body">
            Manage Fighter A and Fighter B from one place.
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-[16px] border border-border-subtle bg-panel px-4 py-3 sm:min-w-[280px]">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
              Weight class <span className="text-danger">*</span>
            </span>
            <select
              value={division}
              onChange={(event) => setDivision(event.target.value)}
              className={`${inputClassName} appearance-none`}
            >
              {weightClassOptions.map((weightClass) => (
                <option key={weightClass} value={weightClass}>
                  {weightClass}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleDivisionSave}
            disabled={isSavingDivision}
            className="inline-flex h-10 items-center justify-center rounded-[12px] bg-brand px-4 text-sm font-medium text-text-inverse transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingDivision ? "Saving..." : "Save division"}
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <FighterEditorCard
          side="fighterA"
          sideLabel="Fighter A"
          fighter={fight.fighterOverviews[0]}
          value={fighterA}
          isEditing={editingSide === "fighterA" || !fight.fighterOverviews[0]?.fighterId}
          isSaving={savingSide === "fighterA"}
          isReinviting={reinvitingSide === "fighterA"}
          onEditToggle={() =>
            setEditingSide((current) => (current === "fighterA" ? null : "fighterA"))
          }
          onChange={(field, value) =>
            setFighterA((current) => ({ ...current, [field]: value }))
          }
          onSave={() => handleSideSave("fighterA")}
          onReinvite={() => handleReinvite("fighterA")}
          onRemove={() =>
            setRemoveModal({
              side: "fighterA",
              fighterName: fighterA.fullName || "Fighter A",
            })
          }
        />
        <FighterEditorCard
          side="fighterB"
          sideLabel="Fighter B"
          fighter={fight.fighterOverviews[1]}
          value={fighterB}
          isEditing={editingSide === "fighterB" || !fight.fighterOverviews[1]?.fighterId}
          isSaving={savingSide === "fighterB"}
          isReinviting={reinvitingSide === "fighterB"}
          onEditToggle={() =>
            setEditingSide((current) => (current === "fighterB" ? null : "fighterB"))
          }
          onChange={(field, value) =>
            setFighterB((current) => ({ ...current, [field]: value }))
          }
          onSave={() => handleSideSave("fighterB")}
          onReinvite={() => handleReinvite("fighterB")}
          onRemove={() =>
            setRemoveModal({
              side: "fighterB",
              fighterName: fighterB.fullName || "Fighter B",
            })
          }
        />
      </div>

      {removeModal ? (
        <ConfirmRemoveModal
          fighterName={removeModal.fighterName}
          isRemoving={isRemoving}
          onCancel={() => setRemoveModal(null)}
          onConfirm={confirmRemove}
        />
      ) : null}
    </main>
  );
}

function FighterEditorCard({
  side,
  sideLabel,
  fighter,
  value,
  isEditing,
  isSaving,
  isReinviting,
  onEditToggle,
  onChange,
  onSave,
  onReinvite,
  onRemove,
}: {
  side: FightSide;
  sideLabel: string;
  fighter: PromoterFightDetailData["fighterOverviews"][number] | undefined;
  value: FighterFormState;
  isEditing: boolean;
  isSaving: boolean;
  isReinviting: boolean;
  onEditToggle: () => void;
  onChange: (field: keyof FighterFormState, value: string) => void;
  onSave: () => void;
  onReinvite: () => void;
  onRemove: () => void;
}) {
  const isEmptySlot = !fighter?.fighterId;
  const status = getFighterStatusLabel(fighter);
  const canSave = canSaveFighter(value, isEmptySlot);
  const emailReadOnly = !isEmptySlot;

  return (
    <section
      className={`rounded-[20px] border bg-panel p-5 shadow-[var(--shadow-card)] transition ${
        isEditing
          ? "border-brand bg-[var(--edit-active-gradient)] shadow-[var(--shadow-focus-card)]"
          : "border-border-subtle"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
            {sideLabel}
          </p>
          <h2 className="text-[24px] font-semibold text-text-strong">
            {isEmptySlot ? "Unassigned slot" : value.fullName || "Unnamed fighter"}
          </h2>
          <StatusPill
            label={status}
            tone={status === "Confirmed" ? "success" : "warning"}
          />
        </div>

        <button
          type="button"
          onClick={onEditToggle}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-[12px] border transition ${
            isEditing
              ? "border-brand bg-brand-surface-strong text-brand"
              : "border-border-subtle bg-panel text-text-strong hover:bg-panel-muted"
          }`}
          aria-label={`Edit ${sideLabel}`}
        >
          <EditIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <InfoCell
          label="Invite accepted at"
          value={fighter?.inviteAcceptedAtLabel ?? "Not accepted yet"}
        />
        <InfoCell
          label="Contract due"
          value={
            fighter?.isContractOverdue
              ? `${fighter.contractDueDateLabel} (Overdue)`
              : fighter?.contractDueDateLabel ?? "No due date"
          }
        />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field
          label="Fighter name"
          value={value.fullName}
          onChange={(nextValue) => onChange("fullName", nextValue)}
          disabled={!isEditing}
          placeholder="Full name"
          required
        />
        <Field
          label="Contact name"
          value={value.managerName}
          onChange={(nextValue) => onChange("managerName", nextValue)}
          disabled={!isEditing}
          placeholder="Manager name"
          required
        />
        <Field
          label="Contact email"
          value={value.managerEmail}
          onChange={(nextValue) => onChange("managerEmail", nextValue)}
          disabled={!isEditing || emailReadOnly}
          placeholder="contact@example.com"
          type="email"
          required
          helperText={
            emailReadOnly
              ? "Email cannot be edited. Remove this fighter and add a new one to change it."
              : "This email will receive the invite."
          }
        />
        <Field
          label="Phone"
          value={value.managerPhone}
          onChange={(nextValue) => onChange("managerPhone", nextValue)}
          disabled={!isEditing}
          placeholder="+1 ..."
        />
        <Field
          label="Contract reference"
          value={value.contractReference}
          onChange={(nextValue) => onChange("contractReference", nextValue)}
          disabled={!isEditing}
          placeholder="Contract file or reference"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-border-subtle bg-panel-muted px-4 py-4">
        <div className="flex flex-wrap gap-2">
          {!isEmptySlot ? (
            <button
              type="button"
              onClick={onReinvite}
              disabled={isReinviting}
              className="inline-flex h-10 items-center justify-center rounded-[10px] border border-brand-border bg-brand-surface-strong px-4 text-sm font-medium text-brand transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isReinviting ? "Sending..." : "Re-invite"}
            </button>
          ) : null}

          {!isEmptySlot ? (
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex h-10 items-center justify-center rounded-[10px] border border-danger-border bg-danger-surface px-4 text-sm font-medium text-danger-strong transition hover:bg-danger-surface-strong"
            >
              Remove fighter
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={!isEditing || !canSave || isSaving}
          className="inline-flex h-10 items-center justify-center rounded-[10px] bg-brand px-4 text-sm font-medium text-text-inverse transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving
            ? "Saving..."
            : isEmptySlot
              ? `Add ${side === "fighterA" ? "Fighter A" : "Fighter B"}`
              : "Save fighter"}
        </button>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  helperText,
  required = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  placeholder: string;
  helperText?: string;
  required?: boolean;
  type?: "text" | "email";
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[15px] font-semibold text-text-strong">
        {label}
        {required ? <span className="ml-1 text-danger">*</span> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={`${inputClassName} ${
          disabled ? "bg-panel-muted text-text-body" : ""
        }`}
      />
      {helperText ? (
        <span className="text-xs leading-5 text-text-muted">{helperText}</span>
      ) : null}
    </label>
  );
}

function InfoCell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[14px] border border-border-subtle bg-panel px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
        {label}
      </p>
      <p className="mt-2 text-[15px] font-medium text-text-strong">{value}</p>
    </div>
  );
}

function ConfirmRemoveModal({
  fighterName,
  isRemoving,
  onCancel,
  onConfirm,
}: {
  fighterName: string;
  isRemoving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--modal-overlay)] px-4">
      <div className="w-full max-w-[480px] rounded-[24px] border border-border-subtle bg-panel p-6 shadow-[var(--shadow-confirm)]">
        <h2 className="text-[24px] font-semibold text-text-strong">Remove fighter?</h2>
        <p className="mt-3 text-[15px] leading-7 text-text-body">
          {fighterName} will be removed from this fight. Invite status, signed
          agreement progress, and queued reminders for this slot will be cleared.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isRemoving}
            className="inline-flex h-11 items-center justify-center rounded-[12px] border border-border-subtle bg-panel px-5 text-sm font-medium text-text-strong transition hover:bg-panel-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isRemoving}
            className="inline-flex h-11 items-center justify-center rounded-[12px] bg-danger px-5 text-sm font-medium text-text-inverse transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRemoving ? "Removing..." : "Yes, remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

function mapInitialFighterState(
  fight: PromoterFightDetailData,
  index: number,
): FighterFormState {
  const overview = fight.fighterOverviews[index];
  const boutFighter = index === 0 ? fight.bout.leftFighter : fight.bout.rightFighter;
  const isExistingFighter = Boolean(overview?.fighterId);

  return {
    fullName: isExistingFighter ? overview.fighterName : "",
    division: isExistingFighter ? sanitizeValue(overview.division, boutFighter.division) : "",
    managerName: isExistingFighter ? sanitizeValue(overview.contactName) : "",
    managerEmail: isExistingFighter ? sanitizeValue(overview.contactEmail) : "",
    managerPhone: isExistingFighter ? sanitizeValue(overview.contactPhone) : "",
    contractReference: isExistingFighter ? sanitizeValue(overview.contractReference) : "",
  };
}

function sanitizeValue(value: string, fallback = "") {
  if (["Not assigned", "Not provided", "TBD Fighter", "TBD"].includes(value)) {
    return fallback;
  }

  return value;
}

function buildPayload(input: FighterFormState, parentDivision?: string) {
  const hasValue = Object.values(input).some((value) => value.trim().length > 0);

  if (!hasValue) {
    return null;
  }

  return {
    fullName: input.fullName,
    division: parentDivision ?? input.division,
    managerName: input.managerName,
    managerEmail: input.managerEmail,
    managerPhone: input.managerPhone,
    contractReference: input.contractReference,
  };
}

function getFighterStatusLabel(
  fighter: PromoterFightDetailData["fighterOverviews"][number] | undefined,
) {
  if (!fighter?.fighterId) {
    return "Awaiting fighter";
  }

  if (fighter.inviteStatusLabel !== "Accepted") {
    return "Pending invite";
  }

  if (fighter.contractStatusLabel === "Approved") {
    return "Confirmed";
  }

  if (fighter.contractStatusLabel === "Awaiting signature") {
    return "Awaiting contract";
  }

  return "Pending approval";
}

function canSaveFighter(input: FighterFormState, isEmptySlot: boolean) {
  if (!input.fullName.trim()) {
    return false;
  }

  if (!input.managerName.trim()) {
    return false;
  }

  if (!input.managerEmail.trim()) {
    return false;
  }

  if (!isEmptySlot) {
    return true;
  }

  return true;
}

const inputClassName =
  "h-11 w-full rounded-[12px] border border-border-subtle bg-panel px-4 text-[15px] text-text-strong outline-none transition placeholder:text-text-muted focus:border-brand disabled:cursor-not-allowed";

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning";
}) {
  const className =
    tone === "success"
      ? "border-success-border bg-success-surface text-success"
      : "border-warning-border bg-warning-surface text-warning";

  return (
    <span className={`inline-flex rounded-[10px] border px-3 py-1 text-sm font-medium ${className}`}>
      {label}
    </span>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
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
      <path d="m15 18-6-6 6-6" />
      <path d="M9 12h11" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" />
    </svg>
  );
}
