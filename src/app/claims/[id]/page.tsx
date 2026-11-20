
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  FileText,
  Info,
  Save,
  ShieldCheck,
  UserRound,
  Wallet,
  XCircle,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import { updateClaim } from "./actions";

type ClaimDetailsProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    updated?: string;
  }>;
};

const allowedTransitions: Record<string, string[]> = {
  draft: ["submitted"],
  submitted: ["pending"],
  pending: ["approved", "denied"],
  approved: [],
  denied: [],
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

const inputStyles =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#172B3A] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#167C80] focus:ring-2 focus:ring-[#167C80]/10";

const labelStyles =
  "mb-1.5 block text-sm font-semibold text-slate-700";

function formatDate(date: string | null) {
  if (!date) return "Not specified";

  return new Date(date).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatCurrency(amount: number) {
  return Number(amount).toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  });
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1.5 break-words text-sm font-semibold text-[#172B3A]">
        {value}
      </dd>
    </div>
  );
}

function DetailSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E7F2F2] text-[#167C80]">
          <Icon size={18} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#142C43]">{title}</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

export default async function ClaimDetailsPage({
  params,
  searchParams,
}: ClaimDetailsProps) {
  const { id } = await params;
  const { error: errorCode, updated } = await searchParams;

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

  const { data: claimData, error } = await supabase
    .from("claims")
    .select(`
      id,
      patient_id,
      insurance_policy_id,
      created_by,
      claim_number,
      service_date,
      submission_date,
      decision_date,
      claim_amount,
      status,
      rejection_reason,
      notes,
      created_at,
      updated_at,
      patients (
        patient_number,
        first_name,
        last_name,
        date_of_birth
      ),
      insurance_policies (
        insurance_provider,
        policy_number,
        group_number,
        effective_date,
        expiration_date
      )
    `)
    .eq("id", id)
    .single();

  if (error || !claimData) notFound();

  const claim = claimData as unknown as {
    id: string;
    patient_id: string;
    insurance_policy_id: string;
    created_by: string | null;
    claim_number: string;
    service_date: string;
    submission_date: string | null;
    decision_date: string | null;
    claim_amount: number;
    status: string;
    rejection_reason: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    patients: {
      patient_number: string;
      first_name: string;
      last_name: string;
      date_of_birth: string;
    } | null;
    insurance_policies: {
      insurance_provider: string;
      policy_number: string;
      group_number: string | null;
      effective_date: string;
      expiration_date: string | null;
    } | null;
  };

  const canManage = [
    "admin",
    "healthcare_staff",
    "claims_staff",
  ].includes(profile.role);

  const nextStatuses = allowedTransitions[claim.status] ?? [];
  const canUpdateStatus = canManage && nextStatuses.length > 0;

  const errorMessages: Record<string, string> = {
    unauthorized: "You do not have permission to update claims.",
    invalid_status: "Please select a valid claim status.",
    invalid_date: "Please enter valid dates.",
    invalid_transition:
      "Invalid status transition. Please follow the claim processing workflow.",
    submission_date_required:
      "A submission date is required when submitting a claim.",
    denial_reason_required:
      "A denial reason is required for denied claims.",
    decision_date_required:
      "A decision date is required for approved or denied claims.",
    unexpected_denial_reason:
      "Clear the denial reason unless the claim is denied.",
    update_failed: "Unable to update the claim. Please try again.",
  };

  const patientName = claim.patients
    ? `${claim.patients.first_name} ${claim.patients.last_name}`
    : "Unavailable";

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F7F9] md:flex-row">
      <Sidebar />

      <main className="w-full min-w-0 flex-1">
        <Header
          title="Claim Details"
          subtitle="Review claim information and manage its processing workflow."
          fullName={profile.full_name}
          role={profile.role}
        />

        <div className="mx-auto w-full max-w-[1100px] space-y-6 p-4 sm:p-6 lg:p-8">
          <Link
            href="/claims"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-[#167C80]"
          >
            <ArrowLeft size={16} />
            Back to Claims
          </Link>

          {updated === "true" && (
            <div
              role="status"
              className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
            >
              <CheckCircle2 size={19} className="shrink-0" />
              Claim successfully updated.
            </div>
          )}

          {errorCode && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <AlertCircle size={19} className="mt-0.5 shrink-0" />
              <p>{errorMessages[errorCode] ?? "Something went wrong."}</p>
            </div>
          )}

          {/* Claim overview */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="p-5 sm:p-7">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E7F2F2] text-[#167C80]">
                    <ReceiptIcon />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Insurance Claim
                    </p>
                    <h1 className="mt-1 break-words text-xl font-bold tracking-tight text-[#142C43] sm:text-2xl">
                      {claim.claim_number}
                    </h1>
                    <p className="mt-1.5 text-sm text-slate-500">
                      {patientName}
                      {claim.patients?.patient_number
                        ? ` · ${claim.patients.patient_number}`
                        : ""}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    statusStyles[claim.status] ??
                    "border-slate-200 bg-slate-100 text-slate-700"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {statusLabels[claim.status] ?? claim.status}
                </span>
              </div>

              <div className="mt-7 grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Claim Amount
                  </p>
                  <p className="mt-1.5 text-2xl font-bold tracking-tight text-[#142C43]">
                    {formatCurrency(claim.claim_amount)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Service Date
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#172B3A]">
                    {formatDate(claim.service_date)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Record Created
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#172B3A]">
                    {formatDate(claim.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Patient and insurance */}
          <div className="grid gap-6 lg:grid-cols-2">
            <DetailSection
              title="Patient Information"
              description="Patient associated with this insurance claim."
              icon={UserRound}
            >
              <dl className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
                <DetailItem label="Patient Name" value={patientName} />
                <DetailItem
                  label="Patient Number"
                  value={claim.patients?.patient_number ?? "N/A"}
                />
                <DetailItem
                  label="Date of Birth"
                  value={formatDate(claim.patients?.date_of_birth ?? null)}
                />
              </dl>
            </DetailSection>

            <DetailSection
              title="Insurance Information"
              description="Policy associated with the claim."
              icon={ShieldCheck}
            >
              <dl className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
                <DetailItem
                  label="Insurance Provider"
                  value={
                    claim.insurance_policies?.insurance_provider ??
                    "Unavailable"
                  }
                />
                <DetailItem
                  label="Policy Number"
                  value={claim.insurance_policies?.policy_number ?? "N/A"}
                />
                <DetailItem
                  label="Group Number"
                  value={claim.insurance_policies?.group_number || "Not provided"}
                />
                <DetailItem
                  label="Effective Date"
                  value={formatDate(
                    claim.insurance_policies?.effective_date ?? null
                  )}
                />
                <DetailItem
                  label="Expiration Date"
                  value={formatDate(
                    claim.insurance_policies?.expiration_date ?? null
                  )}
                />
              </dl>
            </DetailSection>
          </div>

          {/* Processing information */}
          <DetailSection
            title="Claim Processing"
            description="Important dates and current processing information."
            icon={CalendarDays}
          >
            <dl className="grid gap-5 sm:grid-cols-3">
              <DetailItem
                label="Service Date"
                value={formatDate(claim.service_date)}
              />
              <DetailItem
                label="Submission Date"
                value={formatDate(claim.submission_date)}
              />
              <DetailItem
                label="Decision Date"
                value={formatDate(claim.decision_date)}
              />
            </dl>

            {claim.rejection_reason && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2">
                  <XCircle size={17} className="text-red-600" />
                  <h3 className="text-sm font-bold text-red-800">
                    Denial Reason
                  </h3>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-red-700">
                  {claim.rejection_reason}
                </p>
              </div>
            )}

            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="flex items-center gap-2">
                <FileText size={17} className="text-slate-400" />
                <h3 className="text-sm font-bold text-[#142C43]">
                  Internal Notes
                </h3>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {claim.notes || "No internal notes provided."}
              </p>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Last Updated"
                  value={formatDate(claim.updated_at)}
                />
                <DetailItem
                  label="Created By"
                  value={claim.created_by ? "Registered staff member" : "Not specified"}
                />
              </div>
            </div>
          </DetailSection>

          {/* Claim update workflow */}
          {canUpdateStatus && (
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5 sm:px-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E7F2F2] text-[#167C80]">
                    <ClipboardList size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#142C43]">
                      Update Claim
                    </h2>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                      Move this claim to its next permitted processing status.
                    </p>
                  </div>
                </div>
              </div>

              <form
                action={updateClaim.bind(null, claim.id)}
                className="space-y-6 p-5 sm:p-6"
              >
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Current Status
                  </p>
                  <p className="mt-1.5 text-sm font-bold text-[#142C43]">
                    {statusLabels[claim.status] ?? claim.status}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Next permitted step:{" "}
                    {nextStatuses.map((item) => statusLabels[item]).join(" or ")}
                  </p>
                </div>

                <div>
                  <label htmlFor="status" className={labelStyles}>
                    Next Claim Status *
                  </label>
                  <select
                    id="status"
                    name="status"
                    defaultValue=""
                    required
                    className={inputStyles}
                  >
                    <option value="" disabled>
                      Select next status
                    </option>
                    {nextStatuses.map((nextStatus) => (
                      <option key={nextStatus} value={nextStatus}>
                        {statusLabels[nextStatus]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="submission_date" className={labelStyles}>
                      Submission Date
                    </label>
                    <input
                      id="submission_date"
                      type="date"
                      name="submission_date"
                      defaultValue={claim.submission_date ?? ""}
                      className={inputStyles}
                    />
                  </div>

                  <div>
                    <label htmlFor="decision_date" className={labelStyles}>
                      Decision Date
                    </label>
                    <input
                      id="decision_date"
                      type="date"
                      name="decision_date"
                      defaultValue={claim.decision_date ?? ""}
                      className={inputStyles}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="rejection_reason" className={labelStyles}>
                    Denial Reason
                  </label>
                  <textarea
                    id="rejection_reason"
                    name="rejection_reason"
                    rows={3}
                    maxLength={2000}
                    defaultValue={claim.rejection_reason ?? ""}
                    placeholder="Required when the claim is denied."
                    className={`${inputStyles} resize-y`}
                  />
                </div>

                <div>
                  <label htmlFor="notes" className={labelStyles}>
                    Internal Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    maxLength={2000}
                    defaultValue={claim.notes ?? ""}
                    placeholder="Add processing notes..."
                    className={`${inputStyles} resize-y`}
                  />
                </div>

                <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs leading-relaxed text-blue-800">
                  <Info size={16} className="mt-0.5 shrink-0" />
                  <p>
                    Status changes must follow the claim workflow. A submission
                    date is required when submitting, and a decision date and
                    denial reason are required when denying a claim.
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <Link
                    href="/claims"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    <ArrowLeft size={16} />
                    Back to Claims
                  </Link>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#167C80] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#11676B]"
                  >
                    <Save size={16} />
                    Save Changes
                  </button>
                </div>
              </form>
            </section>
          )}

          {canManage && !canUpdateStatus && (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#142C43]">
                    Claim Finalized
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">
                    This claim has been {claim.status}. No further status
                    changes are allowed under the current processing workflow.
                  </p>
                </div>
              </div>
            </section>
          )}

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

function ReceiptIcon() {
  return <CircleDollarSign size={24} strokeWidth={1.8} />;
}
