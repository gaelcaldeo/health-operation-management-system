
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Search,
  ShieldCheck,
  XCircle,
  Clock3,
  RotateCcw,
  Plus,
  CalendarDays,
  UserRound,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";

type Authorization = {
  id: string;
  authorization_number: string | null;
  patient_id: string;
  requested_service: string;
  request_date: string;
  decision_date: string | null;
  status: "draft" | "submitted" | "pending" | "approved" | "denied";
  denial_reason: string | null;
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

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    created?: string;
    updated?: string;
  }>;
};

const formatDate = (date: string | null) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  pending: "Pending",
  approved: "Approved",
  denied: "Denied",
};

const statusStyles: Record<string, string> = {
  draft: "border-slate-200 bg-slate-100 text-slate-700",
  submitted: "border-blue-200 bg-blue-50 text-blue-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-green-200 bg-green-50 text-green-700",
  denied: "border-red-200 bg-red-50 text-red-700",
};

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

      <p className="mt-3 text-xs text-slate-500">{description}</p>
    </article>
  );
}

export default async function AuthorizationsPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const requestedStatus = params.status ?? "all";

  const statusFilter = [
    "all",
    "draft",
    "submitted",
    "pending",
    "approved",
    "denied",
  ].includes(requestedStatus)
    ? requestedStatus
    : "all";

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

  let authorizationQuery = supabase
    .from("authorizations")
    .select(`
      id,
      authorization_number,
      patient_id,
      requested_service,
      request_date,
      decision_date,
      status,
      denial_reason,
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

  if (statusFilter !== "all") {
    authorizationQuery = authorizationQuery.eq("status", statusFilter);
  }

  const { data, error } = await authorizationQuery;

  if (error) {
    console.error("Failed to load authorizations:", error);
  }

  const authorizations = (data ?? []) as unknown as Authorization[];

  const filteredAuthorizations = authorizations.filter((authorization) => {
    if (!query) return true;

    const patientName = authorization.patients
      ? `${authorization.patients.first_name} ${authorization.patients.last_name}`
      : "";

    const searchText = [
      authorization.authorization_number,
      authorization.requested_service,
      patientName,
      authorization.patients?.patient_number,
      authorization.insurance_policies?.insurance_provider,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchText.includes(query.toLowerCase());
  });

  const { data: allData } = await supabase
    .from("authorizations")
    .select("status");

  const allAuthorizations = allData ?? [];

  const total = allAuthorizations.length;
  const pending = allAuthorizations.filter((item) =>
    ["submitted", "pending"].includes(item.status)
  ).length;
  const approved = allAuthorizations.filter(
    (item) => item.status === "approved"
  ).length;
  const denied = allAuthorizations.filter(
    (item) => item.status === "denied"
  ).length;

  const canCreateAuthorization = [
    "admin",
    "healthcare_staff",
    "authorization_staff",
  ].includes(profile.role);

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F7F9] md:flex-row">
      <Sidebar />

      <main className="w-full min-w-0 flex-1">
        <Header
          title="Prior Authorization"
          subtitle="Manage and track service authorization requests."
          fullName={profile.full_name}
          role={profile.role}
        />

        <div className="mx-auto w-full max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
          {/* Feedback messages */}
          {params.created === "true" && (
            <div
              role="status"
              className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
            >
              <FileCheck2 size={18} className="shrink-0" />
              Authorization request created successfully.
            </div>
          )}

          {params.updated === "true" && (
            <div
              role="status"
              className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
            >
              <ShieldCheck size={18} className="shrink-0" />
              Authorization request updated successfully.
            </div>
          )}

          {/* Metrics */}
          <section>
            <div className="mb-4">
              <h2 className="text-sm font-bold text-[#142C43]">
                Authorization Overview
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Summary of all accessible authorization requests.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Total Requests"
                value={total}
                description="All authorization requests"
                icon={ClipboardCheck}
                iconStyle="bg-[#E7F2F2] text-[#167C80]"
              />

              <MetricCard
                label="Pending"
                value={pending}
                description="Awaiting a decision"
                icon={Clock3}
                iconStyle="bg-amber-50 text-amber-600"
              />

              <MetricCard
                label="Approved"
                value={approved}
                description="Approved requests"
                icon={ShieldCheck}
                iconStyle="bg-green-50 text-green-600"
              />

              <MetricCard
                label="Denied"
                value={denied}
                description="Denied requests"
                icon={XCircle}
                iconStyle="bg-red-50 text-red-600"
              />
            </div>
          </section>

          {/* Authorization directory */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-base font-bold text-[#142C43]">
                  Authorization Requests
                </h2>

              </div>

              {canCreateAuthorization && (
                <Link
                  href="/authorizations/new"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#167C80] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#11676B]"
                >
                  <Plus size={17} />
                  New Authorization
                </Link>
              )}
            </div>

            {/* Search and filters */}
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <form className="flex flex-col gap-3 lg:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Search
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="search"
                    name="q"
                    defaultValue={query}
                    placeholder="Search authorization, patient, or service..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-[#172B3A] outline-none transition placeholder:text-slate-400 focus:border-[#167C80] focus:ring-2 focus:ring-[#167C80]/10"
                  />
                </div>

                <select
                  name="status"
                  defaultValue={statusFilter}
                  aria-label="Filter by authorization status"
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#172B3A] outline-none focus:border-[#167C80] focus:ring-2 focus:ring-[#167C80]/10"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="denied">Denied</option>
                </select>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#142C43] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1D3B56] sm:flex-none"
                  >
                    <Search size={16} />
                    Search
                  </button>

                  {(query || statusFilter !== "all") && (
                    <Link
                      href="/authorizations"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      <RotateCcw size={15} />
                      Reset
                    </Link>
                  )}
                </div>
              </form>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Authorization</th>
                    <th className="px-5 py-3.5">Patient</th>
                    <th className="px-5 py-3.5">Insurance</th>
                    <th className="px-5 py-3.5">Requested Service</th>
                    <th className="px-5 py-3.5">Request Date</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredAuthorizations.map((authorization) => (
                    <tr
                      key={authorization.id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#167C80]">
                          {authorization.authorization_number ?? "Pending"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Authorization record
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                            <UserRound size={17} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#172B3A]">
                              {authorization.patients
                                ? `${authorization.patients.first_name} ${authorization.patients.last_name}`
                                : "Unknown Patient"}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {authorization.patients?.patient_number ?? "N/A"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-700">
                          {authorization.insurance_policies?.insurance_provider ??
                            "N/A"}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {authorization.insurance_policies?.policy_number ??
                            "No policy number"}
                        </p>
                      </td>

                      <td className="max-w-[220px] px-5 py-4">
                        <p className="line-clamp-2 font-medium leading-relaxed text-slate-700">
                          {authorization.requested_service}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <CalendarDays
                            size={15}
                            className="shrink-0 text-slate-400"
                          />
                          {formatDate(authorization.request_date)}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            statusStyles[authorization.status] ??
                            "border-slate-200 bg-slate-100 text-slate-700"
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {statusLabels[authorization.status] ??
                            authorization.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/authorizations/${authorization.id}`}
                          className="inline-flex items-center gap-1.5 font-semibold text-[#167C80] transition-colors hover:text-[#11676B]"
                        >
                          View Details
                          <ArrowRight size={15} />
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {filteredAuthorizations.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                          <FileText size={22} />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-[#142C43]">
                          No authorization requests found
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Try adjusting your search or status filter.
                        </p>
                        {(query || statusFilter !== "all") && (
                          <Link
                            href="/authorizations"
                            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#167C80] hover:text-[#11676B]"
                          >
                            Clear filters
                            <ArrowRight size={14} />
                          </Link>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {filteredAuthorizations.length}
                </span>{" "}
                authorization request(s)
              </p>
              <p className="text-xs text-slate-400">
                GAEL HOMS · Authorization Management
              </p>
            </div>
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
