
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CircleCheck,
  Clock3,
  FileSearch,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";

type EligibilityCheck = {
  id: string;
  patient_id: string;
  insurance_policy_id: string;
  check_date: string;
  status: "eligible" | "ineligible" | "pending";
  notes: string | null;
  patients: {
    patient_number: string;
    first_name: string;
    last_name: string;
  } | null;
  insurance_policies: {
    insurance_provider: string;
    policy_number: string;
  } | null;
};

type EligibilityPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    created?: string;
  }>;
};

const statusStyles: Record<string, string> = {
  eligible: "border-green-200 bg-green-50 text-green-700",
  ineligible: "border-red-200 bg-red-50 text-red-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
};

function formatDate(date: string | null) {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ElementType;
  tone: "navy" | "green" | "red" | "amber";
}) {
  const toneStyles = {
    navy: "bg-[#EAF0F5] text-[#142C43]",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
  };

  const valueStyles = {
    navy: "text-[#142C43]",
    green: "text-green-700",
    red: "text-red-700",
    amber: "text-amber-700",
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneStyles[tone]}`}
        >
          <Icon size={20} strokeWidth={1.8} />
        </div>
      </div>

      <p className={`mt-4 text-3xl font-bold tracking-tight ${valueStyles[tone]}`}>
        {value.toLocaleString("en-PH")}
      </p>

      <p className="mt-1.5 text-xs text-slate-500">{description}</p>
    </article>
  );
}

export default async function EligibilityPage({
  searchParams,
}: EligibilityPageProps) {
  const {
    q = "",
    status = "all",
    created = "",
  } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const canCreateEligibility = [
    "admin",
    "healthcare_staff",
    "authorization_staff",
  ].includes(profile.role);

  const { data, error } = await supabase
    .from("eligibility_checks")
    .select(`
      id,
      patient_id,
      insurance_policy_id,
      check_date,
      status,
      notes,
      patients (
        patient_number,
        first_name,
        last_name
      ),
      insurance_policies (
        insurance_provider,
        policy_number
      )
    `)
    .order("check_date", { ascending: false });

  if (error) {
    console.error("Eligibility checks query failed:", error);
  }

  const checks = (data ?? []) as unknown as EligibilityCheck[];

  const totalChecks = checks.length;

  const eligibleCount = checks.filter(
    (check) => check.status === "eligible"
  ).length;

  const ineligibleCount = checks.filter(
    (check) => check.status === "ineligible"
  ).length;

  const pendingCount = checks.filter(
    (check) => check.status === "pending"
  ).length;

  const filteredChecks = checks.filter((check) => {
    const search = q.toLowerCase();

    const patientName = check.patients
      ? `${check.patients.first_name} ${check.patients.last_name}`.toLowerCase()
      : "";

    const patientNumber =
      check.patients?.patient_number?.toLowerCase() ?? "";

    const provider =
      check.insurance_policies?.insurance_provider?.toLowerCase() ?? "";

    const matchesSearch =
      !search ||
      patientName.includes(search) ||
      patientNumber.includes(search) ||
      provider.includes(search);

    const matchesStatus =
      status === "all" || check.status === status;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F7F9] md:flex-row">
      <Sidebar />

        <main className="w-full min-w-0 flex-1">
        <Header
          title="Eligibility Verification"
          subtitle="Monitor and manage patient insurance eligibility checks."
          fullName={profile.full_name}
          role={profile.role}
        />

        <div className="mx-auto w-full max-w-[1440px] space-y-6 p-4 sm:p-6 lg:p-8">
          {/* Success message */}
          {created === "true" && (
            <div
              role="status"
              className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3.5 text-sm font-medium text-green-800"
            >
              <CircleCheck size={19} className="shrink-0" />
              Eligibility verification successfully created.
            </div>
          )}

          {/* Page introduction */}
          <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E7F2F2] text-[#167C80]">
                  <ShieldCheck size={19} />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#167C80]">
                  Insurance operations
                </p>
              </div>

              <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#142C43] sm:text-3xl">
                Eligibility Overview
              </h1>


            </div>

            {canCreateEligibility && (
              <Link
                href="/eligibility/new"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#167C80] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#11676B] sm:w-auto"
              >
                <Plus size={17} />
                New Eligibility Check
              </Link>
            )}
          </section>

          {/* Metrics */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Activity size={17} className="text-slate-400" />
              <h2 className="text-sm font-bold text-[#142C43]">
                Verification Summary
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Total Checks"
                value={totalChecks}
                description="All verification records"
                icon={FileSearch}
                tone="navy"
              />

              <MetricCard
                label="Eligible"
                value={eligibleCount}
                description="Successfully verified"
                icon={ShieldCheck}
                tone="green"
              />

              <MetricCard
                label="Ineligible"
                value={ineligibleCount}
                description="Unsuccessful verifications"
                icon={ShieldAlert}
                tone="red"
              />

              <MetricCard
                label="Pending"
                value={pendingCount}
                description="Awaiting verification"
                icon={Clock3}
                tone="amber"
              />
            </div>
          </section>

          {/* Verification history */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#142C43]">
                    Verification History
                  </h2>

                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Users size={15} />
                  {filteredChecks.length}{" "}
                  {filteredChecks.length === 1 ? "record" : "records"} found
                </div>
              </div>

              {/* Filters */}
              <form className="mt-5 flex flex-col gap-3 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Search
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    name="q"
                    defaultValue={q}
                    placeholder="Search patient, number, or provider..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-[#172B3A] outline-none transition placeholder:text-slate-400 focus:border-[#167C80] focus:ring-2 focus:ring-[#167C80]/10"
                  />
                </div>

                <select
                  name="status"
                  defaultValue={status}
                  aria-label="Filter by eligibility status"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#167C80] focus:ring-2 focus:ring-[#167C80]/10 sm:w-auto"
                >
                  <option value="all">All statuses</option>
                  <option value="eligible">Eligible</option>
                  <option value="ineligible">Ineligible</option>
                  <option value="pending">Pending</option>
                </select>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#142C43]"
                >
                  <Search size={16} />
                  Search
                </button>

                {(q || status !== "all") && (
                  <Link
                    href="/eligibility"
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-[#167C80]"
                  >
                    <RotateCcw size={15} />
                    Reset
                  </Link>
                )}
              </form>
            </div>

            {/* Results */}
            {error ? (
              <div className="p-8 text-center">
                <ShieldAlert
                  size={28}
                  className="mx-auto text-red-400"
                />
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Unable to load eligibility records
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Please refresh the page and try again.
                </p>
              </div>
            ) : filteredChecks.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  <FileSearch size={23} />
                </div>

                <h3 className="mt-4 text-sm font-bold text-[#142C43]">
                  No eligibility checks found
                </h3>

                <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500">
                  {q || status !== "all"
                    ? "Try adjusting your search or status filter."
                    : "Create your first eligibility verification to get started."}
                </p>

                {canCreateEligibility && !q && status === "all" && (
                  <Link
                    href="/eligibility/new"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#167C80] hover:text-[#11676B]"
                  >
                    Create eligibility check
                    <ArrowRight size={15} />
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-3.5">Patient</th>
                      <th className="px-6 py-3.5">Insurance Provider</th>
                      <th className="px-6 py-3.5">Policy Number</th>
                      <th className="px-6 py-3.5">Check Date</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredChecks.map((check) => (
                      <tr
                        key={check.id}
                        className="transition-colors hover:bg-slate-50/80"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E7F2F2] text-[#167C80]">
                              <Users size={17} />
                            </div>

                            <div className="min-w-0">
                              <p className="font-semibold text-[#172B3A]">
                                {check.patients
                                  ? `${check.patients.first_name} ${check.patients.last_name}`
                                  : "Unknown Patient"}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {check.patients?.patient_number ?? "N/A"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 font-medium text-slate-700">
                          {check.insurance_policies?.insurance_provider ??
                            "N/A"}
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {check.insurance_policies?.policy_number ?? "N/A"}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-600">
                            <CalendarDays
                              size={15}
                              className="shrink-0 text-slate-400"
                            />
                            {formatDate(check.check_date)}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${
                              statusStyles[check.status] ??
                              "border-slate-200 bg-slate-50 text-slate-600"
                            }`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {check.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/eligibility/${check.id}`}
                            className="inline-flex items-center gap-1.5 font-semibold text-[#167C80] transition-colors hover:text-[#11676B]"
                          >
                            View Details
                            <ArrowRight size={15} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!error && filteredChecks.length > 0 && (
              <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3.5 sm:px-6">
                <p className="text-xs text-slate-500">
                  Showing {filteredChecks.length} of {totalChecks} verification records
                </p>
              </div>
            )}
          </section>

          <footer className="border-t border-slate-200 pt-4">
            <p className="text-center text-xs text-slate-400 sm:text-left">
              GAEL HOMS · Fictional portfolio demonstration
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
