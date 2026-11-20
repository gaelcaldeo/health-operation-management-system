
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  UserRound,
  CalendarDays,
  Phone,
  Mail,
  Save,
  AlertCircle,
  FileText,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import { updatePatient } from "./actions";

type EditPatientPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
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

const inputStyles =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm text-[#172B3A] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#167C80] focus:ring-2 focus:ring-[#167C80]/10";

const labelStyles =
  "mb-2 block text-xs font-semibold text-slate-600";

export default async function EditPatientPage({
  params,
  searchParams,
}: EditPatientPageProps) {
  const { id } = await params;
  const queryParams = await searchParams;

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
    redirect(`/patients/${id}`);
  }

  const { data: patient, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !patient || patient.status === "archived") {
    notFound();
  }

  const errorMessages: Record<string, string> = {
    missing: "Please complete all required fields.",
    invalid_date: "Please enter a valid date of birth.",
    invalid_email: "Please enter a valid email address.",
    invalid_input: "One or more fields exceed the allowed length.",
    save_failed: "Unable to update the patient. Please try again.",
  };

  const errorMessage = queryParams.error
    ? errorMessages[queryParams.error] ??
      "Something went wrong. Please check your information and try again."
    : null;

  const updatePatientWithId = updatePatient.bind(null, id);

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F7F9] md:flex-row">
      <Sidebar />

      <main className="w-full min-w-0 flex-1">
        <Header
          title="Edit Patient"
          subtitle="Update patient information and contact details."
          fullName={profile.full_name}
          role={profile.role}
        />

        <div className="mx-auto w-full max-w-[1100px] space-y-6 p-4 sm:p-6 lg:p-8">
          {/* Back navigation */}
          <Link
            href={`/patients/${id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-[#167C80]"
          >
            <ArrowLeft size={16} />
            Back to Patient Details
          </Link>

          {/* Page introduction */}
          <section>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#167C80]" />
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#167C80]">
                Patient management
              </p>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-[#142C43] sm:text-2xl">
              Edit Patient Information
            </h2>

            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              Review and update the information associated with this patient.
            </p>
          </section>

          {/* Patient identification */}
          <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E7F2F2] text-[#167C80]">
                <UserRound size={20} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400">
                  Currently editing
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-[#142C43]">
                  {patient.first_name} {patient.last_name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start rounded-lg bg-slate-50 px-3 py-2 sm:self-center">
              <FileText size={14} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-600">
                {patient.patient_number}
              </span>
            </div>
          </section>

          {/* Edit form */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E7F2F2] text-[#167C80]">
                <Pencil size={19} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#142C43]">
                  Patient Information
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Fields marked with <span className="text-red-500">*</span>{" "}
                  are required.
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-6 lg:p-8">
              {errorMessage && (
                <div
                  role="alert"
                  className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p>{errorMessage}</p>
                </div>
              )}

              <form action={updatePatientWithId} className="space-y-8">
                {/* Personal details */}
                <section>
                  <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <UserRound size={17} className="text-[#167C80]" />
                    <h4 className="text-sm font-semibold text-[#142C43]">
                      Personal Details
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="first_name"
                        className={labelStyles}
                      >
                        First Name <span className="text-red-500">*</span>
                      </label>

                      <input
                        id="first_name"
                        name="first_name"
                        type="text"
                        defaultValue={patient.first_name}
                        required
                        maxLength={100}
                        autoComplete="given-name"
                        placeholder="Enter first name"
                        className={inputStyles}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="last_name"
                        className={labelStyles}
                      >
                        Last Name <span className="text-red-500">*</span>
                      </label>

                      <input
                        id="last_name"
                        name="last_name"
                        type="text"
                        defaultValue={patient.last_name}
                        required
                        maxLength={100}
                        autoComplete="family-name"
                        placeholder="Enter last name"
                        className={inputStyles}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="date_of_birth"
                        className={labelStyles}
                      >
                        Date of Birth <span className="text-red-500">*</span>
                      </label>

                      <div className="relative">
                        <CalendarDays
                          size={16}
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          id="date_of_birth"
                          name="date_of_birth"
                          type="date"
                          defaultValue={patient.date_of_birth}
                          max={getTodayInManila()}
                          required
                          className={`${inputStyles} pl-10`}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="gender"
                        className={labelStyles}
                      >
                        Gender
                      </label>

                      <select
                        id="gender"
                        name="gender"
                        defaultValue={patient.gender ?? ""}
                        className={inputStyles}
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">
                          Prefer not to say
                        </option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Contact details */}
                <section>
                  <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Phone size={17} className="text-[#167C80]" />
                    <h4 className="text-sm font-semibold text-[#142C43]">
                      Contact Information
                    </h4>
                    <span className="ml-auto text-[11px] text-slate-400">
                      Optional
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="phone"
                        className={labelStyles}
                      >
                        Phone Number
                      </label>

                      <div className="relative">
                        <Phone
                          size={16}
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          defaultValue={patient.phone ?? ""}
                          maxLength={30}
                          autoComplete="tel"
                          placeholder="Enter phone number"
                          className={`${inputStyles} pl-10`}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className={labelStyles}
                      >
                        Email Address
                      </label>

                      <div className="relative">
                        <Mail
                          size={16}
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          id="email"
                          name="email"
                          type="email"
                          defaultValue={patient.email ?? ""}
                          maxLength={254}
                          autoComplete="email"
                          placeholder="Enter email address"
                          className={`${inputStyles} pl-10`}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Form actions */}
                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                  <Link
                    href={`/patients/${id}`}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#142C43]"
                  >
                    Cancel
                  </Link>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#167C80] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#11676B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#167C80]"
                  >
                    <Save size={16} />
                    Save Changes
                  </button>
                </div>
              </form>
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
