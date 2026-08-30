"use client";

import type { FormEventHandler, ReactNode } from "react";
import { useState } from "react";

type FieldProps = {
  label: string;
  id: string;
  name?: string;
  type?: string;
  placeholder: string;
  hint?: string;
  defaultValue?: string;
  autoComplete?: string;
  required?: boolean;
};

type AuthFormProps = {
  children: ReactNode;
  onSubmit?: (formData: FormData) => void | Promise<void>;
};

export function AuthForm({ children, onSubmit }: AuthFormProps) {
  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    if (!onSubmit) {
      return;
    }

    await onSubmit(new FormData(event.currentTarget));
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      {children}
    </form>
  );
}

export function Field({
  label,
  id,
  name,
  type = "text",
  placeholder,
  hint,
  defaultValue,
  autoComplete,
  required,
}: FieldProps) {
  return (
    <label className="flex flex-col gap-2" htmlFor={id}>
      <span className="text-sm font-semibold text-text-strong">{label}</span>
      <input
        id={id}
        name={name ?? id}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        required={required}
        className="h-12 rounded-[var(--radius-pill)] border border-border-subtle bg-panel-muted px-4 text-sm text-text-strong outline-none transition placeholder:text-text-muted focus:border-brand focus:bg-panel"
      />
      {hint ? <span className="text-xs text-text-muted">{hint}</span> : null}
    </label>
  );
}

export function FormNotice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-pill)] border border-border-subtle bg-panel-muted p-4 text-sm text-text-body">
      {children}
    </div>
  );
}

export function PasswordField({
  label,
  id,
  name,
  placeholder,
  hint,
  defaultValue,
  autoComplete,
  required,
}: Omit<FieldProps, "type">) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label className="flex flex-col gap-2" htmlFor={id}>
      <span className="text-sm font-semibold text-text-strong">{label}</span>
      <div className="relative">
        <input
          id={id}
          name={name ?? id}
          type={isVisible ? "text" : "password"}
          placeholder={placeholder}
          defaultValue={defaultValue}
          autoComplete={autoComplete}
          required={required}
          className="h-12 w-full rounded-[var(--radius-pill)] border border-border-subtle bg-panel-muted px-4 pr-12 text-sm text-text-strong outline-none transition placeholder:text-text-muted focus:border-brand focus:bg-panel"
        />
        <button
          type="button"
          aria-label={isVisible ? "Hide password" : "Show password"}
          aria-pressed={isVisible}
          onClick={() => setIsVisible((value) => !value)}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-text-muted transition hover:text-text-strong"
        >
          {isVisible ? (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3l18 18" />
              <path d="M10.6 10.7a2 2 0 0 0 2.8 2.8" />
              <path d="M9.4 5.3A10.7 10.7 0 0 1 12 5c5.2 0 9.4 4.1 10 7-.2 1-1 2.5-2.3 3.9" />
              <path d="M6.2 6.3C3.8 7.8 2.2 10 2 12c.3 1.6 2.2 5.1 6.7 6.4" />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {hint ? <span className="text-xs text-text-muted">{hint}</span> : null}
    </label>
  );
}

export function OtpField({
  label,
  id,
  name,
  placeholder,
  hint,
  defaultValue,
  autoComplete,
  required,
}: Omit<FieldProps, "type">) {
  return (
    <Field
      id={id}
      name={name}
      label={label}
      type="text"
      placeholder={placeholder}
      hint={hint}
      defaultValue={defaultValue}
      autoComplete={autoComplete}
      required={required}
    />
  );
}

export function SubmitButton({
  children,
  disabled,
}: {
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="mt-2 h-12 rounded-[var(--radius-pill)] bg-brand px-5 text-sm font-semibold text-text-inverse transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-border-subtle" />
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">
        {label}
      </span>
      <div className="h-px flex-1 bg-border-subtle" />
    </div>
  );
}
