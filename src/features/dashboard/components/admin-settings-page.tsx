"use client";

import { useState, type FormEvent } from "react";

import { useToast } from "@/providers/toast-provider";
import type { SafeAuthUser } from "@/types/auth";

export function AdminSettingsPage({ user }: { user: SafeAuthUser }) {
  const { showToast } = useToast();

  const [profile, setProfile] = useState({
    firstName: user.profile.firstName,
    lastName: user.profile.lastName,
    phone: user.profile.phone ?? "",
  });

  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingProfile(true);

    try {
      const response = await fetch("/api/v1/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? "Unable to update profile.");
      }

      showToast({ title: "Profile updated successfully.", variant: "success" });
    } catch (error) {
      showToast({
        title: error instanceof Error ? error.message : "Unable to update profile.",
        variant: "error",
      });
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsChangingPassword(true);

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
      showToast({ title: "Password changed successfully.", variant: "success" });
    } catch (error) {
      showToast({
        title: error instanceof Error ? error.message : "Unable to change password.",
        variant: "error",
      });
    } finally {
      setIsChangingPassword(false);
    }
  }

  return (
    <main className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
          Platform administration
        </p>
        <h1 className="text-[28px] font-semibold tracking-tight text-text-strong sm:text-[40px]">
          Settings
        </h1>
        <p className="text-lg text-text-body">
          Manage your administrator profile, contact details, and security credentials.
        </p>
      </div>

      {/* Profile Settings Card */}
      <section className="rounded-[18px] border border-border-subtle bg-panel shadow-[var(--shadow-card)]">
        <div className="border-b border-border-subtle px-6 py-5">
          <h2 className="text-[18px] font-semibold text-text-strong">Account Profile</h2>
          <p className="mt-1 text-sm text-text-muted">
            Your name and administrative contact information.
          </p>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-6 px-6 py-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-text-strong">
              <span>First name</span>
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, firstName: e.target.value }))
                }
                autoComplete="given-name"
                className={inputClassName}
                required
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-text-strong">
              <span>Last name</span>
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, lastName: e.target.value }))
                }
                autoComplete="family-name"
                className={inputClassName}
                required
              />
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-text-strong">
              <span>Email address</span>
              <input
                type="email"
                value={user.email}
                readOnly
                className={`${inputClassName} bg-panel-muted text-text-muted cursor-not-allowed`}
              />
              <span className="block text-xs text-text-muted">
                Admin login email cannot be changed here.
              </span>
            </label>

            <label className="space-y-2 text-sm font-medium text-text-strong">
              <span>Phone number (optional)</span>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="+1 (555) 000-0000"
                className={inputClassName}
              />
              <span className="block text-xs text-text-muted">
                Used for administrative operational contact.
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="inline-flex h-11 items-center justify-center rounded-[12px] bg-brand px-6 text-sm font-semibold text-text-inverse transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingProfile ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </section>

      {/* Password Settings Card */}
      <section className="rounded-[18px] border border-border-subtle bg-panel shadow-[var(--shadow-card)]">
        <div className="border-b border-border-subtle px-6 py-5">
          <h2 className="text-[18px] font-semibold text-text-strong">Security & Password</h2>
          <p className="mt-1 text-sm text-text-muted">
            Ensure your administrator account uses a strong, unique password.
          </p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-6 px-6 py-6">
          <div className="grid gap-5 md:grid-cols-3">
            <PasswordField
              label="Current password"
              value={password.currentPassword}
              onChange={(val) =>
                setPassword((prev) => ({ ...prev, currentPassword: val }))
              }
              autoComplete="current-password"
            />

            <PasswordField
              label="New password"
              value={password.newPassword}
              onChange={(val) =>
                setPassword((prev) => ({ ...prev, newPassword: val }))
              }
              autoComplete="new-password"
            />

            <PasswordField
              label="Confirm new password"
              value={password.confirmPassword}
              onChange={(val) =>
                setPassword((prev) => ({ ...prev, confirmPassword: val }))
              }
              autoComplete="new-password"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="inline-flex h-11 items-center justify-center rounded-[12px] border border-border-subtle bg-panel px-6 text-sm font-semibold text-text-strong transition hover:bg-panel-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isChangingPassword ? "Updating..." : "Change password"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  autoComplete?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <label className="space-y-2 text-sm font-medium text-text-strong">
      <span>{label}</span>
      <span className="relative block">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className={`${inputClassName} pr-11`}
          required
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={showPassword ? "Hide password" : "Show password"}
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute inset-y-0 right-3 text-text-muted hover:text-text-strong"
        >
          {showPassword ? (
            <EyeOffIcon className="h-4 w-4" />
          ) : (
            <EyeIcon className="h-4 w-4" />
          )}
        </button>
      </span>
    </label>
  );
}

function EyeIcon({ className }: { className?: string }) {
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
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
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
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

const inputClassName =
  "h-11 w-full rounded-[12px] border border-border-subtle bg-panel px-4 text-[15px] text-text-strong outline-none transition placeholder:text-text-muted focus:border-brand";
