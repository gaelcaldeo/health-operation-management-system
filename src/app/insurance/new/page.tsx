
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  UserRound,
  Building2,
  FileText,
  CalendarDays,
  Save,
  AlertCircle,
  Users,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import { createInsurancePolicy } from "./actions";

type NewInsurancePageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm text-[#172B3A] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#167C80] focus:ring-2 focus:ring-[#167C80]/10";

const labelClass =
  "mb-2 block text-sm font-semibold text-slate-700";

export default async function NewInsurancePage({
  searchParams,
}: NewInsurancePageProps) {
  const params = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  if (!["admin", "healthcare_staff"].includes(profile.role)) {
    redirect("/insurance");
  }

  const { data: patients, error: patientsError } = await supabase
    .from("patients")
    .select("id, patient_number, first_name, last_name")
    .neq("status", "archived")
    .order("last_name", { ascending: true });

  const errorMessages: Record<string, string> = {
    missing: "Please complete all required fields.",
    invalid_date: "Please check your policy dates.",
    invalid_input: "One or more fields exceed the allowed length.",
    invalid_patient: "The selected patient is unavailable.",
    inactive_patient: "The selected patient is not active.",
    duplicate: "This policy number already exists.",
    save_failed: "Unable to save the policy. Please try again.",
  };

  const errorMessage = params.error
    ? errorMessages[params.error] ??
      "Something went wrong. Please check your information and try again."
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F7F9] md:flex-row">
      <Sidebar />

      <main className="w-full min-w-0 flex-1">
        <Header
          title="Add Insurance Policy"
          subtitle="Register insurance coverage for a patient."
          fullName={profile.full_name}
          role={profile.role}
        />

        <div className="mx-auto w-full max-w-[1100px] space-y-6 p-4 sm:p-6 lg:p-8">
          {/* Breadcrumb */}
          <Link
            href="/insurance"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-[#167C80]"
          >
            <ArrowLeft size={16} />
            Back to Insurance
          </Link>

          {/* Page introduction */}
          <section>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#167C80]" />
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#167C80]">
                Coverage administration
              </p>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-[#142C43] sm:text-2xl">
              Register Insurance Policy
            </h2>

            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              Add a patient's insurance provider and coverage information to
              their record.
            </p>
          </section>

          {/* Form card */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-7">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E7F2F2] text-[#167C80]">
                <ShieldCheck size={20} />
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#142C43]">
                  Insurance Information
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Enter the policy details below.
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              {errorMessage && (
                <div
                  role="alert"
                  className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p>{errorMessage}</p>
                </div>
              )}

              {patientsError ? (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p>Unable to load patients. Please try again.</p>
                </div>
              ) : !patients || patients.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex items-start gap-3">
                    <Users
                      size={20}
                      className="mt-0.5 shrink-0 text-amber-700"
                    />
                    <div>
                      <h4 className="text-sm font-semibold text-amber-900">
                        No active patients available
                      </h4>
                      <p className="mt-1 text-sm leading-relaxed text-amber-800">
                        Register a patient before creating an insurance policy.
                      </p>
                      <Link
                        href="/patients/new"
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-900 underline underline-offset-4 hover:text-amber-700"
                      >
                        Register Patient
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <form action={createInsurancePolicy} className="space-y-8">
                  {/* Patient selection */}
                  <div>
                    <div className="mb-4 flex items-center gap-2">
                      <UserRound size={17} className="text-[#167C80]" />
                      <h4 className="text-sm font-bold text-[#142C43]">
                        Patient Assignment
                      </h4>
                    </div>

                    <div>
                      <label htmlFor="patient_id" className={labelClass}>
                        Select Patient{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <select
                        id="patient_id"
                        name="patient_id"
                        required
                        defaultValue=""
                        className={inputClass}
                      >
                        <option value="" disabled>
                          Choose a patient
                        </option>

                        {patients.map((patient) => (
                          <option key={patient.id} value={patient.id}>
                            {patient.last_name}, {patient.first_name} (
                            {patient.patient_number})
                          </option>
                        ))}
                      </select>

                      <p className="mt-2 text-xs text-slate-400">
                        Only non-archived patients are available for selection.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100" />

                  {/* Provider details */}
                  <div>
                    <div className="mb-4 flex items-center gap-2">
                      <Building2 size={17} className="text-[#167C80]" />
                      <h4 className="text-sm font-bold text-[#142C43]">
                        Provider and Policy Details
                      </h4>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label
                          htmlFor="insurance_provider"
                          className={labelClass}
                        >
                          Insurance Provider{" "}
                          <span className="text-red-500">*</span>
                        </label>

                        <input
                          id="insurance_provider"
                          name="insurance_provider"
                          type="text"
                          required
                          maxLength={150}
                          placeholder="e.g. Blue Cross Blue Shield"
                          autoComplete="organization"
                          className={inputClass}
                        />
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="policy_number"
                            className={labelClass}
                          >
                            Policy Number{" "}
                            <span className="text-red-500">*</span>
                          </label>

                          <input
                            id="policy_number"
                            name="policy_number"
                            type="text"
                            required
                            maxLength={100}
                            placeholder="Enter policy number"
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="group_number"
                            className={labelClass}
                          >
                            Group Number
                          </label>

                          <input
                            id="group_number"
                            name="group_number"
                            type="text"
                            maxLength={100}
                            placeholder="Optional group number"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100" />

                  {/* Coverage dates */}
                  <div>
                    <div className="mb-4 flex items-center gap-2">
                      <CalendarDays size={17} className="text-[#167C80]" />
                      <h4 className="text-sm font-bold text-[#142C43]">
                        Coverage Period
                      </h4>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="effective_date"
                          className={labelClass}
                        >
                          Effective Date{" "}
                          <span className="text-red-500">*</span>
                        </label>

                        <input
                          id="effective_date"
                          name="effective_date"
                          type="date"
                          required
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="expiration_date"
                          className={labelClass}
                        >
                          Expiration Date
                        </label>

                        <input
                          id="expiration_date"
                          name="expiration_date"
                          type="date"
                          className={inputClass}
                        />
                        <p className="mt-2 text-xs text-slate-400">
                          Leave blank if no expiration date is specified.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Form actions */}
                  <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                    <Link
                      href="/insurance"
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#142C43]"
                    >
                      Cancel
                    </Link>

                    <button
                      type="submit"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#167C80] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#11676B] sm:w-auto"
                    >
                      <Save size={16} />
                      Save Insurance Policy
                    </button>
                  </div>
                </form>
              )}
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
