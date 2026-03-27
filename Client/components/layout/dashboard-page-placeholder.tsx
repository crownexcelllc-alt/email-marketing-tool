interface DashboardPagePlaceholderProps {
  title: string;
  description: string;
}

export function DashboardPagePlaceholder({ title, description }: DashboardPagePlaceholderProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-zinc-100">{title}</h2>
      <p className="max-w-2xl text-sm text-zinc-400">{description}</p>
      <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 p-6 text-sm text-zinc-500">
        UI scaffold is ready for the <span className="font-medium text-zinc-300">{title}</span> module.
      </div>
    </section>
  );
}

