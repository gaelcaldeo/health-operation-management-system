
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  FileText,
  Hash,
  ShieldCheck,
  Save,
  X,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import { updateInsurancePolicy } from "./actions";

type EditPolicyProps = {
  params: Promise<{
    id: string;
  }>;
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

      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export default async function EditInsurancePolicyPage({
  params,
  searchParams,
}: EditPolicyProps) {
  const { id } = await params;
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

  if (!["admin", "healthcare_staff"].includes(profile.role)) {
    redirect(`/insurance/${id}`);
  }

  const { data: policy, error: policyError } = await supabase
    .from("insurance_policies")
    .select("*")
    .eq("id", id)
    .single();

  if (policyError || !policy) notFound();

  const updateAction = updateInsurancePolicy.bind(null, id);

  const errorMessages: Record<string, string> = {
    missing: "Please complete all required fields.",
    invalid_input: "One or more fields exceed the allowed length.",
    invalid_date:
      "Please enter valid dates. Expiration cannot be before the effective date.",
    invalid_status: "Please select a valid policy status.",
    duplicate: "This policy number already exists.",
    save_failed: "Unable to update the policy. Please try again.",
  };

  const errorMessage = queryError
    ? errorMessages[queryError] ??
      "Something went wrong. Please check your information and try again."
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F7F9] md:flex-row">
      <Sidebar />

      <main className="w-full min-w-0 flex-1">
        <Header
          title="Edit Insurance Policy"
          subtitle="Update insurance coverage and policy information."
          fullName={profile.full_name}
          role={profile.role}
        />

        <div className="mx-auto w-full max-w-[1000px] space-y-6 p-4 sm:p-6 lg:p-8">
          <Link
            href={`/insurance/${id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-[#167C80]"
          >
            <ArrowLeft size={16} />
            Back to Policy Details
          </Link>

          {/* Policy identity */}
          <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E7F2F2] text-[#167C80]">
              <ShieldCheck size={25} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#167C80]">
                Editing insurance record
              </p>
              <h1 className="mt-1 break-words text-lg font-bold text-[#142C43] sm:text-xl">
                {policy.insurance_provider}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Policy Number:{" "}
                <span className="font-semibold text-slate-700">
                  {policy.policy_number}
                </span>
              </p>
            </div>

            <div className="sm:ml-auto">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold capitalize text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {policy.status}
              </span>
            </div>
          </section>

          {/* Edit form */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
              <h2 className="text-base font-bold text-[#142C43]">
                Update Policy Information
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Modify the provider, policy details, coverage dates, or status.
              </p>
            </div>

            <form action={updateAction}>
              <div className="space-y-8 p-5 sm:p-7">
                {errorMessage && (
                  <div
                    role="alert"
                    className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                  >
                    <X size={18} className="mt-0.5 shrink-0" />
                    <p>{errorMessage}</p>
                  </div>
                )}

                <FormSection
                  title="Provider and Policy Details"
                  description="Review the insurance provider and identification numbers."
                  icon={Building2}
                >
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="insurance_provider"
                      className={labelStyles}
                    >
                      Insurance Provider *
                    </label>
                    <input
                      id="insurance_provider"
                      name="insurance_provider"
                      type="text"
                      required
                      maxLength={150}
                      defaultValue={policy.insurance_provider}
                      placeholder="Enter insurance provider"
                      className={inputStyles}
                    />
                  </div>

                  <div>
                    <label htmlFor="policy_number" className={labelStyles}>
                      Policy Number *
                    </label>
                    <input
                      id="policy_number"
                      name="policy_number"
                      type="text"
                      required
                      maxLength={100}
                      defaultValue={policy.policy_number}
                      placeholder="Enter policy number"
                      className={inputStyles}
                    />
                  </div>

                  <div>
                    <label htmlFor="group_number" className={labelStyles}>
                      Group Number
                    </label>
                    <input
                      id="group_number"
                      name="group_number"
                      type="text"
                      maxLength={100}
                      defaultValue={policy.group_number ?? ""}
                      placeholder="Optional group number"
                      className={inputStyles}
                    />
                  </div>
                </FormSection>

                <div className="border-t border-slate-100" />

                <FormSection
                  title="Coverage Period"
                  description="Update the policy's effective and expiration dates."
                  icon={CalendarDays}
                >
                  <div>
                    <label htmlFor="effective_date" className={labelStyles}>
                      Effective Date *
                    </label>
                    <input
                      id="effective_date"
                      name="effective_date"
                      type="date"
                      required
                      defaultValue={policy.effective_date}
                      className={inputStyles}
                    />
                  </div>

                  <div>
                    <label htmlFor="expiration_date" className={labelStyles}>
                      Expiration Date
                    </label>
                    <input
                      id="expiration_date"
                      name="expiration_date"
                      type="date"
                      defaultValue={policy.expiration_date ?? ""}
                      className={inputStyles}
                    />
                    <p className="mt-1.5 text-xs text-slate-400">
                      Leave blank if no expiration date is specified.
                    </p>
                  </div>
                </FormSection>

                <div className="border-t border-slate-100" />

                <FormSection
                  title="Policy Status"
                  description="Choose the current status of this insurance policy."
                  icon={FileText}
                >
                  <div className="sm:col-span-2">
                    <label htmlFor="status" className={labelStyles}>
                      Policy Status *
                    </label>
                    <select
                      id="status"
                      name="status"
                      required
                      defaultValue={policy.status}
                      className={inputStyles}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="terminated">Terminated</option>
                    </select>
                  </div>
                </FormSection>
              </div>

              {/* Form actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
                <Link
                  href={`/insurance/${id}`}
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
                  Save Changes
                </button>
              </div>
            </form>
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
