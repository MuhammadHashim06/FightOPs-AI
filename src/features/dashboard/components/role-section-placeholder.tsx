type RoleSectionPlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function RoleSectionPlaceholder({
  eyebrow,
  title,
  description,
}: RoleSectionPlaceholderProps) {
  return (
    <main className="rounded-[24px] border border-border-subtle bg-panel p-8 shadow-[var(--shadow-soft)]">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
          {eyebrow}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-text-strong">
          {title}
        </h1>
        <p className="max-w-2xl text-base leading-7 text-text-body">
          {description}
        </p>
      </div>
    </main>
  );
}
