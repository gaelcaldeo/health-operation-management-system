
import { signOut } from "@/app/logout/actions";
import { LogOut, UserRound } from "lucide-react";

type HeaderProps = {
  title: string;
  subtitle: string;
  fullName: string;
  role: string;
};

const roleLabels: Record<string, string> = {
  admin: "Administrator",
  healthcare_staff: "Healthcare Staff",
  claims_staff: "Claims Staff",
  authorization_staff: "Authorization Staff",
};

export default function Header({
  title,
  subtitle,
  fullName,
  role,
}: HeaderProps) {
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex min-w-0 flex-col gap-5 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
      {/* Page title */}
      <div className="min-w-0">
        <h2 className="truncate text-xl font-bold tracking-tight text-[#142C43] sm:text-2xl">
          {title}
        </h2>

        <p className="mt-1 text-sm leading-relaxed text-slate-500">
          {subtitle}
        </p>
      </div>

      {/* User profile and actions */}
      <div className="flex min-w-0 items-center justify-between gap-3 sm:gap-5 lg:justify-end">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E7F2F2] text-sm font-bold text-[#167C80] sm:h-11 sm:w-11">
            {initials || <UserRound size={20} />}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#172B3A]">
              {fullName || "User"}
            </p>

            <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
              {roleLabels[role] ?? "Staff"}
            </p>
          </div>
        </div>

        <div className="h-9 w-px shrink-0 bg-slate-200" />

        <form action={signOut}>
          <button
            type="submit"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#167C80] sm:px-4"
            aria-label="Sign out of GAEL HOMS"
          >
            <LogOut size={16} strokeWidth={2} />
            <span>Sign out</span>
          </button>
        </form>
      </div>
    </header>
  );
}
