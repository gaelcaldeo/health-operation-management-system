
import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  change: string;
  icon: LucideIcon;
};

export default function StatCard({
  label,
  value,
  change,
  icon: Icon,
}: StatCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E7F2F2] text-[#167C80]">
          <Icon size={20} strokeWidth={1.8} />
        </div>
      </div>

      <p className="mt-3 text-3xl font-bold tracking-tight text-[#142C43]">
        {value}
      </p>

      <p className="mt-2 text-xs leading-relaxed text-slate-500">
        {change}
      </p>
    </article>
  );
}
