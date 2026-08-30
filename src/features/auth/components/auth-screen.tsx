import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type AuthLink = {
  href: string;
  label: string;
};

type AuthScreenProps = {
  title: string;
  description: string;
  form: ReactNode;
  footerPrompt: string;
  footerAction: AuthLink;
  auxiliaryLinks?: AuthLink[];
};

export function AuthScreen({
  title,
  description,
  form,
  footerPrompt,
  footerAction,
  auxiliaryLinks = [],
}: AuthScreenProps) {
  return (
    <main className="grid w-full max-w-6xl gap-0 overflow-hidden rounded-[var(--radius-card)] border border-border-subtle bg-panel shadow-[var(--shadow-soft)] lg:grid-cols-[1.02fr_0.98fr]">
      <section className="border-b border-border-subtle bg-panel-muted p-8 sm:p-12 lg:border-b-0 lg:border-r">
        <div className="mx-auto flex max-w-xl flex-col items-center space-y-6 text-center">
          <div className="flex justify-center">
            <Image
              src="/brand/logo.png"
              alt="FightOps AI logo"
              width={200}
              height={56}
              priority
              className="h-12 w-auto object-contain"
            />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-text-strong sm:text-5xl">
              {title}
            </h1>
            <p className="text-base leading-7 text-text-body sm:text-lg">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-10 rounded-[var(--radius-pill)] border border-border-subtle bg-panel p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-text-muted">
            Stay organized
          </p>
          <div className="mt-4 grid gap-3 text-sm text-text-body sm:grid-cols-2">
            <div className="rounded-[var(--radius-pill)] bg-panel-muted p-4">
              Keep everything in one clean workspace with simple access and clear updates.
            </div>
            <div className="rounded-[var(--radius-pill)] bg-panel-muted p-4">
              Move faster with a focused experience for sign-in, recovery, and account setup.
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col justify-center bg-panel p-8 sm:p-12">
        <div className="mx-auto flex w-full max-w-md flex-col gap-6">
          {form}

          {auxiliaryLinks.length > 0 ? (
            <div className="flex flex-wrap gap-4 text-sm text-text-body">
              {auxiliaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-medium text-brand transition hover:text-brand-strong"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ) : null}

          <p className="text-sm text-text-body">
            {footerPrompt}{" "}
            <Link
              href={footerAction.href}
              className="font-semibold text-brand transition hover:text-brand-strong"
            >
              {footerAction.label}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
