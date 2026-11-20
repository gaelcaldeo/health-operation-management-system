
import Link from "next/link";
import { redirect } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Users,
  FileText,
  Clock3,
  ClipboardList,
  ArrowUpRight,
  Plus,
  UserRoundPlus,
  Activity,
  Archive,
  RefreshCw,
  CircleCheck,
  CircleDot,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";

type RecentClaim = {
  id: string;
  claim_number: string;
  claim_amount: number;
  status: string;
  service_date: string;
  patients: {
    first_name: string;
    last_name: string;
    patient_number: string;
  } | null;
};

type RecentActivityItem = {
  id: string;
  action: string;
  description: string;
  created_at: string;
};

type DashboardStatProps = {
  label: string;
  value: string;
  description: string;
  Icon: LucideIcon;
  iconColor: string;
  iconBackground: string;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
};

const formatTimestamp = (date: string) => {
  return new Date(date).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
};

const statusStyles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600 ring-slate-200",
  submitted: "bg-blue-50 text-blue-700 ring-blue-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  denied: "bg-red-50 text-red-700 ring-red-200",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  pending: "Pending",
  approved: "Approved",
  denied: "Denied",
};

function DashboardStat({
  label,
  value,
  description,
  Icon,
  iconColor,
  iconBackground,
}: DashboardStatProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-[#142C43]">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBackground}`}
        >
          <Icon size={21} strokeWidth={1.8} className={iconColor} />
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        {description}
      </p>
    </div>
  );
}

function getActivityIcon(action: string): LucideIcon {
  switch (action.toLowerCase()) {
    case "created":
      return Plus;
    case "archived":
      return Archive;
    case "updated":
      return RefreshCw;
    case "approved":
      return CircleCheck;
    default:
      return Activity;
  }
}

