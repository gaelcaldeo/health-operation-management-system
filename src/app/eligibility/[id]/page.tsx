
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Mail,
  MessageSquareText,
  Phone,
  ShieldCheck,
  UserRound,
  Users,
  XCircle,
  Clock3,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";

type EligibilityDetailsProps = {
  params: Promise<{
    id: string;
  }>;
};

const statusStyles: Record<string, string> = {
  eligible: "border-green-200 bg-green-50 text-green-700",
  ineligible: "border-red-200 bg-red-50 text-red-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
};

const statusIcons: Record<string, typeof CheckCircle2> = {
  eligible: CheckCircle2,
  ineligible: XCircle,
  pending: Clock3,
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

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-slate-400">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-[#172B3A]">
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
      <div className="flex items-start gap-3 border-b border-slate-100 pb-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E7F2F2] text-[#167C80]">
          <Icon size={18} />
        </div>

        <div>
          <h2 className="text-sm font-bold text-[#142C43]">{title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>
      </div>

      {children}
    </section>
  );
}

export default async function EligibilityDetailsPage({
  params,
}: EligibilityDetailsProps) {
  const { id } = await params;
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

  const { data: check, error } = await supabase
    .from("eligibility_checks")
    .select(`
      id,
      patient_id,
      insurance_policy_id,
      checked_by,
      check_date,
      status,
      response_details,
      notes,
      created_at,
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
        expiration_date,
        status
      )
    `)
    .eq("id", id)
    .single();

  if (error || !check) notFound();

  const patient = check.patients as unknown as {
    patient_number: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    phone: string | null;
    email: string | null;
  } | null;

  const policy = check.insurance_policies as unknown as {
    insurance_provider: string;
    policy_number: string;
    group_number: string | null;
    effective_date: string;
    expiration_date: string | null;
    status: string;
  } | null;

  let checkedByName = "Unknown User";

  if (check.checked_by) {
    const { data: checker } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", check.checked_by)
      .maybeSingle();

    if (checker) checkedByName = checker.full_name;
  }

  const StatusIcon = statusIcons[check.status] ?? Clock3;

  const statusLabel =
    check.status.charAt(0).toUpperCase() + check.status.slice(1);

  const patientName = patient
    ? `${patient.first_name} ${patient.last_name}`
    : "Unknown Patient";

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F7F9] md:flex-row">
      <Sidebar />

      <main className="w-full min-w-0 flex-1">
        <Header
          title="Eligibility Check Details"
          subtitle="Review insurance verification information and documentation."
          fullName={profile.full_name}
          role={profile.role}
        />

        <div className="mx-auto w-full max-w-[1200px] space-y-6 p-4 sm:p-6 lg:p-8">
          <Link
            href="/eligibility"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-[#167C80]"
          >
            <ArrowLeft size={16} />
            Back to Eligibility
          </Link>

          {/* Verification overview */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E7F2F2] text-[#167C80]">
                  <ClipboardCheck size={25} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#167C80]">
                    Verification Record
                  </p>

                  <h1 className="mt-1 break-words text-xl font-bold tracking-tight text-[#142C43] sm:text-2xl">
                    {patientName}
                  </h1>

                  <p className="mt-1.5 text-sm text-slate-500">
                    Patient Number:{" "}
                    <span className="font-semibold text-slate-700">
                      {patient?.patient_number ?? "N/A"}
                    </span>
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Verification date: {formatDate(check.check_date)}
                  </p>
                </div>
              </div>

              <div
                className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold ${
                  statusStyles[check.status] ??
                  "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                <StatusIcon size={16} />
                {statusLabel}
              </div>
            </div>

            <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium text-slate-400">
                  Insurance Provider
                </p>
                <p className="mt-1 text-sm font-semibold text-[#172B3A]">
                  {policy?.insurance_provider ?? "Unavailable"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">
                  Policy Number
                </p>
                <p className="mt-1 break-all text-sm font-semibold text-[#172B3A]">
                  {policy?.policy_number ?? "N/A"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">
                  Verified By
                </p>
                <p className="mt-1 text-sm font-semibold text-[#172B3A]">
                  {checkedByName}
                </p>
              </div>
            </div>
          </section>

          {/* Patient and insurance information */}
          <div className="grid gap-6 xl:grid-cols-2">
            <DetailSection
              title="Patient Information"
              description="Patient identification and contact details."
              icon={UserRound}
            >
              <dl className="grid gap-x-6 gap-y-5 pt-5 sm:grid-cols-2">
                <DetailItem
                  label="Patient Name"
                  value={patientName}
                />

                <DetailItem
                  label="Patient Number"
                  value={patient?.patient_number ?? "N/A"}
                />

                <DetailItem
                  label="Date of Birth"
                  value={formatDate(patient?.date_of_birth ?? null)}
                />

                <DetailItem
                  label="Phone Number"
                  value={patient?.phone || "Not provided"}
                />

                <DetailItem
                  label="Email Address"
                  value={patient?.email || "Not provided"}
                />
              </dl>

              <div className="mt-5 flex flex-wrap gap-4 border-t border-slate-100 pt-4">
                {patient?.phone && (
                  <a
                    href={`tel:${patient.phone}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#167C80] hover:text-[#11676B]"
                  >
                    <Phone size={14} />
                    Call patient
                  </a>
                )}

                {patient?.email && (
                  <a
                    href={`mailto:${patient.email}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#167C80] hover:text-[#11676B]"
                  >
                    <Mail size={14} />
                    Email patient
                  </a>
                )}
              </div>
            </DetailSection>

            <DetailSection
              title="Insurance Information"
              description="Policy information associated with this verification."
              icon={ShieldCheck}
            >
              <dl className="grid gap-x-6 gap-y-5 pt-5 sm:grid-cols-2">
                <DetailItem
                  label="Insurance Provider"
                  value={policy?.insurance_provider ?? "Unavailable"}
                />

                <DetailItem
                  label="Policy Number"
                  value={policy?.policy_number ?? "N/A"}
                />

                <DetailItem
                  label="Group Number"
                  value={policy?.group_number || "Not provided"}
                />

                <DetailItem
                  label="Policy Status"
                  value={
                    policy?.status
                      ? policy.status.charAt(0).toUpperCase() +
                        policy.status.slice(1)
                      : "Unavailable"
                  }
                />

                <DetailItem
                  label="Effective Date"
                  value={formatDate(policy?.effective_date ?? null)}
                />

                <DetailItem
                  label="Expiration Date"
                  value={formatDate(policy?.expiration_date ?? null)}
                />
              </dl>
            </DetailSection>
          </div>

          {/* Verification details */}
          <DetailSection
            title="Verification Details"
            description="Verification date, result, and staff attribution."
            icon={CalendarDays}
          >
            <dl className="grid gap-5 pt-5 sm:grid-cols-2">
              <DetailItem
                label="Verification Date"
                value={formatDate(check.check_date)}
              />

              <DetailItem
                label="Verified By"
                value={checkedByName}
              />
            </dl>
          </DetailSection>

          {/* Documentation */}
          <DetailSection
            title="Verification Documentation"
            description="Recorded response and internal notes."
            icon={FileText}
          >
            <div className="space-y-5 pt-5">
              <div>
                <div className="flex items-center gap-2">
                  <MessageSquareText
                    size={15}
                    className="text-[#167C80]"
                  />
                  <h3 className="text-sm font-semibold text-[#142C43]">
                    Verification Response
                  </h3>
                </div>

                <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                    {check.response_details ||
                      "No response details provided."}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-[#167C80]" />
                  <h3 className="text-sm font-semibold text-[#142C43]">
                    Internal Notes
                  </h3>
                </div>

                <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                    {check.notes || "No internal notes."}
                  </p>
                </div>
              </div>
            </div>
          </DetailSection>

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
