
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FilePlus2,
  FileText,
  RotateCcw,
  Search,
  ShieldAlert,
  Wallet,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";

type Claim = {
  id: string;
  patient_id: string;
  claim_number: string;
  service_date: string;
  submission_date: string | null;
  claim_amount: number;
  status: "draft" | "submitted" | "pending" | "approved" | "denied";
  rejection_reason: string | null;
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

type ClaimsPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    created?: string;
  }>;
};

const statusStyles: Record<string, string> = {
  draft: "border-slate-200 bg-slate-50 text-slate-600",
  submitted: "border-blue-200 bg-blue-50 text-blue-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-green-200 bg-green-50 text-green-700",
  denied: "border-red-200 bg-red-50 text-red-700",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  pending: "Pending",
  approved: "Approved",
  denied: "Denied",
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

function formatCurrency(amount: number) {
  return `₱${Number(amount).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  iconStyle,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ElementType;
  iconStyle: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-[#142C43]">
            {value.toLocaleString("en-PH")}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}
        >
          <Icon size={21} strokeWidth={1.8} />
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">{description}</p>
    </article>
  );
}

export default async function ClaimsPage({
  searchParams,
}: ClaimsPageProps) {
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

  const canCreateClaim = [
    "admin",
    "healthcare_staff",
    "claims_staff",
  ].includes(profile.role);

  const { data, error } = await supabase
    .from("claims")
    .select(`
      id,
      patient_id,
      claim_number,
      service_date,
      submission_date,
      claim_amount,
      status,
      rejection_reason,
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
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Claims query failed:", error);
  }

  const claims = (data ?? []) as unknown as Claim[];

  const totalClaims = claims.length;

  const pendingClaims = claims.filter((claim) =>
    ["submitted", "pending"].includes(claim.status)
  ).length;

  const approvedClaims = claims.filter(
    (claim) => claim.status === "approved"
  ).length;

  const deniedClaims = claims.filter(
    (claim) => claim.status === "denied"
  ).length;

  const search = q.trim().toLowerCase();

  const filteredClaims = claims.filter((claim) => {
    const patientName = claim.patients
      ? `${claim.patients.first_name} ${claim.patients.last_name}`.toLowerCase()
      : "";

    const matchesSearch =
      !search ||
      claim.claim_number.toLowerCase().includes(search) ||
      patientName.includes(search) ||
      claim.patients?.patient_number.toLowerCase().includes(search) ||
      claim.insurance_policies?.insurance_provider
        .toLowerCase()
        .includes(search);

    const matchesStatus =
      status === "all" || claim.status === status;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F7F9] md:flex-row">
      <Sidebar />

      <main className="w-full min-w-0 flex-1">
        <Header
          title="Claims Management"
          subtitle="Manage, review, and track insurance claim submissions."
          fullName={profile.full_name}
          role={profile.role}
        />

        <div className="mx-auto w-full max-w-[1500px] space-y-7 p-4 sm:p-6 lg:p-8">
          {/* Success notification */}
          {created === "true" && (
            <div
              role="status"
              className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
            >
              <CheckCircle2 size={18} className="shrink-0" />
              Claim successfully created.
            </div>
          )}

          {/* Page heading */}
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#167C80]">
                  Revenue cycle operations
                </span>
              </div>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#142C43]">
                Claims Directory
              </h1>


            </div>

            {canCreateClaim && (
              <Link
                href="/claims/new"
                className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-[#167C80] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#11676B] sm:w-auto"
              >
                <FilePlus2 size={17} />
                Create Claim
              </Link>
            )}
          </section>

          {/* Metrics */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <ClipboardList size={17} className="text-[#167C80]" />
              <h2 className="text-sm font-bold text-[#142C43]">
                Claims Overview
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Total Claims"
                value={totalClaims}
                description="All recorded claim submissions"
                icon={FileText}
                iconStyle="bg-slate-100 text-slate-600"
              />

              <MetricCard
                label="Pending Claims"
                value={pendingClaims}
                description="Submitted and awaiting a decision"
                icon={Clock3}
                iconStyle="bg-amber-50 text-amber-600"
              />

              <MetricCard
                label="Approved Claims"
                value={approvedClaims}
                description="Claims with approved status"
                icon={CheckCircle2}
                iconStyle="bg-green-50 text-green-600"
              />

              <MetricCard
                label="Denied Claims"
                value={deniedClaims}
                description="Claims with denied status"
                icon={ShieldAlert}
                iconStyle="bg-red-50 text-red-600"
              />
            </div>
          </section>

          {/* Directory and filters */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
              <div>
                <h2 className="text-base font-bold text-[#142C43]">
                  All Claims
                </h2>

              </div>

              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Wallet size={15} />
                {filteredClaims.length.toLocaleString("en-PH")}{" "}
                {filteredClaims.length === 1 ? "record" : "records"}
              </div>
            </div>

            <form
              action="/claims"
              method="GET"
              className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:p-5"
            >
              <div className="relative min-w-0 flex-1">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Search claim number, patient, or provider..."
                  aria-label="Search claims"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-[#172B3A] outline-none transition placeholder:text-slate-400 focus:border-[#167C80] focus:ring-2 focus:ring-[#167C80]/10"
                />
              </div>

              <select
                name="status"
                defaultValue={status}
                aria-label="Filter claims by status"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#167C80] focus:ring-2 focus:ring-[#167C80]/10 sm:w-auto"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="denied">Denied</option>
              </select>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#142C43] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1D3B56]"
              >
                <Search size={15} />
                Search
              </button>

              {(q || status !== "all") && (
                <Link
                  href="/claims"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <RotateCcw size={15} />
                  Reset
                </Link>
              )}
            </form>

            {/* Query error */}
            {error ? (
              <div
                role="alert"
                className="flex items-start gap-3 p-6 text-sm text-red-700"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p>Unable to load claims. Please refresh the page and try again.</p>
              </div>
            ) : filteredClaims.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-14 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  <FileText size={23} />
                </div>

                <h3 className="mt-4 text-sm font-bold text-[#142C43]">
                  No claims found
                </h3>

                <p className="mt-1 max-w-sm text-sm leading-relaxed text-slate-500">
                  {q || status !== "all"
                    ? "No records match your current search or status filter. Try adjusting your filters."
                    : "There are no claim records yet."}
                </p>

                {q || status !== "all" ? (
                  <Link
                    href="/claims"
                    className="mt-4 text-sm font-semibold text-[#167C80] hover:text-[#11676B]"
                  >
                    Clear filters
                  </Link>
                ) : (
                  canCreateClaim && (
                    <Link
                      href="/claims/new"
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#167C80] hover:text-[#11676B]"
                    >
                      <FilePlus2 size={16} />
                      Create your first claim
                    </Link>
                  )
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5 sm:px-6">Claim Number</th>
                      <th className="px-5 py-3.5">Patient</th>
                      <th className="px-5 py-3.5">Insurance Provider</th>
                      <th className="px-5 py-3.5">Service Date</th>
                      <th className="px-5 py-3.5">Claim Amount</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredClaims.map((claim) => (
                      <tr
                        key={claim.id}
                        className="transition-colors hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4 sm:px-6">
                          <p className="font-semibold text-[#142C43]">
                            {claim.claim_number}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {claim.submission_date
                              ? `Submitted ${formatDate(claim.submission_date)}`
                              : "Not yet submitted"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#172B3A]">
                            {claim.patients
                              ? `${claim.patients.first_name} ${claim.patients.last_name}`
                              : "Unknown Patient"}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {claim.patients?.patient_number ?? "N/A"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-700">
                            {claim.insurance_policies?.insurance_provider ??
                              "N/A"}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {claim.insurance_policies?.policy_number ?? ""}
                          </p>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                          {formatDate(claim.service_date)}
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap font-semibold tabular-nums text-[#172B3A]">
                          {formatCurrency(claim.claim_amount)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              statusStyles[claim.status] ??
                              "border-slate-200 bg-slate-50 text-slate-600"
                            }`}
                          >
                            {statusLabels[claim.status] ?? claim.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <Link
                            href={`/claims/${claim.id}`}
                            className="inline-flex items-center gap-1.5 font-semibold text-[#167C80] transition-colors hover:text-[#11676B]"
                          >
                            View Details
                            <ArrowRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!error && filteredClaims.length > 0 && (
              <div className="border-t border-slate-100 px-5 py-3.5 sm:px-6">
                <p className="text-xs text-slate-400">
                  Displaying {filteredClaims.length} of {totalClaims} claim records
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
