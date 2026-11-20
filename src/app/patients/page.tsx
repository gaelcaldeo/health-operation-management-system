
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Search,
  RotateCcw,
  UserRoundPlus,
  Users,
  CalendarDays,
  Phone,
  UserRound,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";

type Patient = {
  id: string;
  patient_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string | null;
  phone: string | null;
  status: "active" | "inactive" | "archived";
};

type PatientsPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    created?: string;
  }>;
};

const statusStyles: Record<Patient["status"], string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  inactive: "bg-amber-50 text-amber-700 ring-amber-200",
  archived: "bg-slate-100 text-slate-500 ring-slate-200",
};

const formatDate = (date: string) => {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default async function PatientsPage({
  searchParams,
}: PatientsPageProps) {
  const params = await searchParams;

  const search = (params.q ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .slice(0, 100);

  const statusFilter = ["active", "inactive"].includes(params.status ?? "")
    ? params.status
    : "all";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

    let query = supabase
    .from("patients")
    .select(
      "id, patient_number, first_name, last_name, date_of_birth, gender, phone, status"
    )
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(
      `patient_number.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
    );
  }

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const [
    { data: profile },
    { data: patients, error },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single(),
    query,
  ]);

  if (!profile) {
    redirect("/login");
  }

  const canManagePatients = ["admin", "healthcare_staff"].includes(
    profile.role
  );

  const hasFilters = Boolean(search) || statusFilter !== "all";

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F7F9] md:flex-row">
      <Sidebar />

      <main className="w-full min-w-0 flex-1">
        <Header
          title="Patients"
          subtitle="Manage and review patient records."
          fullName={profile.full_name ?? "GAEL HOMS User"}
          role={profile.role}
        />

        <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
          {/* Page introduction */}
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#167C80]" />
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#167C80]">
                  Patient management
                </p>
              </div>

              <h2 className="text-xl font-bold tracking-tight text-[#142C43] sm:text-2xl">
                Patient Directory
              </h2>


            </div>

            {canManagePatients && (
              <Link
                href="/patients/new"
                className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-[#167C80] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#11676B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#167C80] sm:w-auto"
              >
                <UserRoundPlus size={17} />
                Add Patient
              </Link>
            )}
          </section>

          {/* Patient directory */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Search and filters */}
            <div className="border-b border-slate-100 p-4 sm:p-5 lg:p-6">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-[#142C43]">
                  Find patient records
                </h3>

              </div>

              <form
                action="/patients"
                method="GET"
                className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_180px] lg:grid-cols-[minmax(0,1fr)_200px_auto] lg:items-end"
              >
                <div className="min-w-0">
                  <label
                    htmlFor="q"
                    className="mb-2 block text-xs font-semibold text-slate-600"
                  >
                    Search
                  </label>

                  <div className="relative">
                    <Search
                      size={17}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="q"
                      name="q"
                      type="search"
                      maxLength={100}
                      defaultValue={search}
                      placeholder="Name or patient number..."
                      className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-[#172B3A] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#167C80] focus:ring-2 focus:ring-[#167C80]/10"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="status"
                    className="mb-2 block text-xs font-semibold text-slate-600"
                  >
                    Patient Status
                  </label>

                  <select
                    id="status"
                    name="status"
                    defaultValue={statusFilter}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm text-[#172B3A] outline-none transition hover:border-slate-300 focus:border-[#167C80] focus:ring-2 focus:ring-[#167C80]/10"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex gap-2 lg:pb-0">
                  <button
                    type="submit"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#167C80] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#11676B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#167C80] lg:flex-none"
                  >
                    <Search size={16} />
                    Search
                  </button>

                  <Link
                    href="/patients"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#142C43] lg:flex-none"
                  >
                    <RotateCcw size={15} />
                    Reset
                  </Link>
                </div>
              </form>
            </div>

            {/* Results summary */}
            <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex items-center gap-2">
                <Users size={17} className="text-[#167C80]" />
                <p className="text-sm font-semibold text-[#142C43]">
                  {error
                    ? "Patient records unavailable"
                    : `${patients?.length ?? 0} patient records`}
                </p>
              </div>

              {!error && (
                <p className="text-xs text-slate-400">
                  {hasFilters
                    ? "Filtered results"
                    : "Showing all non-archived records"}
                </p>
              )}
            </div>

            {/* Creation confirmation */}
            {params.created === "true" && (
              <div
                role="status"
                className="mx-4 mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700 sm:mx-5"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                  ✓
                </span>
                Patient record created successfully.
              </div>
            )}

            {/* Error state */}
            {error ? (
              <div
                role="alert"
                className="px-5 py-12 text-center"
              >
                <Users size={30} className="mx-auto text-red-300" />
                <p className="mt-3 text-sm font-semibold text-red-700">
                  Unable to load patient records
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Please refresh the page or try again later.
                </p>
              </div>
            ) : patients && patients.length > 0 ? (
              /* Patient table */
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Patient</th>
                      <th className="px-5 py-4">Patient Number</th>
                      <th className="px-5 py-4">Date of Birth</th>
                      <th className="px-5 py-4">Gender</th>
                      <th className="px-5 py-4">Phone</th>
                      <th className="px-5 py-4">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {patients.map((patient: Patient) => (
                      <tr
                        key={patient.id}
                        className="transition-colors hover:bg-slate-50/70"
                      >
                        <td className="whitespace-nowrap px-5 py-4">
                          <Link
                            href={`/patients/${patient.id}`}
                            className="font-semibold text-[#172B3A] transition-colors hover:text-[#167C80]"
                          >
                            {patient.first_name} {patient.last_name}
                          </Link>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-600">
                          {patient.patient_number}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          <span className="inline-flex items-center gap-2">
                            <CalendarDays
                              size={15}
                              className="text-slate-400"
                            />
                            {formatDate(patient.date_of_birth)}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {patient.gender ?? "—"}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {patient.phone ? (
                            <span className="inline-flex items-center gap-2">
                              <Phone
                                size={14}
                                className="text-slate-400"
                              />
                              {patient.phone}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${statusStyles[patient.status]}`}
                          >
                            {patient.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Empty state */
              <div className="px-5 py-14 text-center sm:py-16">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#E7F2F2] text-[#167C80]">
                  {hasFilters ? (
                    <Search size={23} />
                  ) : (
                    <UserRound size={23} />
                  )}
                </div>

                <h4 className="mt-4 text-sm font-semibold text-[#142C43]">
                  {hasFilters
                    ? "No matching patients found"
                    : "No patients registered yet"}
                </h4>

                <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-slate-500">
                  {hasFilters
                    ? "Try adjusting your search term or changing the status filter."
                    : "Patient records will appear here once they have been registered."}
                </p>

                {canManagePatients && !hasFilters && (
                  <Link
                    href="/patients/new"
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#167C80] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#11676B]"
                  >
                    <UserRoundPlus size={16} />
                    Register First Patient
                  </Link>
                )}
              </div>
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
