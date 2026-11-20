
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  ShieldCheck,
  FileText,
  CalendarDays,
  UserRound,
  Phone,
  Mail,
  Pencil,
  Building2,
  Clock3,
  Hash,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";

type InsuranceDetailsProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: string | null) {
  if (!date) return "Not specified";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(date: string | null) {
  if (!date) return "Not available";

  return new Date(date).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const statusStyles: Record<string, string> = {
  active: "border-green-200 bg-green-50 text-green-700",
  inactive: "border-slate-200 bg-slate-100 text-slate-600",
  terminated: "border-red-200 bg-red-50 text-red-700",
};

function DetailItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-2 text-xs font-medium text-slate-500">
        {Icon && <Icon size={14} className="shrink-0 text-slate-400" />}
        {label}
      </dt>
      <dd className="mt-1.5 break-words text-sm font-semibold text-[#172B3A]">
        {value}
      </dd>
    </div>
  );
}

export default async function InsuranceDetailsPage({
  params,
}: InsuranceDetailsProps) {
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

  const { data: policy, error } = await supabase
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
      created_at,
      updated_at,
      patients (
        patient_number,
        first_name,
        last_name,
        date_of_birth,
        phone,
        email
      )
    `)
    .eq("id", id)
    .single();

  if (error || !policy) notFound();

  const patient = policy.patients as unknown as {
    patient_number: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    phone: string | null;
    email: string | null;
  } | null;

  const canManage = ["admin", "healthcare_staff"].includes(profile.role);

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F7F9] md:flex-row">
      <Sidebar />

      <main className="w-full min-w-0 flex-1">
        <Header
          title="Insurance Policy Details"
          subtitle="Review policy coverage and associated patient information."
          fullName={profile.full_name}
          role={profile.role}
        />

        <div className="mx-auto w-full max-w-[1200px] space-y-6 p-4 sm:p-6 lg:p-8">
          {/* Breadcrumb */}
          <Link
            href="/insurance"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-[#167C80]"
          >
            <ArrowLeft size={16} />
            Back to Insurance
          </Link>

          {/* Policy summary */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5 sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E7F2F2] text-[#167C80]">
                    <ShieldCheck size={25} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#167C80]">
                      Insurance coverage
                    </p>

                    <h1 className="mt-1 break-words text-xl font-bold tracking-tight text-[#142C43] sm:text-2xl">
                      {policy.insurance_provider}
                    </h1>

                    <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                      <FileText size={15} className="shrink-0" />
                      Policy Number:
                      <span className="font-semibold text-slate-700">
                        {policy.policy_number}
                      </span>
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${
                    statusStyles[policy.status] ??
                    statusStyles.inactive
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {policy.status}
                </span>
              </div>
            </div>

            <div className="grid gap-5 bg-slate-50/70 p-5 sm:grid-cols-3 sm:px-7">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Effective Date
                </p>
                <p className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-[#172B3A]">
                  <CalendarDays size={15} className="text-[#167C80]" />
                  {formatDate(policy.effective_date)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500">
                  Expiration Date
                </p>
                <p className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-[#172B3A]">
                  <CalendarDays size={15} className="text-[#167C80]" />
                  {formatDate(policy.expiration_date)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500">
                  Group Number
                </p>
                <p className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-[#172B3A]">
                  <Hash size={15} className="text-[#167C80]" />
                  {policy.group_number || "Not provided"}
                </p>
              </div>
            </div>

            {canManage && (
              <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
                <Link
                  href={`/insurance/${policy.id}/edit`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#167C80] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#11676B] sm:w-auto"
                >
                  <Pencil size={15} />
                  Edit Policy
                </Link>
              </div>
            )}
          </section>

          {/* Details */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Policy information */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E7F2F2] text-[#167C80]">
                  <Building2 size={18} />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-[#142C43]">
                    Policy Information
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Insurance provider and coverage details
                  </p>
                </div>
              </div>

              <dl className="grid gap-x-6 gap-y-6 p-5 sm:grid-cols-2 sm:p-6">
                <DetailItem
                  label="Insurance Provider"
                  value={policy.insurance_provider}
                  icon={Building2}
                />

                <DetailItem
                  label="Policy Number"
                  value={policy.policy_number}
                  icon={FileText}
                />

                <DetailItem
                  label="Group Number"
                  value={policy.group_number || "Not provided"}
                  icon={Hash}
                />

                <DetailItem
                  label="Policy Status"
                  value={policy.status}
                  icon={ShieldCheck}
                />

                <DetailItem
                  label="Effective Date"
                  value={formatDate(policy.effective_date)}
                  icon={CalendarDays}
                />

                <DetailItem
                  label="Expiration Date"
                  value={formatDate(policy.expiration_date)}
                  icon={CalendarDays}
                />
              </dl>
            </section>

            {/* Patient information */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E7F2F2] text-[#167C80]">
                  <UserRound size={18} />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-[#142C43]">
                    Patient Information
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Patient associated with this policy
                  </p>
                </div>
              </div>

              {patient ? (
                <div className="p-5 sm:p-6">
                  <div className="mb-6 flex items-center gap-3 rounded-lg bg-slate-50 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E7F2F2] text-[#167C80]">
                      <UserRound size={20} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#142C43]">
                        {patient.first_name} {patient.last_name}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-slate-500">
                        {patient.patient_number}
                      </p>
                    </div>
                  </div>

                  <dl className="grid gap-x-6 gap-y-6 sm:grid-cols-2">
                    <DetailItem
                      label="Patient Name"
                      value={`${patient.first_name} ${patient.last_name}`}
                      icon={UserRound}
                    />

                    <DetailItem
                      label="Patient Number"
                      value={patient.patient_number}
                      icon={Hash}
                    />

                    <DetailItem
                      label="Date of Birth"
                      value={formatDate(patient.date_of_birth)}
                      icon={CalendarDays}
                    />

                    <DetailItem
                      label="Phone"
                      value={patient.phone || "Not provided"}
                      icon={Phone}
                    />

                    <div className="sm:col-span-2">
                      <DetailItem
                        label="Email Address"
                        value={patient.email || "Not provided"}
                        icon={Mail}
                      />
                    </div>
                  </dl>
                </div>
              ) : (
                <div className="p-6">
                  <p className="text-sm text-slate-500">
                    Patient information is unavailable.
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Record metadata */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Clock3 size={17} className="text-[#167C80]" />
              <h2 className="text-sm font-bold text-[#142C43]">
                Record Information
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <DetailItem
                label="Date Created"
                value={formatDateTime(policy.created_at)}
                icon={CalendarDays}
              />

              <DetailItem
                label="Last Updated"
                value={formatDateTime(policy.updated_at)}
                icon={Clock3}
              />
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
