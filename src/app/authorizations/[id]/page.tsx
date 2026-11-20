
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ElementType, ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  Info,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import { updateAuthorization } from "./actions";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    updated?: string;
  }>;
};

type AuthorizationStatus =
  | "draft"
  | "submitted"
  | "pending"
  | "approved"
  | "denied";

type Authorization = {
  id: string;
  authorization_number: string | null;
  patient_id: string;
  insurance_policy_id: string;
  created_by: string | null;
  requested_service: string;
  request_date: string;
  decision_date: string | null;
  status: AuthorizationStatus;
  denial_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  patients: {
    patient_number: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    phone: string | null;
    email: string | null;
  } | null;
  insurance_policies: {
    insurance_provider: string;
    policy_number: string;
    group_number: string | null;
    effective_date: string;
    expiration_date: string | null;
  } | null;
};

const allowedTransitions: Record<
  AuthorizationStatus,
  AuthorizationStatus[]
> = {
  draft: ["submitted"],
  submitted: ["pending"],
  pending: ["approved", "denied"],
  approved: [],
  denied: [],
};

const statusLabels: Record<AuthorizationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  pending: "Pending",
  approved: "Approved",
  denied: "Denied",
};

const statusStyles: Record<AuthorizationStatus, string> = {
  draft: "border-slate-200 bg-slate-100 text-slate-700",
  submitted: "border-blue-200 bg-blue-50 text-blue-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-green-200 bg-green-50 text-green-700",
  denied: "border-red-200 bg-red-50 text-red-700",
};

const statusIcons: Record<AuthorizationStatus, ElementType> = {
  draft: FileText,
  submitted: ClipboardCheck,
  pending: Clock3,
  approved: CheckCircle2,
  denied: XCircle,
};

const errorMessages: Record<string, string> = {
  unauthorized: "You do not have permission to update this request.",
  invalid_status: "Please select a valid status.",
  invalid_transition:
    "Invalid status transition. Please follow the authorization workflow.",
  invalid_date: "Please enter a valid decision date.",
  decision_date_required:
    "A decision date is required for approved or denied requests.",
  denial_reason_required:
    "Please provide a reason for denying this request.",
  text_too_long: "Notes or denial reason exceed the allowed length.",
  update_failed: "Unable to update the authorization. Please try again.",
};

