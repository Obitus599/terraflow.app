interface PageHeaderProps {
  eyebrow?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-line px-6 py-6 md:flex-row md:items-end md:justify-between md:gap-6 md:px-10 md:py-8">
      <div className="min-w-0">
        {eyebrow ? (
          typeof eyebrow === "string" ? (
            <p className="section-label mb-3">{eyebrow}</p>
          ) : (
            <div className="mb-3">{eyebrow}</div>
          )
        ) : null}
        <h1 className="font-display text-2xl font-medium tracking-tight text-text md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-text-3">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
