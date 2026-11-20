
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ShieldCheck,
  Plus,
  Search,
  RotateCcw,
  FileText,
  UserRound,
  CalendarDays,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";

type InsurancePolicy = {
  id: string;
  patient_id: string;
  insurance_provider: string;
  policy_number: string;
  group_number: string | null;
  effective_date: string;
  expiration_date: string | null;
  status: "active" | "inactive" | "terminated";
  patients: {
    patient_number: string;
    first_name: string;
    last_name: string;
  } | null;
};

type InsurancePageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    created?: string;
  }>;
};

function formatDate(date: string | null) {
  if (!date) return "—";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const statusStyles: Record<string, string> = {
  active: "border-green-200 bg-green-50 text-green-700",
  inactive: "border-amber-200 bg-amber-50 text-amber-700",
  terminated: "border-red-200 bg-red-50 text-red-700",
};

export default async function InsurancePage({
  searchParams,
}: InsurancePageProps) {
  const params = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  const canManageInsurance = [
    "admin",
    "healthcare_staff",
  ].includes(profile.role);

  const searchQuery = (params.q ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .slice(0, 100);

  const statusFilter = ["active", "inactive", "terminated"].includes(
    params.status ?? ""
  )
    ? params.status
    : "all";

  let query = supabase
    .from("insurance_policies")
    .select(`
      id,
      patient_id,
      insurance_provider,
      policy_number,
      group_number,
      effective_date,
      expiration_date,
      status,
      patients (
        patient_number,
        first_name,
        last_name
      )
    `)
    .order("created_at", { ascending: false });

  if (searchQuery) {
    query = query.or(
      `insurance_provider.ilike.%${searchQuery}%,policy_number.ilike.%${searchQuery}%`
    );
  }

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: policies, error } = await query;

  const insurancePolicies = (policies ?? []) as unknown as InsurancePolicy[];

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F7F9] md:flex-row">
      <Sidebar />

      <main className="w-full min-w-0 flex-1">
        <Header
          title="Insurance Management"
          subtitle="Manage patient insurance policies and coverage."
          fullName={profile.full_name}
          role={profile.role}
        />

        <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-6 lg:p-8">
          {/* Page introduction */}
          <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#167C80]" />
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#167C80]">
                  Coverage administration
                </p>
              </div>

              <h2 className="text-xl font-bold tracking-tight text-[#142C43] sm:text-2xl">
                Insurance Policies
              </h2>


            </div>

            {canManageInsurance && (
              <Link
                href="/insurance/new"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#167C80] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#11676B] sm:w-auto"
              >
                <Plus size={17} />
                Add Insurance Policy
              </Link>
            )}
          </section>

          {/* Success message */}
          {params.created === "true" && (
            <div
              role="status"
              className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3.5 text-sm text-green-700"
            >
              <ShieldCheck size={18} className="shrink-0" />
              Insurance policy successfully added.
            </div>
          )}

          {/* Search and filters */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Search size={17} className="text-[#167C80]" />
              <h3 className="text-sm font-semibold text-[#142C43]">
                Search and Filter
              </h3>
            </div>

            <form
              action="/insurance"
              method="GET"
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_190px_auto_auto]"
            >
              <div className="relative min-w-0">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery}
                  maxLength={100}
                  placeholder="Search provider or policy number..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-3.5 text-sm text-[#172B3A] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#167C80] focus:ring-2 focus:ring-[#167C80]/10"
                />
              </div>

              <select
                name="status"
                defaultValue={statusFilter}
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-[#167C80] focus:ring-2 focus:ring-[#167C80]/10"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
              </select>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#142C43] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1D3B56]"
              >
                <Search size={15} />
                Search
              </button>

              <Link
                href="/insurance"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#142C43]"
              >
                <RotateCcw size={15} />
                Reset
              </Link>
            </form>
          </section>

          {/* Policy list */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E7F2F2] text-[#167C80]">
                  <ShieldCheck size={18} />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#142C43]">
                    Registered Policies
                  </h3>

                </div>
              </div>

              <span className="self-start rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 sm:self-center">
                {insurancePolicies.length}{" "}
                {insurancePolicies.length === 1 ? "policy" : "policies"} found
              </span>
            </div>

            {error ? (
              <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
                <AlertCircle size={24} className="text-red-500" />
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Unable to load insurance policies
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Please refresh the page and try again.
                </p>
              </div>
            ) : insurancePolicies.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <ShieldCheck size={23} />
                </div>

                <p className="mt-3 text-sm font-semibold text-[#172B3A]">
                  No insurance policies found
                </p>

                <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
                  No policies match your current search. Add an insurance
                  policy or adjust your filters.
                </p>

                {canManageInsurance && (
                  <Link
                    href="/insurance/new"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#167C80] hover:text-[#11676B]"
                  >
                    <Plus size={16} />
                    Add Insurance Policy
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left text-sm">
                  <thead className="bg-slate-50/80">
                    <tr className="border-b border-slate-100">
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 sm:px-6">
                        Insurance Provider
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Policy Number
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Patient
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Effective Date
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Expiration Date
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Status
                      </th>
                      <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500 sm:px-6">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {insurancePolicies.map((policy) => (
                      <tr
                        key={policy.id}
                        className="transition-colors hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E7F2F2] text-[#167C80]">
                              <ShieldCheck size={17} />
                            </div>
                            <span className="font-semibold text-[#172B3A]">
                              {policy.insurance_provider}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-medium text-slate-600">
                            {policy.policy_number}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {policy.patients ? (
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                <UserRound size={15} />
                              </div>

                              <div>
                                <p className="font-semibold text-[#172B3A]">
                                  {policy.patients.first_name}{" "}
                                  {policy.patients.last_name}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-400">
                                  {policy.patients.patient_number}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">
                              Unknown Patient
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-slate-600">
                            <CalendarDays
                              size={14}
                              className="shrink-0 text-slate-400"
                            />
                            {formatDate(policy.effective_date)}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {formatDate(policy.expiration_date)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${
                              statusStyles[policy.status] ??
                              "border-slate-200 bg-slate-100 text-slate-600"
                            }`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {policy.status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right sm:px-6">
                          <Link
                            href={`/insurance/${policy.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#167C80] transition-colors hover:text-[#11676B]"
                          >
                            View Details
                            <ArrowUpRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
