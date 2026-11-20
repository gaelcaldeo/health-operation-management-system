
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Info,
  Plus,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import { createAuthorization } from "./actions";

type PageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

type InsurancePolicy = {
  id: string;
  insurance_provider: string;
  policy_number: string;
  effective_date: string;
  expiration_date: string | null;
  patients: {
    patient_number: string;
    first_name: string;
    last_name: string;
    status: string;
  } | null;
};

const errorMessages: Record<string, string> = {
  unauthorized: "You do not have permission to create requests.",
  missing_fields: "Please complete all required fields.",
  invalid_input: "One or more fields exceed the allowed length.",
  invalid_date: "Please provide a valid request date.",
  invalid_status: "Invalid initial request status.",
  invalid_policy: "The selected insurance policy could not be found.",
  inactive_policy: "The selected insurance policy is not active.",
  inactive_patient: "The selected patient is not active.",
  before_effective_date: "The request date is before the policy effective date.",
  expired_policy: "The selected policy has expired for the request date.",
  create_failed: "Unable to create the authorization request. Please try again.",
};

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

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#172B3A] outline-none transition placeholder:text-slate-400 focus:border-[#167C80] focus:ring-2 focus:ring-[#167C80]/10";

const labelClass =
  "mb-2 block text-sm font-semibold text-slate-700";

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E7F2F2] text-[#167C80]">
          <Icon size={19} strokeWidth={1.8} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#142C43]">{title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

export default async function NewAuthorizationPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

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

  if (
    !["admin", "healthcare_staff", "authorization_staff"].includes(
      profile.role
    )
  ) {
    redirect("/authorizations?error=unauthorized");
  }

  const { data, error } = await supabase
    .from("insurance_policies")
    .select(`
      id,
      insurance_provider,
      policy_number,
      effective_date,
      expiration_date,
      patients (
        patient_number,
        first_name,
        last_name,
        status
      )
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load insurance policies:", error);
  }

  const policies = (data ?? []) as unknown as InsurancePolicy[];

  const activePolicies = policies.filter(
    (policy) => policy.patients?.status === "active"
  );

  const errorMessage = params.error
    ? errorMessages[params.error] ??
      "Something went wrong. Please check your information and try again."
    : null;

  const today = getTodayInManila();

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F7F9] md:flex-row">
      <Sidebar />

      <main className="w-full min-w-0 flex-1">
        <Header
          title="New Authorization"
          subtitle="Create a prior authorization request."
          fullName={profile.full_name}
          role={profile.role}
        />

        <div className="mx-auto w-full max-w-[1100px] space-y-5 p-4 sm:p-6 lg:p-8">
          <Link
            href="/authorizations"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-[#167C80]"
          >
            <ArrowLeft size={16} />
            Back to Authorizations
          </Link>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            {/* Main form */}
            <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E7F2F2] text-[#167C80]">
                    <ClipboardCheck size={22} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#142C43]">
                      Authorization Request Information
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Complete the information below to create a request.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-7">
                {errorMessage && (
                  <div
                    role="alert"
                    className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                  >
                    <Info size={18} className="mt-0.5 shrink-0" />
                    <p>{errorMessage}</p>
                  </div>
                )}

                {error ? (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                  >
                    Unable to load insurance policies. Please refresh the page
                    or try again later.
                  </div>
                ) : activePolicies.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                    <div className="flex items-start gap-3">
                      <Info
                        size={20}
                        className="mt-0.5 shrink-0 text-amber-600"
                      />
                      <div>
                        <h3 className="text-sm font-bold text-amber-900">
                          No eligible insurance policies available
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-amber-800">
                          There are currently no active insurance policies
                          linked to active patients. Add an insurance policy
                          before creating an authorization request.
                        </p>
                        <Link
                          href="/insurance/new"
                          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#142C43] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1D3B56]"
                        >
                          <Plus size={16} />
                          Add Insurance Policy
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form action={createAuthorization} className="space-y-7">
                    {/* Patient and insurance */}
                    <FormSection
                      icon={UserRound}
                      title="Patient and Insurance"
                      description="Select the active patient and insurance policy associated with this request."
                    >
                      <div className="sm:col-span-2">
                        <label
                          htmlFor="insurance_policy_id"
                          className={labelClass}
                        >
                          Patient / Insurance Policy{" "}
                          <span className="text-red-500">*</span>
                        </label>

                        <select
                          id="insurance_policy_id"
                          name="insurance_policy_id"
                          required
                          defaultValue=""
                          className={inputClass}
                        >
                          <option value="" disabled>
                            Select patient and insurance
                          </option>

                          {activePolicies.map((policy) => (
                            <option key={policy.id} value={policy.id}>
                              {policy.patients?.first_name}{" "}
                              {policy.patients?.last_name} —{" "}
                              {policy.patients?.patient_number} |{" "}
                              {policy.insurance_provider} (
                              {policy.policy_number})
                            </option>
                          ))}
                        </select>

                        <p className="mt-2 text-xs text-slate-400">
                          Only active policies belonging to active patients
                          are displayed.
                        </p>
                      </div>
                    </FormSection>

                    <div className="border-t border-slate-100" />

                    {/* Service details */}
                    <FormSection
                      icon={FileText}
                      title="Requested Service"
                      description="Provide the medical service or procedure that requires prior authorization."
                    >
                      <div className="sm:col-span-2">
                        <label
                          htmlFor="requested_service"
                          className={labelClass}
                        >
                          Requested Service{" "}
                          <span className="text-red-500">*</span>
                        </label>

                        <input
                          id="requested_service"
                          name="requested_service"
                          type="text"
                          required
                          maxLength={500}
                          placeholder="e.g. MRI of lumbar spine"
                          className={inputClass}
                        />
                        <p className="mt-2 text-xs text-slate-400">
                          Maximum 500 characters.
                        </p>
                      </div>
                    </FormSection>

                    <div className="border-t border-slate-100" />

                    {/* Request details */}
                    <FormSection
                      icon={CalendarDays}
                      title="Request Details"
                      description="Set the request date and choose its initial processing status."
                    >
                      <div>
                        <label htmlFor="request_date" className={labelClass}>
                          Request Date{" "}
                          <span className="text-red-500">*</span>
                        </label>

                        <input
                          id="request_date"
                          name="request_date"
                          type="date"
                          required
                          max={today}
                          defaultValue={today}
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label htmlFor="status" className={labelClass}>
                          Initial Status{" "}
                          <span className="text-red-500">*</span>
                        </label>

                        <select
                          id="status"
                          name="status"
                          required
                          defaultValue="draft"
                          className={inputClass}
                        >
                          <option value="draft">Draft</option>
                          <option value="submitted">Submitted</option>
                        </select>
                      </div>
                    </FormSection>

                    <div className="border-t border-slate-100" />

                    {/* Notes */}
                    <section>
                      <div className="mb-4 flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                          <FileText size={19} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#142C43]">
                            Internal Notes
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            Add any additional information relevant to the
                            request.
                          </p>
                        </div>
                      </div>

                      <textarea
                        id="notes"
                        name="notes"
                        rows={4}
                        maxLength={2000}
                        placeholder="Add relevant request notes..."
                        className={`${inputClass} resize-y`}
                      />
                      <p className="mt-2 text-xs text-slate-400">
                        Optional · Maximum 2,000 characters.
                      </p>
                    </section>

                    {/* Form actions */}
                    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
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
                        <Plus size={17} />
                        Create Authorization
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </section>

            {/* Guidance panel */}
            <aside className="space-y-4">
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#167C80]" />
                  <h3 className="text-sm font-bold text-[#142C43]">
                    Request Guidelines
                  </h3>
                </div>

                <ul className="mt-4 space-y-4">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E7F2F2] text-xs font-bold text-[#167C80]">
                      1
                    </span>
                    <p className="text-xs leading-relaxed text-slate-600">
                      Select the correct active patient and insurance policy.
                    </p>
                  </li>

                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E7F2F2] text-xs font-bold text-[#167C80]">
                      2
                    </span>
                    <p className="text-xs leading-relaxed text-slate-600">
                      Enter a clear description of the requested medical
                      service.
                    </p>
                  </li>

                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E7F2F2] text-xs font-bold text-[#167C80]">
                      3
                    </span>
                    <p className="text-xs leading-relaxed text-slate-600">
                      Save as Draft if the request is not ready for submission.
                    </p>
                  </li>
                </ul>
              </section>

              <section className="rounded-xl border border-[#D7E8E8] bg-[#F0F7F7] p-5">
                <div className="flex items-center gap-2 text-[#167C80]">
                  <Info size={17} />
                  <h3 className="text-sm font-bold">Demo Environment</h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  GAEL HOMS is a fictional healthcare operations portfolio
                  application. Use demonstration records only. Do not enter
                  real patient or confidential medical information.
                </p>
              </section>
            </aside>
          </div>

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
