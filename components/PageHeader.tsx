type PageHeaderProps = {
  title: string;
  description?: string;
  meta?: React.ReactNode;
};

export function PageHeader({ title, description, meta }: PageHeaderProps) {
  return (
    <header className="border-b border-border bg-surface px-6 py-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-slab text-2xl font-semibold text-ink">{title}</h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm text-slate">{description}</p>
          ) : null}
        </div>
        {meta ? <div className="text-sm text-muted">{meta}</div> : null}
      </div>
    </header>
  );
}