export default async function DashboardPage() {
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

  const [
    patientCountResult,
    claimsCountResult,
    pendingClaimsResult,
    approvedClaimsResult,
    pendingAuthorizationsResult,
    recentClaimsResult,
    recentActivityResult,
  ] = await Promise.all([
    supabase
      .from("patients")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),

    supabase
      .from("claims")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("claims")
      .select("*", { count: "exact", head: true })
      .in("status", ["submitted", "pending"]),

    supabase
      .from("claims")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved"),

    supabase
      .from("authorizations")
      .select("*", { count: "exact", head: true })
      .in("status", ["submitted", "pending"]),

    supabase
      .from("claims")
      .select(`
        id,
        claim_number,
        claim_amount,
        status,
        service_date,
        patients (
          first_name,
          last_name,
          patient_number
        )
      `)
      .order("created_at", { ascending: false })
      .limit(5),

    supabase
      .from("activity_logs")
      .select("id, action, description, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const hasQueryError = [
    patientCountResult.error,
    claimsCountResult.error,
    pendingClaimsResult.error,
    approvedClaimsResult.error,
    pendingAuthorizationsResult.error,
    recentClaimsResult.error,
    recentActivityResult.error,
  ].some(Boolean);

  const patientCount = patientCountResult.count ?? 0;
  const claimsCount = claimsCountResult.count ?? 0;
  const pendingClaims = pendingClaimsResult.count ?? 0;
  const approvedClaims = approvedClaimsResult.count ?? 0;
  const pendingAuthorizations =
    pendingAuthorizationsResult.count ?? 0;

  const recentClaims =
    (recentClaimsResult.data ?? []) as unknown as RecentClaim[];

  const recentActivities =
    (recentActivityResult.data ?? []) as RecentActivityItem[];

  const canManagePatients = [
    "admin",
    "healthcare_staff",
  ].includes(profile.role);

  const canManageClaims = [
    "admin",
    "healthcare_staff",
    "claims_staff",
  ].includes(profile.role);

  return (
   <div className="flex min-h-screen flex-col bg-[#F5F7F9] md:flex-row">
      <Sidebar />

      <main className="w-full min-w-0 flex-1">
        <Header
          title="Dashboard"
          subtitle="Healthcare operations overview."
          fullName={profile.full_name}
          role={profile.role}
        />

        <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
          {/* Welcome section */}
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#167C80]" />
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#167C80]">
                  Operations overview
                </p>
              </div>

              <h2 className="text-xl font-bold tracking-tight text-[#142C43] sm:text-2xl">
                Welcome back, {profile.full_name}
              </h2>

              {/* <p className="mt-1 text-sm leading-relaxed text-slate-500">
                Here&apos;s the latest overview of your healthcare operations.
              </p> */}
            </div>
          </section>

          {/* Query warning */}
          {hasQueryError && (
            <div
              role="alert"
              className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
            >
              <Clock3 size={19} className="mt-0.5 shrink-0" />
              <p>
                Some dashboard information could not be loaded. Displayed
                figures or recent records may be incomplete. Please refresh
                the page or try again later.
              </p>
            </div>
          )}

          {/* Statistics */}
          <section>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[#142C43]">
                Key metrics
              </h3>

            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
              <DashboardStat
                label="Active Patients"
                value={String(patientCount)}
                description="Currently active patient records"
                Icon={Users}
                iconColor="text-[#167C80]"
                iconBackground="bg-[#E7F2F2]"
              />

              <DashboardStat
                label="Total Claims"
                value={String(claimsCount)}
                description={`${approvedClaims} approved claims`}
                Icon={FileText}
                iconColor="text-blue-700"
                iconBackground="bg-blue-50"
              />

              <DashboardStat
                label="Pending Claims"
                value={String(pendingClaims)}
                description="Submitted or awaiting payer decision"
                Icon={Clock3}
                iconColor="text-amber-700"
                iconBackground="bg-amber-50"
              />

              <DashboardStat
                label="Pending Authorizations"
                value={String(pendingAuthorizations)}
                description="Authorization requests awaiting a decision"
                Icon={ClipboardList}
                iconColor="text-violet-700"
                iconBackground="bg-violet-50"
              />
            </div>
          </section>

          {/* Recent records and activity */}
          <section className="grid grid-cols-1 items-start gap-6 2xl:grid-cols-3">
            {/* Recent claims */}
            <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm 2xl:col-span-2">
              <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-[#142C43]">
                    Recent Claims
                  </h3>
                </div>

                <Link
                  href="/claims"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#167C80] transition hover:text-[#11676B]"
                >
                  View all claims
                  <ArrowUpRight size={15} />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">Claim Number</th>
                      <th className="px-5 py-3.5">Patient</th>
                      <th className="px-5 py-3.5">Service Date</th>
                      <th className="px-5 py-3.5">Amount</th>
                      <th className="px-5 py-3.5">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {recentClaims.map((claim) => (
                      <tr
                        key={claim.id}
                        className="transition-colors hover:bg-slate-50/70"
                      >
                        <td className="whitespace-nowrap px-5 py-4">
                          <Link
                            href={`/claims/${claim.id}`}
                            className="font-semibold text-[#167C80] hover:text-[#11676B]"
                          >
                            {claim.claim_number}
                          </Link>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-[#172B3A]">
                            {claim.patients
                              ? `${claim.patients.first_name} ${claim.patients.last_name}`
                              : "Unknown Patient"}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {claim.patients?.patient_number ?? "N/A"}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {formatDate(claim.service_date)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-medium text-[#172B3A]">
                          {formatCurrency(Number(claim.claim_amount))}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${
                              statusStyles[claim.status] ??
                              "bg-slate-100 text-slate-600 ring-slate-200"
                            }`}
                          >
                            {statusLabels[claim.status] ?? claim.status}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {recentClaims.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-12 text-center"
                        >
                          <FileText
                            size={28}
                            className="mx-auto text-slate-300"
                          />
                          <p className="mt-3 text-sm font-medium text-slate-600">
                            No claims recorded yet
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            New claims will appear here.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent activity */}
            <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E7F2F2] text-[#167C80]">
                    <Activity size={17} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#142C43]">
                      Recent Activity
                    </h3>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {recentActivities.map((activity) => {
                  const ActivityIcon = getActivityIcon(activity.action);

                  return (
                    <div
                      key={activity.id}
                      className="flex gap-3 p-4 sm:p-5"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <ActivityIcon size={16} strokeWidth={1.8} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold capitalize text-[#172B3A]">
                          {activity.action.replaceAll("_", " ")}
                        </p>

                        <p className="mt-1 break-words text-sm leading-relaxed text-slate-600">
                          {activity.description}
                        </p>

                        <p className="mt-2 text-xs text-slate-400">
                          {formatTimestamp(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {recentActivities.length === 0 && (
                  <div className="px-5 py-12 text-center">
                    <Activity
                      size={26}
                      className="mx-auto text-slate-300"
                    />
                    <p className="mt-3 text-sm font-medium text-slate-600">
                      No recent activity
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Recorded activities will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Quick actions */}
          {(canManagePatients || canManageClaims) && (
            <section>
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-[#142C43]">
                  Quick actions
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Common tasks available to your account
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {canManagePatients && (
                  <Link
                    href="/patients/new"
                    className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#167C80]/40 hover:shadow-md"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E7F2F2] text-[#167C80] transition-colors group-hover:bg-[#167C80] group-hover:text-white">
                      <UserRoundPlus size={21} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-[#142C43]">
                        Register Patient
                      </h4>
                      <p className="mt-1 text-xs text-slate-500">
                        Create a new patient record.
                      </p>
                    </div>

                    <ArrowUpRight
                      size={18}
                      className="shrink-0 text-slate-400 transition-colors group-hover:text-[#167C80]"
                    />
                  </Link>
                )}

                {canManageClaims && (
                  <Link
                    href="/claims/new"
                    className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#167C80]/40 hover:shadow-md"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E7F2F2] text-[#167C80] transition-colors group-hover:bg-[#167C80] group-hover:text-white">
                      <Plus size={22} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-[#142C43]">
                        Create Claim
                      </h4>
                      <p className="mt-1 text-xs text-slate-500">
                        Create a new insurance claim.
                      </p>
                    </div>

                    <ArrowUpRight
                      size={18}
                      className="shrink-0 text-slate-400 transition-colors group-hover:text-[#167C80]"
                    />
                  </Link>
                )}
              </div>
            </section>
          )}

          <footer className="border-t border-slate-200 pt-4">
            <p className="text-xs leading-relaxed text-slate-400">
              Dashboard metrics are based on records currently accessible to
              your account.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
