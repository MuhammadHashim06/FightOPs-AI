"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { useToast } from "@/providers/toast-provider";
import type { SafeAuthUser } from "@/types/auth";

export function FighterSettingsPage({ user }: { user: SafeAuthUser }) {
  const { showToast } = useToast();
  const [profile, setProfile] = useState({
    firstName: user.profile.firstName,
    lastName: user.profile.lastName,
  });
  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProfile(true);

    try {
      const response = await fetch("/api/v1/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? "Unable to update profile.");
      }

      showToast({ title: "Profile updated.", variant: "success" });
    } catch (error) {
      showToast({
        title: error instanceof Error ? error.message : "Unable to update profile.",
        variant: "error",
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChangingPassword(true);

    try {
      const response = await fetch("/api/v1/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(password),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? "Unable to change password.");
      }

      setPassword({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showToast({ title: "Password changed.", variant: "success" });
    } catch (error) {
      showToast({
        title: error instanceof Error ? error.message : "Unable to change password.",
        variant: "error",
      });
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <main className="space-y-5">
      <div className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
          Account
        </p>
        <h1 className="text-[28px] font-semibold tracking-tight text-text-strong sm:text-[40px]">
          Settings
        </h1>
        <p className="text-lg text-text-body">
          Manage your fighter profile and sign-in credentials.
        </p>
      </div>

      <section className="rounded-[18px] border border-border-subtle bg-panel shadow-[var(--shadow-card)]">
        <div className="border-b border-border-subtle px-6 py-5">
          <h2 className="text-[18px] font-semibold text-text-strong">Profile</h2>
          <p className="mt-1 text-sm text-text-muted">This name is shown to your operations team.</p>
        </div>
        <form onSubmit={saveProfile} className="grid gap-5 px-6 py-6 md:grid-cols-2">
          <Field
            label="First name"
            value={profile.firstName}
            onChange={(value) => setProfile((current) => ({ ...current, firstName: value }))}
          />
          <Field
            label="Last name"
            value={profile.lastName}
            onChange={(value) => setProfile((current) => ({ ...current, lastName: value }))}
          />
          <div className="md:col-span-2">
            <label className="space-y-2 text-sm font-medium text-text-strong">
              <span>Email</span>
              <input value={user.email} readOnly className={inputClassName + " bg-panel-muted text-text-muted"} />
            </label>
          </div>
          <div className="flex items-center justify-end md:col-span-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex h-11 items-center justify-center rounded-[12px] bg-brand px-5 text-sm font-semibold text-text-inverse transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingProfile ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-[18px] border border-border-subtle bg-panel shadow-[var(--shadow-card)]">
        <div className="border-b border-border-subtle px-6 py-5">
          <h2 className="text-[18px] font-semibold text-text-strong">Password</h2>
          <p className="mt-1 text-sm text-text-muted">Use at least 8 characters for your new password.</p>
        </div>
        <form onSubmit={changePassword} className="grid gap-5 px-6 py-6 md:grid-cols-3">
          <PasswordField
            label="Current password"
            value={password.currentPassword}
            onChange={(value) => setPassword((current) => ({ ...current, currentPassword: value }))}
          />
          <PasswordField
            label="New password"
            value={password.newPassword}
            onChange={(value) => setPassword((current) => ({ ...current, newPassword: value }))}
          />
          <PasswordField
            label="Confirm new password"
            value={password.confirmPassword}
            onChange={(value) => setPassword((current) => ({ ...current, confirmPassword: value }))}
          />
          <div className="flex items-center justify-end md:col-span-3">
            <button
              type="submit"
              disabled={changingPassword}
              className="inline-flex h-11 items-center justify-center rounded-[12px] border border-border-subtle bg-panel px-5 text-sm font-semibold text-text-strong transition hover:bg-panel-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              {changingPassword ? "Changing..." : "Change password"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2 text-sm font-medium text-text-strong">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className={inputClassName} />
    </label>
  );
}

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="space-y-2 text-sm font-medium text-text-strong">
      <span>{label}</span>
      <span className="relative block">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={inputClassName + " pr-11"}
        />
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-3 text-text-muted hover:text-text-strong"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </span>
    </label>
  );
}

const inputClassName =
  "h-11 w-full rounded-[12px] border border-border-subtle bg-panel px-4 text-[15px] text-text-strong outline-none transition placeholder:text-text-muted focus:border-brand";
