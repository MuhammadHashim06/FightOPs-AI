"use client";

import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/providers/toast-provider";
import type { FightCardOptionRecord } from "@/types/event";

export function AddFightPage({
  eventSlug,
  eventId,
  cardGroupOptions,
  weightClassOptions,
}: {
  eventSlug: string;
  eventId?: string;
  cardGroupOptions: FightCardOptionRecord[];
  weightClassOptions: FightCardOptionRecord[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [contractReferences, setContractReferences] = useState({
    fighterA: "",
    fighterB: "",
  });
  const [selectedWeightClass, setSelectedWeightClass] = useState("");
  const [catchweightKg, setCatchweightKg] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);

    if (!eventId) {
      window.setTimeout(() => {
        showToast({
          title: "Fight added successfully.",
          variant: "success",
        });

        startTransition(() => {
          router.push(`/dashboard/promoter/events/${eventSlug}`);
        });

        setIsSaving(false);
      }, 300);

      return;
    }

    try {
      const division = String(formData.get("division") ?? "");
      const response = await fetch(`/api/v1/events/${eventId}/fights`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cardGroup: String(formData.get("cardGroup") ?? "main_card"),
          division,
          catchweightKg: catchweightKg ? Number(catchweightKg) : null,
          fighterA: buildFighterPayload(formData, "fighterA", division),
          fighterB: buildFighterPayload(formData, "fighterB", division),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? "Unable to create fight.");
      }

      showToast({
        title: "Fight added successfully.",
        variant: "success",
      });

      startTransition(() => {
        router.push(`/dashboard/promoter/events/${eventSlug}`);
        router.refresh();
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create fight.";
      showToast({
        title: message,
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

      <div className="space-y-1">
        <h1 className="text-[28px] font-semibold tracking-tight text-text-strong sm:text-[40px]">
          Add Fight
        </h1>
        <p className="text-lg text-text-body">
          Choose the bout weight class and add one or both fighters.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-2">
        <div className="grid gap-5 sm:grid-cols-2 xl:col-span-2">
          <FormField label="Card group" required>
            <select
              name="cardGroup"
              className={`${inputClassName} appearance-none`}
              defaultValue={cardGroupOptions[0]?.key ?? "main_card"}
              required
            >
              {cardGroupOptions.map((group) => (
                <option key={group.key} value={group.key}>
                  {group.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Weight class" required>
            <select
              name="division"
              className={`${inputClassName} appearance-none`}
              value={selectedWeightClass}
              onChange={(event) => setSelectedWeightClass(event.target.value)}
              required
            >
              <option value="" disabled>
                Select weight class
              </option>
              {weightClassOptions.map((weightClass) => (
                <option key={weightClass.key} value={weightClass.key}>
                  {formatWeightClassOption(weightClass)}
                </option>
              ))}
            </select>
          </FormField>
          {weightClassOptions.find((option) => option.key === selectedWeightClass)
            ?.allowsCustomWeight ? (
            <FormField label="Catchweight (kg)" required>
              <input
                name="catchweightKg"
                type="number"
                min="0.1"
                step="0.1"
                value={catchweightKg}
                onChange={(event) => setCatchweightKg(event.target.value)}
                placeholder="e.g. 72.0"
                className={inputClassName}
                required
              />
            </FormField>
          ) : null}
        </div>

        <FighterFormCard
          title="Fighter A"
          prefix="fighterA"
          contractReference={contractReferences.fighterA}
          onContractChange={(value) =>
            setContractReferences((current) => ({
              ...current,
              fighterA: value,
            }))
          }
        />
        <FighterFormCard
          title="Fighter B"
          prefix="fighterB"
          contractReference={contractReferences.fighterB}
          onContractChange={(value) =>
            setContractReferences((current) => ({
              ...current,
              fighterB: value,
            }))
          }
        />

        <div className="flex justify-end gap-3 xl:col-span-2">
          <Link
            href={`/dashboard/promoter/events/${eventSlug}`}
            className="inline-flex h-10 items-center justify-center rounded-[10px] border border-border-subtle bg-panel px-5 text-[15px] font-medium text-text-strong transition hover:bg-panel-muted"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-10 items-center justify-center rounded-[10px] bg-brand px-5 text-[15px] font-medium text-text-inverse transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save fight"}
          </button>
        </div>
      </form>
    </main>
  );
}

function FighterFormCard({
  title,
  prefix,
  contractReference,
  onContractChange,
}: {
  title: string;
  prefix: "fighterA" | "fighterB";
  contractReference: string;
  onContractChange: (value: string) => void;
}) {
  return (
    <section className="rounded-[20px] border border-border-subtle bg-panel p-5 shadow-[var(--shadow-card)]">
      <div className="mb-5 flex flex-col items-center gap-3">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-border-strong bg-panel-muted text-text-muted">
          <UploadIcon className="h-5 w-5" />
        </div>
        <h2 className="text-[18px] font-semibold text-text-strong">{title}</h2>
        <p className="text-center text-sm text-text-body">
          Leave this section blank if you want to assign this slot later.
        </p>
      </div>

      <div className="space-y-4">
        <FormField label="Fighter name">
          <input
            name={`${prefix}.fullName`}
            type="text"
            placeholder="Full name"
            className={inputClassName}
          />
        </FormField>
        <FormField label="Manager / contact name">
          <input
            name={`${prefix}.managerName`}
            type="text"
            placeholder="Manager name"
            className={inputClassName}
          />
        </FormField>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Contact email">
            <input
              name={`${prefix}.managerEmail`}
              type="email"
              placeholder="contact@example.com"
              className={inputClassName}
            />
          </FormField>
          <FormField label="Phone (optional)">
            <input
              name={`${prefix}.managerPhone`}
              type="text"
              placeholder="+1 ..."
              className={inputClassName}
            />
          </FormField>
        </div>
        <FormField label="Notes (optional)">
          <textarea name={`${prefix}.notes`} rows={4} className={textareaClassName} />
        </FormField>
        <FormField label="Contract (optional)">
          <div className="space-y-3">
            <label className="flex h-12 cursor-pointer items-center justify-center rounded-[12px] border border-dashed border-border-strong bg-panel-muted px-4 text-sm font-medium text-text-body transition hover:border-brand hover:text-text-strong">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="sr-only"
                onChange={(event) =>
                  onContractChange(event.target.files?.[0]?.name ?? "")
                }
              />
              {contractReference ? "Replace contract file" : "Choose contract file"}
            </label>
            <input
              name={`${prefix}.contractReference`}
              type="text"
              value={contractReference}
              onChange={(event) => onContractChange(event.target.value)}
              placeholder="Contract file or reference"
              className={inputClassName}
            />
          </div>
        </FormField>
      </div>
    </section>
  );
}

const inputClassName =
  "h-11 w-full rounded-[12px] border border-border-subtle bg-panel px-4 text-[15px] text-text-strong outline-none transition placeholder:text-text-muted focus:border-brand";

const textareaClassName =
  "w-full rounded-[12px] border border-border-subtle bg-panel px-4 py-3 text-[15px] text-text-strong outline-none transition placeholder:text-text-muted focus:border-brand";

function FormField({
  label,
  children,
  required = false,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[15px] font-semibold text-text-strong">
        {label}
        {required ? <span className="ml-1 text-danger">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function buildFighterPayload(
  formData: FormData,
  prefix: "fighterA" | "fighterB",
  division: string,
) {
  const payload = {
    fullName: String(formData.get(`${prefix}.fullName`) ?? ""),
    managerName: String(formData.get(`${prefix}.managerName`) ?? ""),
    managerEmail: String(formData.get(`${prefix}.managerEmail`) ?? ""),
    managerPhone: String(formData.get(`${prefix}.managerPhone`) ?? ""),
    division,
    notes: String(formData.get(`${prefix}.notes`) ?? ""),
    contractReference: String(formData.get(`${prefix}.contractReference`) ?? ""),
  };

  const hasAnyValue = [
    payload.fullName,
    payload.managerName,
    payload.managerEmail,
    payload.managerPhone,
    payload.notes,
    payload.contractReference,
  ].some((value) => value.trim().length > 0);

  return hasAnyValue ? payload : null;
}

function formatWeightClassOption(option: FightCardOptionRecord) {
  if (option.allowsCustomWeight) {
    return `${option.label} - custom limit`;
  }

  if (option.weightLimitKg !== null && option.weightLimitLb !== null) {
    return `${option.label} -${option.weightLimitKg} kg (${option.weightLimitLb} lb)`;
  }

  return option.label;
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

function UploadIcon({ className }: { className?: string }) {
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
      <path d="M12 16V6" />
      <path d="m8 10 4-4 4 4" />
      <path d="M5 18h14" />
    </svg>
  );
}
