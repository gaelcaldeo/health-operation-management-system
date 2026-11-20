
import { redirect } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  ShieldCheck,
  Users,
  Wallet,
  XCircle,
  Clock3,
  ChartNoAxesCombined,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";

type Claim = {
  status: string;
  claim_amount: number | string;
  created_at: string;
};

type Eligibility = {
  status: string;
};

type Authorization = {
  status: string;
};

type MetricCardProps = {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(amount);

const monthLabel = (date: Date) =>
  date.toLocaleDateString("en-PH", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  iconClassName,
}: MetricCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 break-words text-2xl font-bold tracking-tight text-[#142C43]">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
        >
          <Icon size={19} />
        </div>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-slate-500">
        {description}
      </p>
    </div>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-bold tracking-tight text-[#142C43]">
        {title}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-slate-500">
        {description}
      </p>
    </div>
  );
}

function StatusProgress({
  label,
  count,
  percentage,
  color,
  textColor,
}: {
  label: string;
  count: number;
  percentage: number;
  color: string;
  textColor: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className={`shrink-0 font-medium ${textColor}`}>
          {count} <span className="text-slate-400">({percentage.toFixed(1)}%)</span>
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default async function ReportsPage() {
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
    patientsResult,
    claimsResult,
    eligibilityResult,
    authorizationsResult,
  ] = await Promise.all([
    supabase
      .from("patients")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("claims")
      .select("status, claim_amount, created_at"),

    supabase
      .from("eligibility_checks")
      .select("status"),

    supabase
      .from("authorizations")
      .select("status"),
  ]);

  const hasError =
    patientsResult.error ||
    claimsResult.error ||
    eligibilityResult.error ||
    authorizationsResult.error;

  if (hasError) {
    console.error("Reports data loading error:", {
      patients: patientsResult.error,
      claims: claimsResult.error,
      eligibility: eligibilityResult.error,
      authorizations: authorizationsResult.error,
    });
  }

  const totalPatients = patientsResult.count ?? 0;
  const claims = (claimsResult.data ?? []) as Claim[];
  const eligibility = (eligibilityResult.data ?? []) as Eligibility[];
  const authorizations =
    (authorizationsResult.data ?? []) as Authorization[];

  // Claims metrics
  const totalClaims = claims.length;

  const approvedClaims = claims.filter(
    (claim) => claim.status === "approved"
  );

  const deniedClaims = claims.filter(
    (claim) => claim.status === "denied"
  );

  const draftClaims = claims.filter(
    (claim) => claim.status === "draft"
  );

  const pendingClaims = claims.filter((claim) =>
    ["submitted", "pending"].includes(claim.status)
  );

  const totalClaimValue = claims.reduce(
    (total, claim) => total + Number(claim.claim_amount || 0),
    0
  );

  const approvedClaimValue = approvedClaims.reduce(
    (total, claim) => total + Number(claim.claim_amount || 0),
    0
  );

  const deniedClaimValue = deniedClaims.reduce(
    (total, claim) => total + Number(claim.claim_amount || 0),
    0
  );

  // Eligibility metrics
  const eligibleCount = eligibility.filter(
    (item) => item.status === "eligible"
  ).length;

  const ineligibleCount = eligibility.filter(
    (item) => item.status === "ineligible"
  ).length;

  const pendingEligibility = eligibility.filter(
    (item) => item.status === "pending"
  ).length;

  // Authorization metrics
  const approvedAuthorizations = authorizations.filter(
    (item) => item.status === "approved"
  ).length;

  const deniedAuthorizations = authorizations.filter(
    (item) => item.status === "denied"
  ).length;

  const draftAuthorizations = authorizations.filter(
    (item) => item.status === "draft"
  ).length;

  const pendingAuthorizations = authorizations.filter((item) =>
    ["submitted", "pending"].includes(item.status)
  ).length;

  // Six-month claims trend
  const now = new Date();

  const monthlyData = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - index), 1)
    );

    return {
      month: monthLabel(date),
      count: 0,
      value: 0,
    };
  });

  claims.forEach((claim) => {
    const date = new Date(claim.created_at);

    if (Number.isNaN(date.getTime())) return;

    const monthDifference =
      (now.getUTCFullYear() - date.getUTCFullYear()) * 12 +
      now.getUTCMonth() -
      date.getUTCMonth();

    if (monthDifference >= 0 && monthDifference < 6) {
      const index = 5 - monthDifference;
      monthlyData[index].count += 1;
      monthlyData[index].value += Number(claim.claim_amount || 0);
    }
  });

  const maxMonthlyClaims = Math.max(
    ...monthlyData.map((item) => item.count),
    1
  );

  const eligibilityTotal = eligibility.length || 1;
  const authorizationTotal = authorizations.length || 1;

  const claimsByStatus = [
    {
      label: "Approved",
      count: approvedClaims.length,
      color: "bg-emerald-500",
      textColor: "text-emerald-700",
    },
    {
      label: "Denied",
      count: deniedClaims.length,
      color: "bg-red-500",
      textColor: "text-red-700",
    },
    {
      label: "Pending",
      count: pendingClaims.length,
      color: "bg-amber-400",
      textColor: "text-amber-700",
    },
    {
      label: "Draft",
      count: draftClaims.length,
      color: "bg-slate-400",
      textColor: "text-slate-600",
    },
  ];

  const authorizationsByStatus = [
    {
      label: "Approved",
      count: approvedAuthorizations,
      color: "bg-emerald-500",
      textColor: "text-emerald-700",
    },
    {
      label: "Denied",
      count: deniedAuthorizations,
      color: "bg-red-500",
      textColor: "text-red-700",
    },
    {
      label: "Pending",
      count: pendingAuthorizations,
      color: "bg-amber-400",
      textColor: "text-amber-700",
    },
    {
      label: "Draft",
      count: draftAuthorizations,
      color: "bg-slate-400",
      textColor: "text-slate-600",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7F9] lg:flex">
      <Sidebar />

      <main className="w-full min-w-0 flex-1">
        <Header
          title="Reports & Analytics"
          subtitle="Monitor claims, eligibility, and authorization performance."
          fullName={profile.full_name}
          role={profile.role}
        />

        <div className="space-y-8 p-4 sm:p-6 lg:p-8">
          {hasError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={19} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Some report data could not be loaded.</p>
                <p className="mt-1 text-red-600">
                  Some figures may be incomplete. Check the server logs for details.
                </p>
              </div>
            </div>
          )}

          {/* Operational overview */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E7F2F2] text-[#167C80]">
                <ChartNoAxesCombined size={20} />
              </div>
              <SectionHeading
                title="Operational Overview"
                description="Summary of patient records and healthcare operations."
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <MetricCard
                label="Total Patients"
                value={String(totalPatients)}
                description="Accessible patient records"
                icon={Users}
                iconClassName="bg-blue-50 text-blue-700"
              />

              <MetricCard
                label="Total Claims"
                value={String(totalClaims)}
                description="All recorded claims"
                icon={FileText}
                iconClassName="bg-[#E7F2F2] text-[#167C80]"
              />

              <MetricCard
                label="Approved Claims"
                value={String(approvedClaims.length)}
                description="Successfully approved"
                icon={CheckCircle2}
                iconClassName="bg-emerald-50 text-emerald-700"
              />

              <MetricCard
                label="Pending Claims"
                value={String(pendingClaims.length)}
                description="Submitted or awaiting decision"
                icon={Clock3}
                iconClassName="bg-amber-50 text-amber-700"
              />

              <MetricCard
                label="Total Claim Value"
                value={formatCurrency(totalClaimValue)}
                description="All recorded claim amounts"
                icon={Wallet}
                iconClassName="bg-violet-50 text-violet-700"
              />
            </div>
          </section>

          {/* Claims overview */}
          <section className="space-y-4">
            <SectionHeading
              title="Claims Overview"
              description="Financial and processing performance across all accessible claims."
            />

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {/* Claims by status */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E7F2F2] text-[#167C80]">
                    <ClipboardCheck size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#142C43]">
                      Claims by Status
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Distribution of all recorded claims
                    </p>
                  </div>
                </div>

                <div className="mt-7 space-y-5">
                  {claimsByStatus.map((item) => {
                    const percentage =
                      totalClaims > 0
                        ? (item.count / totalClaims) * 100
                        : 0;

                    return (
                      <StatusProgress
                        key={item.label}
                        label={item.label}
                        count={item.count}
                        percentage={percentage}
                        color={item.color}
                        textColor={item.textColor}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Financial summary */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                    <Wallet size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#142C43]">
                      Claim Financial Summary
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Recorded claim amounts by approval outcome
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-500">
                      Total Claim Value
                    </p>
                    <p className="mt-2 break-words text-2xl font-bold tracking-tight text-[#142C43]">
                      {formatCurrency(totalClaimValue)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-700" />
                      <p className="text-xs font-semibold text-emerald-700">
                        Approved Claim Value
                      </p>
                    </div>
                    <p className="mt-2 break-words text-xl font-bold text-emerald-800">
                      {formatCurrency(approvedClaimValue)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-red-100 bg-red-50/70 p-4">
                    <div className="flex items-center gap-2">
                      <XCircle size={15} className="text-red-700" />
                      <p className="text-xs font-semibold text-red-700">
                        Denied Claim Value
                      </p>
                    </div>
                    <p className="mt-2 break-words text-xl font-bold text-red-800">
                      {formatCurrency(deniedClaimValue)}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-slate-500">
                  Total value includes claims in all statuses, including drafts.
                </p>
              </div>
            </div>
          </section>

          {/* Monthly claims activity */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E7F2F2] text-[#167C80]">
                <Activity size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#142C43]">
                  Monthly Claims Activity
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Number of claims created in the last six calendar months
                </p>
              </div>
            </div>

            <div className="mt-7 flex h-64 items-end justify-around gap-2 border-b border-slate-200 pb-2 sm:gap-4">
              {monthlyData.map((item) => {
                const barHeight =
                  item.count === 0
                    ? 2
                    : Math.max(
                        (item.count / maxMonthlyClaims) * 100,
                        5
                      );

                return (
                  <div
                    key={item.month}
                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="text-xs font-semibold tabular-nums text-slate-600">
                      {item.count}
                    </span>

                    <div className="flex h-44 w-full items-end justify-center">
                      <div
                        className="w-full max-w-14 rounded-t-lg bg-[#167C80] transition-all hover:bg-[#11676B]"
                        style={{ height: `${barHeight}%` }}
                        title={`${item.count} claims`}
                      />
                    </div>

                    <span className="text-center text-[11px] font-medium text-slate-500 sm:text-xs">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Eligibility and authorization */}
          <section className="space-y-4">
            <SectionHeading
              title="Eligibility & Authorization Performance"
              description="Verification outcomes and prior authorization decisions."
            />

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {/* Eligibility */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#142C43]">
                      Eligibility Verification
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {eligibility.length} total verification records
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Eligible
                    </div>
                    <span className="font-bold tabular-nums text-emerald-700">
                      {eligibleCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      Ineligible
                    </div>
                    <span className="font-bold tabular-nums text-red-700">
                      {ineligibleCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      Pending
                    </div>
                    <span className="font-bold tabular-nums text-amber-700">
                      {pendingEligibility}
                    </span>
                  </div>

                  <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="bg-emerald-500"
                      style={{
                        width: `${(eligibleCount / eligibilityTotal) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-red-500"
                      style={{
                        width: `${(ineligibleCount / eligibilityTotal) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-amber-400"
                      style={{
                        width: `${(pendingEligibility / eligibilityTotal) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Authorizations */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E7F2F2] text-[#167C80]">
                    <ClipboardCheck size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#142C43]">
                      Prior Authorization
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {authorizations.length} total authorization requests
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  {authorizationsByStatus.map((item) => {
                    const percentage =
                      authorizations.length > 0
                        ? (item.count / authorizationTotal) * 100
                        : 0;

                    return (
                      <StatusProgress
                        key={item.label}
                        label={item.label}
                        count={item.count}
                        percentage={percentage}
                        color={item.color}
                        textColor={item.textColor}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Report disclaimer */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <AlertCircle size={17} className="mt-0.5 shrink-0 text-slate-400" />
            <p className="text-xs leading-relaxed text-slate-500">
              Reports reflect records accessible to the signed-in account.
              Claim values represent recorded amounts, not actual reimbursements
              or payments.
            </p>
          </div>

          <footer className="flex flex-col gap-1 border-t border-slate-200 pt-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>GAEL HOMS · Healthcare Operations Management System</span>
            <span>Reports & Analytics</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
