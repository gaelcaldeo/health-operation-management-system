
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardCheck,
  FileText,
  MessageSquareText,
  Save,
  ShieldCheck,
  UserRound,
  X,
  AlertCircle,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import { createEligibilityCheck } from "./actions";

type NewEligibilityProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const inputStyles =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#172B3A] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#167C80] focus:ring-2 focus:ring-[#167C80]/10";

const labelStyles =
  "mb-1.5 block text-sm font-semibold text-slate-700";

function FormSection({
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
    <section>
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

      <div className="grid gap-5">{children}</div>
    </section>
  );
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

export default async function NewEligibilityPage({
  searchParams,
}: NewEligibilityProps) {
  const { error: queryError } = await searchParams;
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
    !["admin", "healthcare_staff", "authorization_staff"].includes(profile.role)
  ) {
    redirect("/eligibility");
  }

  const { data: policies, error: policiesError } = await supabase
    .from("insurance_policies")
    .select(`
      id,
      patient_id,
      insurance_provider,
      policy_number,
      status,
      patients (
        patient_number,
        first_name,
        last_name
      )
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const errorMessages: Record<string, string> = {
    missing: "Please complete all required fields.",
    invalid_date: "Please enter a valid verification date.",
    invalid_status: "Please select a valid verification result.",
    invalid_input: "One or more fields exceed the allowed length.",
    invalid_policy: "The selected insurance policy could not be found.",
    inactive_policy: "Only active insurance policies can be verified.",
    invalid_patient: "The patient associated with this policy is unavailable.",
    inactive_patient: "The patient associated with this policy is not active.",
    save_failed: "Unable to save the eligibility check. Please try again.",
  };

  const errorMessage = queryError
    ? errorMessages[queryError] ??
      "Something went wrong. Please check your information and try again."
    : null;

  const today = getTodayInManila();

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F7F9] md:flex-row">
      <Sidebar />

      <main className="w-full min-w-0 flex-1">
        <Header
          title="New Eligibility Check"
          subtitle="Record and document an insurance eligibility verification."
          fullName={profile.full_name}
          role={profile.role}
        />

        <div className="mx-auto w-full max-w-[1000px] space-y-6 p-4 sm:p-6 lg:p-8">
          <Link
            href="/eligibility"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-[#167C80]"
          >
            <ArrowLeft size={16} />
            Back to Eligibility
          </Link>

          {/* Form introduction */}
          <section className="flex flex-col items-start gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm min-[400px]:flex-row min-[400px]:items-center sm:p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E7F2F2] text-[#167C80]">
              <ShieldCheck size={25} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#167C80]">
                Insurance operations
              </p>
              <h1 className="mt-1 text-lg font-bold text-[#142C43] sm:text-xl">
                Verification Information
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                Select an active insurance policy and record its verification result.
              </p>
            </div>
          </section>

          {/* Form card */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
              <h2 className="text-base font-bold text-[#142C43]">
                Eligibility Verification Form
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Fields marked with * are required.
              </p>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="mx-5 mt-5 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:mx-7"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}

            {policiesError ? (
              <div className="p-6 sm:p-7">
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p>Unable to load insurance policies. Please try again.</p>
                </div>
              </div>
            ) : !policies || policies.length === 0 ? (
              <div className="p-6 sm:p-7">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      size={20}
                      className="mt-0.5 shrink-0 text-amber-700"
                    />

                    <div>
                      <h3 className="text-sm font-bold text-amber-900">
                        No active insurance policies found
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-amber-800">
                        Create an active insurance policy before recording an eligibility check.
                      </p>

                      <Link
                        href="/insurance/new"
                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#167C80] hover:text-[#11676B]"
                      >
                        Add Insurance Policy
                        <ArrowLeft size={15} className="rotate-180" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form action={createEligibilityCheck}>
                <div className="space-y-8 p-5 sm:p-7">
                  {/* Patient and policy */}
                  <FormSection
                    title="Patient and Insurance Policy"
                    description="Choose the active insurance policy associated with the patient."
                    icon={UserRound}
                  >
                    <div>
                      <label
                        htmlFor="insurance_policy_id"
                        className={labelStyles}
                      >
                        Patient / Insurance Policy *
                      </label>

                      <select
                        id="insurance_policy_id"
                        name="insurance_policy_id"
                        required
                        defaultValue=""
                        className={inputStyles}
                      >
                        <option value="" disabled>
                          Select a patient and insurance policy
                        </option>

                        {policies.map((policy) => {
                          const patient = policy.patients as unknown as {
                            patient_number: string;
                            first_name: string;
                            last_name: string;
                          } | null;

                          return (
                            <option key={policy.id} value={policy.id}>
                              {patient
                                ? `${patient.first_name} ${patient.last_name} (${patient.patient_number})`
                                : "Unknown Patient"}{" "}
                              — {policy.insurance_provider} —{" "}
                              {policy.policy_number}
                            </option>
                          );
                        })}
                      </select>

                      <p className="mt-1.5 text-xs text-slate-400">
                        Only active insurance policies are available for selection.
                      </p>
                    </div>
                  </FormSection>

                  <div className="border-t border-slate-100" />

                  {/* Verification details */}
                  <FormSection
                    title="Verification Details"
                    description="Record when the check was performed and its outcome."
                    icon={ClipboardCheck}
                  >
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="check_date"
                          className={labelStyles}
                        >
                          Verification Date *
                        </label>
                        <input
                          id="check_date"
                          name="check_date"
                          type="date"
                          required
                          max={today}
                          defaultValue={today}
                          className={inputStyles}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="status"
                          className={labelStyles}
                        >
                          Verification Result *
                        </label>
                        <select
                          id="status"
                          name="status"
                          required
                          defaultValue="pending"
                          className={inputStyles}
                        >
                          <option value="pending">Pending</option>
                          <option value="eligible">Eligible</option>
                          <option value="ineligible">Ineligible</option>
                        </select>
                      </div>
                    </div>
                  </FormSection>

                  <div className="border-t border-slate-100" />

                  {/* Documentation */}
                  <FormSection
                    title="Verification Documentation"
                    description="Capture the response received and any additional internal notes."
                    icon={MessageSquareText}
                  >
                    <div>
                      <label
                        htmlFor="response_details"
                        className={labelStyles}
                      >
                        Verification Response
                      </label>
                      <textarea
                        id="response_details"
                        name="response_details"
                        rows={4}
                        maxLength={5000}
                        placeholder="Example: Coverage confirmed for the requested service period."
                        className={`${inputStyles} min-h-24 resize-y`}
                      />
                      <p className="mt-1.5 text-xs text-slate-400">
                        Maximum 5,000 characters.
                      </p>
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
                        placeholder="Add any additional notes..."
                        className={`${inputStyles} min-h-24 resize-y`}
                      />
                      <p className="mt-1.5 text-xs text-slate-400">
                        Maximum 2,000 characters.
                      </p>
                    </div>
                  </FormSection>
                </div>

                {/* Form actions */}
                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
                  <Link
                    href="/eligibility"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    <X size={16} />
                    Cancel
                  </Link>

                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#167C80] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#11676B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#167C80] sm:w-auto"
                  >
                    <Save size={16} />
                    Save Verification
                  </button>
                </div>
              </form>
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