function formatDate(date: string | null) {
  if (!date) return "Not specified";

  return new Date(date).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getTodayInManila(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function DetailSection({
  icon: Icon,
  title,
  children,
}: {
  icon: ElementType;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E7F2F2] text-[#167C80]">
          <Icon size={18} strokeWidth={1.8} />
        </div>
        <h3 className="text-sm font-bold text-[#142C43]">{title}</h3>
      </div>

      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function DetailItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: ElementType;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="mt-1.5 flex items-start gap-2">
        {Icon && (
          <Icon
            size={15}
            className="mt-0.5 shrink-0 text-slate-400"
          />
        )}
        <p className="break-words text-sm font-semibold text-[#172B3A]">
          {value}
        </p>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#172B3A] outline-none transition placeholder:text-slate-400 focus:border-[#167C80] focus:ring-2 focus:ring-[#167C80]/10";

const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

export default async function AuthorizationDetailsPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const queryParams = await searchParams;

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

  const { data: authorizationData, error } = await supabase
    .from("authorizations")
    .select(`
      id,
      authorization_number,
      patient_id,
      insurance_policy_id,
      created_by,
      requested_service,
      request_date,
      decision_date,
      status,
      denial_reason,
      notes,
      created_at,
      updated_at,
      patients (
        patient_number,
        first_name,
        last_name,
        date_of_birth,
        phone,
        email
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

  if (error || !authorizationData) notFound();

  const authorization =
    authorizationData as unknown as Authorization;

  const canUpdate = [
    "admin",
    "healthcare_staff",
    "authorization_staff",
  ].includes(profile.role);

  const nextStatuses = allowedTransitions[authorization.status];
  const isFinalized = nextStatuses.length === 0;

  const errorMessage = queryParams.error
    ? errorMessages[queryParams.error] ??
      "Something went wrong. Please check your information and try again."
    : null;

  const today = getTodayInManila();
  const StatusIcon = statusIcons[authorization.status];

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F7F9] md:flex-row">
      <Sidebar />

      <main className="w-full min-w-0 flex-1">
        <Header
          title="Authorization Details"
          subtitle="Review and process the authorization request."
          fullName={profile.full_name}
          role={profile.role}
        />

        <div className="mx-auto w-full max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
          <Link
            href="/authorizations"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-[#167C80]"
          >
            <ArrowLeft size={16} />
            Back to Authorizations
          </Link>

          {/* Feedback messages */}
          {queryParams.updated === "true" && (
            <div
              role="status"
              className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
            >
              <CheckCircle2 size={18} className="shrink-0" />
              Authorization request updated successfully.
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <Info size={18} className="mt-0.5 shrink-0" />
              {errorMessage}
            </div>
          )}

          {/* Authorization overview */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="p-5 sm:p-7">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E7F2F2] text-[#167C80]">
                    <ClipboardCheck size={24} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Authorization Number
                    </p>
                    <h2 className="mt-1 break-all text-xl font-bold tracking-tight text-[#142C43] sm:text-2xl">
                      {authorization.authorization_number ?? "Pending"}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      Authorization request record
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
                    statusStyles[authorization.status]
                  }`}
                >
                  <StatusIcon size={15} />
                  {statusLabels[authorization.status]}
                </span>
              </div>

              <div className="mt-7 grid grid-cols-1 gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem
                  label="Requested Service"
                  value={authorization.requested_service}
                  icon={FileText}
                />

                <DetailItem
                  label="Request Date"
                  value={formatDate(authorization.request_date)}
                  icon={CalendarDays}
                />

                <DetailItem
                  label="Decision Date"
                  value={formatDate(authorization.decision_date)}
                  icon={Clock3}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:justify-between sm:px-7">
              <span>
                Created: {formatDateTime(authorization.created_at)}
              </span>
              <span>
                Last updated: {formatDateTime(authorization.updated_at)}
              </span>
            </div>
          </section>

          {/* Patient and insurance information */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <DetailSection icon={UserRound} title="Patient Information">
              {authorization.patients ? (
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <DetailItem
                      label="Patient Name"
                      value={`${authorization.patients.first_name} ${authorization.patients.last_name}`}
                      icon={UserRound}
                    />
                  </div>

                  <DetailItem
                    label="Patient Number"
                    value={authorization.patients.patient_number}
                  />

                  <DetailItem
                    label="Date of Birth"
                    value={formatDate(authorization.patients.date_of_birth)}
                    icon={CalendarDays}
                  />

                  <DetailItem
                    label="Phone"
                    value={authorization.patients.phone ?? "N/A"}
                    icon={Phone}
                  />

                  <DetailItem
                    label="Email"
                    value={authorization.patients.email ?? "N/A"}
                    icon={Mail}
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Patient information unavailable.
                </p>
              )}
            </DetailSection>

            <DetailSection icon={ShieldCheck} title="Insurance Information">
              {authorization.insurance_policies ? (
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <DetailItem
                      label="Insurance Provider"
                      value={
                        authorization.insurance_policies.insurance_provider
                      }
                      icon={ShieldCheck}
                    />
                  </div>

                  <DetailItem
                    label="Policy Number"
                    value={authorization.insurance_policies.policy_number}
                  />

                  <DetailItem
                    label="Group Number"
                    value={
                      authorization.insurance_policies.group_number ?? "N/A"
                    }
                  />

                  <DetailItem
                    label="Effective Date"
                    value={formatDate(
                      authorization.insurance_policies.effective_date
                    )}
                    icon={CalendarDays}
                  />

                  <DetailItem
                    label="Expiration Date"
                    value={formatDate(
                      authorization.insurance_policies.expiration_date
                    )}
                    icon={CalendarDays}
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Insurance information unavailable.
                </p>
              )}
            </DetailSection>
          </div>

          {/* Denial reason */}
          {authorization.status === "denied" && (
            <section className="overflow-hidden rounded-xl border border-red-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-red-100 bg-red-50 px-5 py-4 sm:px-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-red-600">
                  <XCircle size={19} />
                </div>
                <h3 className="text-sm font-bold text-red-800">
                  Denial Reason
                </h3>
              </div>

              <p className="whitespace-pre-wrap p-5 text-sm leading-relaxed text-slate-700 sm:p-6">
                {authorization.denial_reason ?? "No reason provided."}
              </p>
            </section>
          )}

          {/* Internal notes */}
          <DetailSection icon={FileText} title="Internal Notes">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
              {authorization.notes || "No internal notes available."}
            </p>
          </DetailSection>

          {/* Finalized state */}
          {isFinalized && (
            <section
              className={`rounded-xl border p-5 sm:p-6 ${
                authorization.status === "approved"
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-start gap-3">
                {authorization.status === "approved" ? (
                  <CheckCircle2
                    size={21}
                    className="mt-0.5 shrink-0 text-green-600"
                  />
                ) : (
                  <XCircle
                    size={21}
                    className="mt-0.5 shrink-0 text-red-600"
                  />
                )}

                <div>
                  <h3
                    className={`text-sm font-bold ${
                      authorization.status === "approved"
                        ? "text-green-800"
                        : "text-red-800"
                    }`}
                  >
                    Authorization Finalized
                  </h3>
                  <p
                    className={`mt-1 text-sm leading-relaxed ${
                      authorization.status === "approved"
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    This request has been {authorization.status}. No further
                    status changes are permitted.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Processing workflow */}
          {canUpdate && !isFinalized && (
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E7F2F2] text-[#167C80]">
                    <ClipboardCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#142C43]">
                      Process Authorization
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Update the request using the next valid workflow status.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="mb-6 rounded-lg border border-[#D7E8E8] bg-[#F0F7F7] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#167C80]">
                    Current Status
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
                        statusStyles[authorization.status]
                      }`}
                    >
                      <StatusIcon size={14} />
                      {statusLabels[authorization.status]}
                    </span>

                    <ArrowRight size={15} className="text-slate-400" />

                    <span className="text-xs font-medium text-slate-600">
                      {nextStatuses.map((status) => statusLabels[status]).join(" / ")}
                    </span>
                  </div>
                </div>

                <form
                  action={updateAuthorization.bind(null, authorization.id)}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="status" className={labelClass}>
                        Next Status{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <select
                        id="status"
                        name="status"
                        defaultValue=""
                        required
                        className={inputClass}
                      >
                        <option value="" disabled>
                          Select next status
                        </option>

                        {nextStatuses.map((status) => (
                          <option key={status} value={status}>
                            {statusLabels[status]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="decision_date" className={labelClass}>
                        Decision Date
                      </label>

                      <input
                        id="decision_date"
                        name="decision_date"
                        type="date"
                        min={authorization.request_date}
                        max={today}
                        defaultValue={authorization.decision_date ?? ""}
                        className={inputClass}
                      />
                      <p className="mt-2 text-xs text-slate-400">
                        Required when approving or denying.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="denial_reason" className={labelClass}>
                      Denial Reason
                    </label>

                    <textarea
                      id="denial_reason"
                      name="denial_reason"
                      rows={3}
                      maxLength={2000}
                      defaultValue={authorization.denial_reason ?? ""}
                      placeholder="Required when the request is denied."
                      className={`${inputClass} resize-y`}
                    />
                    <p className="mt-2 text-xs text-slate-400">
                      Maximum 2,000 characters.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="notes" className={labelClass}>
                      Internal Notes
                    </label>

                    <textarea
                      id="notes"
                      name="notes"
                      rows={4}
                      maxLength={2000}
                      defaultValue={authorization.notes ?? ""}
                      placeholder="Add processing notes..."
                      className={`${inputClass} resize-y`}
                    />
                    <p className="mt-2 text-xs text-slate-400">
                      Maximum 2,000 characters.
                    </p>
                  </div>

                  <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                    <Link
                      href="/authorizations"
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      Cancel
                    </Link>

                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#167C80] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#11676B]"
                    >
                      <CheckCircle2 size={17} />
                      Update Authorization
                    </button>
                  </div>
                </form>
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
