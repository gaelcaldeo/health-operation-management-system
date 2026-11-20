
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  UserRound,
  CalendarDays,
  Phone,
  Mail,
  FileText,
  Clock3,
  Activity,
  Plus,
  Archive,
  RefreshCw,
  CircleDot,
  UserRoundCheck,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import ArchivePatientButton from "./archive/ArchivePatientButton";

type PatientDetailsProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
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

const statusStyles: Record<string, string> = {
  active: "border-green-200 bg-green-50 text-green-700",
  inactive: "border-amber-200 bg-amber-50 text-amber-700",
  archived: "border-slate-200 bg-slate-100 text-slate-500",
};

function getActivityIcon(action: string) {
  switch (action) {
    case "created":
      return Plus;
    case "archived":
      return Archive;
    case "updated":
      return RefreshCw;
    default:
      return Activity;
  }
}

function DetailItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof UserRound;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        {Icon && (
          <Icon size={15} className="shrink-0 text-slate-400" />
        )}
        <p className="break-words text-sm font-semibold text-[#172B3A]">
          {value}
        </p>
      </div>
    </div>
  );
}

export default async function PatientDetailsPage({
  params,
}: PatientDetailsProps) {
  const { id } = await params;

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

  const canManagePatients = ["admin", "healthcare_staff"].includes(
    profile.role
  );

  const { data: patient, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !patient || patient.status === "archived") {
    notFound();
  }

  const { data: activityData } = await supabase
    .from("activity_logs")
    .select("id, action, description, created_at, user_id")
    .eq("entity_type", "patient")
    .eq("entity_id", id)
    .order("created_at", { ascending: false });

  const activities = await Promise.all(
    (activityData ?? []).map(async (activity) => {
      let fullName = "Unknown User";

      if (activity.user_id) {
        const { data: activityProfile, error: profileError } =
          await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", activity.user_id)
            .maybeSingle();

        if (!profileError && activityProfile) {
          fullName = activityProfile.full_name;
        }
      }

      return {
        ...activity,
        full_name: fullName,
      };
    })
  );

  const patientStatus =
    statusStyles[patient.status] ??
    "border-slate-200 bg-slate-100 text-slate-600";

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F7F9] md:flex-row">
      <Sidebar />

      <main className="w-full min-w-0 flex-1">
        <Header
          title="Patient Details"
          subtitle="View patient information and record activity."
          fullName={profile.full_name}
          role={profile.role}
        />

        <div className="mx-auto w-full max-w-[1200px] space-y-6 p-4 sm:p-6 lg:p-8">
          {/* Back navigation */}
          <Link
            href="/patients"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-[#167C80]"
          >
            <ArrowLeft size={16} />
            Back to Patients
          </Link>

          {/* Patient identity */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="h-1 bg-[#167C80]" />

            <div className="flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between lg:p-7">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#E7F2F2] text-[#167C80] sm:h-16 sm:w-16">
                  <UserRound size={28} strokeWidth={1.7} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Patient record
                  </p>

                  <h2 className="mt-1 break-words text-xl font-bold tracking-tight text-[#142C43] sm:text-2xl">
                    {patient.first_name} {patient.last_name}
                  </h2>

                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {patient.patient_number}
                  </p>

                  <span
                    className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${patientStatus}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {patient.status}
                  </span>
                </div>
              </div>

              {canManagePatients && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link
                    href={`/patients/${patient.id}/edit`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#167C80] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#11676B]"
                  >
                    <Pencil size={16} />
                    Edit Patient
                  </Link>

                  <ArchivePatientButton patientId={patient.id} />
                </div>
              )}
            </div>
          </section>

          {/* Personal information */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E7F2F2] text-[#167C80]">
                <UserRound size={18} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#142C43]">
                  Personal Information
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Patient identity and demographic details
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-7 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
              <DetailItem
                label="First Name"
                value={patient.first_name}
              />

              <DetailItem
                label="Last Name"
                value={patient.last_name}
              />

              <DetailItem
                label="Date of Birth"
                value={formatDate(patient.date_of_birth)}
                icon={CalendarDays}
              />

              <DetailItem
                label="Gender"
                value={patient.gender ?? "Not provided"}
                icon={UserRoundCheck}
              />

              <DetailItem
                label="Phone Number"
                value={patient.phone ?? "Not provided"}
                icon={Phone}
              />

              <DetailItem
                label="Email Address"
                value={patient.email ?? "Not provided"}
                icon={Mail}
              />
            </div>
          </section>

          {/* Record information */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E7F2F2] text-[#167C80]">
                <FileText size={18} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#142C43]">
                  Record Information
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Record creation and modification details
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-2 sm:p-6">
              <DetailItem
                label="Created At"
                value={formatDateTime(patient.created_at)}
                icon={CalendarDays}
              />

              <DetailItem
                label="Last Updated"
                value={formatDateTime(patient.updated_at)}
                icon={Clock3}
              />
            </div>
          </section>

          {/* Activity history */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E7F2F2] text-[#167C80]">
                <Activity size={18} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#142C43]">
                  Activity History
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Recorded actions associated with this patient
                </p>
              </div>

              <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                {activities.length}{" "}
                {activities.length === 1 ? "record" : "records"}
              </span>
            </div>

            <div className="p-5 sm:p-6">
              {activities.length > 0 ? (
                <div className="space-y-6">
                  {activities.map((activity, index) => {
                    const ActivityIcon = getActivityIcon(activity.action);

                    return (
                      <div key={activity.id} className="flex gap-4">
                        <div className="relative flex shrink-0 flex-col items-center">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D5E9E9] bg-[#E7F2F2] text-[#167C80]">
                            <ActivityIcon size={16} />
                          </div>

                          {index !== activities.length - 1 && (
                            <div className="mt-2 min-h-6 w-px flex-1 bg-slate-200" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 pb-1">
                          <p className="text-sm font-semibold leading-relaxed text-[#172B3A]">
                            {activity.description}
                          </p>

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                            <span className="font-medium">
                              {activity.full_name}
                            </span>
                            <CircleDot size={10} />
                            <span>
                              {formatDateTime(activity.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Activity size={22} />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-[#172B3A]">
                    No activity recorded
                  </p>

                  <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
                    Patient-related actions will appear here when activity is
                    recorded.
                  </p>
                </div>
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
