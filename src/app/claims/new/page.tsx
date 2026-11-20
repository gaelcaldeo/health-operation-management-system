
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  FileText,
  Receipt,
  Save,
  ShieldCheck,
  UserRound,
  Wallet,
  X,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import { createClaim } from "./actions";

type NewClaimPageProps = {
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

export default async function NewClaimPage({
  searchParams,
}: NewClaimPageProps) {
  const { error: errorCode } = await searchParams;
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

  if (!["admin", "healthcare_staff", "claims_staff"].includes(profile.role)) {
    redirect("/claims?error=unauthorized");
  }

  const { data: policies, error } = await supabase
    .from("insurance_policies")
    .select(`
      id,
      insurance_provider,
      policy_number,
      patient_id,
      patients (
        first_name,
        last_name,
        patient_number,
        status
      )
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const activePolicies = (policies ?? []).filter((policy) => {
    const patient = policy.patients as unknown as {
      status: string;
    } | null;

    return patient?.status === "active";
  });

  const errorMessages: Record<string, string> = {
    invalid: "Please complete all required fields with valid values.",
    invalid_date:
      "Please enter valid dates. The service and submission dates must be valid and in the correct order.",
    submission_date_required:
      "A submission date is required when the initial claim status is Submitted.",
    invalid_policy:
      "The selected insurance policy is unavailable or inactive.",
    invalid_patient:
      "The patient record is unavailable or archived.",
    expired_policy:
      "The selected policy does not cover the service date.",
    create_failed:
      "Unable to create the claim. Please try again.",
  };

  const errorMessage = errorCode
    ? errorMessages[errorCode] ??
      "Something went wrong. Please check your information and try again."
    : null;

  const today = getTodayInManila();

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F7F9] md:flex-row">
      <Sidebar />

        <main className="w-full min-w-0 flex-1">
        <Header
          title="Create Claim"
          subtitle="Register a new insurance claim and its billing information."
          fullName={profile.full_name}
          role={profile.role}
        />

        <div className="mx-auto w-full max-w-[1000px] space-y-6 p-4 sm:p-6 lg:p-8">
          <Link
            href="/claims"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-[#167C80]"
          >
            <ArrowLeft size={16} />
            Back to Claims
          </Link>

          {/* Form introduction */}
          <section className="flex flex-col items-start gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm min-[400px]:flex-row min-[400px]:items-center sm:p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E7F2F2] text-[#167C80]">
              <Receipt size={25} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#167C80]">
                Revenue cycle operations
              </p>
              <h1 className="mt-1 text-lg font-bold text-[#142C43] sm:text-xl">
                Claim Information
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                Enter the patient, service, and billing information for this claim.
              </p>
            </div>
          </section>

          {/* Main form */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
              <h2 className="text-base font-bold text-[#142C43]">
                New Claim Form
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

            {error ? (
              <div className="p-6 sm:p-7">
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p>Unable to load insurance policies. Please try again.</p>
                </div>
              </div>
            ) : activePolicies.length === 0 ? (
              <div className="p-6 sm:p-7">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      size={20}
                      className="mt-0.5 shrink-0 text-amber-700"
                    />

                    <div>
                      <h3 className="text-sm font-bold text-amber-900">
                        No eligible patient policies found
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-amber-800">
                        There are no active insurance policies linked to active patients. Add an active policy before creating a claim.
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
              <form action={createClaim}>
                <div className="space-y-8 p-5 sm:p-7">
                  {/* Patient and policy */}
                  <FormSection
                    title="Patient and Insurance"
                    description="Select the active patient insurance policy associated with this claim."
                    icon={UserRound}
                  >
                    <div>
                      <label
                        htmlFor="insurance_policy_id"
                        className={labelStyles}
                      >
                        Patient Insurance Policy *
                      </label>

                      <select
                        id="insurance_policy_id"
                        name="insurance_policy_id"
                        required
                        defaultValue=""
                        className={inputStyles}
                      >
                        <option value="" disabled>
                          Select a patient and policy
                        </option>

                        {activePolicies.map((policy) => {
                          const patient = policy.patients as unknown as {
                            first_name: string;
                            last_name: string;
                            patient_number: string;
                          } | null;

                          return (
                            <option key={policy.id} value={policy.id}>
                              {patient
                                ? `${patient.first_name} ${patient.last_name} (${patient.patient_number})`
                                : "Unknown Patient"}
                              {" — "}
                              {policy.insurance_provider} /{" "}
                              {policy.policy_number}
                            </option>
                          );
                        })}
                      </select>

                      <p className="mt-1.5 text-xs text-slate-400">
                        Only active policies linked to active patients are available.
                      </p>
                    </div>
                  </FormSection>

                  <div className="border-t border-slate-100" />

                  {/* Service and submission */}
                  <FormSection
                    title="Claim Dates"
                    description="Provide the date of service and, when applicable, the submission date."
                    icon={CalendarDays}
                  >
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="service_date"
                          className={labelStyles}
                        >
                          Service Date *
                        </label>
                        <input
                          id="service_date"
                          type="date"
                          name="service_date"
                          required
                          max={today}
                          className={inputStyles}
                        />
                        <p className="mt-1.5 text-xs text-slate-400">
                          Date the healthcare service was provided.
                        </p>
                      </div>

                      <div>
                        <label
                          htmlFor="submission_date"
                          className={labelStyles}
                        >
                          Submission Date
                        </label>
                        <input
                          id="submission_date"
                          type="date"
                          name="submission_date"
                          max={today}
                          className={inputStyles}
                        />
                        <p className="mt-1.5 text-xs text-slate-400">
                          Required when the initial status is Submitted.
                        </p>
                      </div>
                    </div>
                  </FormSection>

                  <div className="border-t border-slate-100" />

                  {/* Financial details */}
                  <FormSection
                    title="Billing Information"
                    description="Enter the monetary amount associated with this claim."
                    icon={Wallet}
                  >
                    <div>
                      <label
                        htmlFor="claim_amount"
                        className={labelStyles}
                      >
                        Claim Amount (₱) *
                      </label>

                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                          ₱
                        </span>
                        <input
                          id="claim_amount"
                          type="number"
                          name="claim_amount"
                          min="0"
                          max="9999999999.99"
                          step="0.01"
                          required
                          placeholder="0.00"
                          className={`${inputStyles} pl-8`}
                        />
                      </div>

                      <p className="mt-1.5 text-xs text-slate-400">
                        Enter the claim amount in Philippine pesos.
                      </p>
                    </div>
                  </FormSection>

                  <div className="border-t border-slate-100" />

                  {/* Initial status and notes */}
                  <FormSection
                    title="Claim Status and Notes"
                    description="Choose the initial claim status and document any additional information."
                    icon={ClipboardList}
                  >
                    <div>
                      <label htmlFor="status" className={labelStyles}>
                        Initial Status *
                      </label>

                      <select
                        id="status"
                        name="status"
                        defaultValue="draft"
                        required
                        className={inputStyles}
                      >
                        <option value="draft">Draft</option>
                        <option value="submitted">Submitted</option>
                      </select>

                      <p className="mt-1.5 text-xs text-slate-400">
                        Claims can initially be created as Draft or Submitted.
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
                        placeholder="Add additional claim information..."
                        className={`${inputStyles} min-h-24 resize-y`}
                      />

                      <p className="mt-1.5 text-xs text-slate-400">
                        Maximum 2,000 characters.
                      </p>
                    </div>
                  </FormSection>
                </div>

                {/* Actions */}
                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
                  <Link
                    href="/claims"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    <X size={16} />
                    Cancel
                  </Link>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#167C80] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#11676B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#167C80]"
                  >
                    <Save size={16} />
                    Create Claim
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
