
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  Archive,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileText,
  Filter,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    module?: string;
    action?: string;
  }>;
};

const modules = [
  { value: "patient", label: "Patients" },
  { value: "insurance_policy", label: "Insurance" },
  { value: "eligibility_check", label: "Eligibility" },
  { value: "claim", label: "Claims" },
  { value: "authorization", label: "Authorizations" },
];

const actions = [
  { value: "created", label: "Created" },
  { value: "updated", label: "Updated" },
  { value: "status_updated", label: "Status Updated" },
  { value: "archived", label: "Archived" },
];

function formatModule(value: string) {
  return (
    modules.find((item) => item.value === value)?.label ??
    value.replaceAll("_", " ")
  );
}

function formatAction(value: string) {
  return (
    actions.find((item) => item.value === value)?.label ??
    value.replaceAll("_", " ")
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  });
}

function getActionStyle(action: string) {
  switch (action) {
    case "created":
      return {
        icon: Plus,
        className: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      };
    case "updated":
      return {
        icon: RefreshCw,
        className: "bg-blue-50 text-blue-700 ring-blue-100",
      };
    case "status_updated":
      return {
        icon: CheckCircle2,
        className: "bg-teal-50 text-teal-700 ring-teal-100",
      };
    case "archived":
      return {
        icon: Archive,
        className: "bg-amber-50 text-amber-700 ring-amber-100",
      };
    default:
      return {
        icon: Activity,
        className: "bg-slate-100 text-slate-600 ring-slate-200",
      };
  }
}

export default async function ActivityPage({ searchParams }: PageProps) {
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

  const search = params.q?.trim() ?? "";

  const selectedModule = modules.some(
    (item) => item.value === params.module
  )
    ? params.module!
    : "";

  const selectedAction = actions.some(
    (item) => item.value === params.action
  )
    ? params.action!
    : "";

  let query = supabase
    .from("activity_logs")
    .select(
      "id, action, entity_type, entity_id, description, created_at, user_id"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (search) {
    query = query.ilike("description", `%${search}%`);
  }

  if (selectedModule) {
    query = query.eq("entity_type", selectedModule);
  }

  if (selectedAction) {
    query = query.eq("action", selectedAction);
  }

  const { data: activities, error } = await query;
  const activityRows = activities ?? [];

  return (
    <div className="min-h-screen bg-[#F5F7F9] lg:flex">
      <Sidebar />

      <main className="w-full min-w-0 flex-1">
        <Header
          title="Activity Logs"
          subtitle="Monitor recorded operations and changes across GAEL HOMS."
          fullName={profile.full_name}
          role={profile.role}
        />

        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          {/* Page heading */}
          <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E7F2F2] text-[#167C80]">
                  <ClipboardList size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-[#142C43] sm:text-xl">
                    System Activity
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Review the latest recorded system events.
                  </p>
                </div>
              </div>
            </div>


          </section>

          {/* Summary cards */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Matching Entries
                </p>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E7F2F2] text-[#167C80]">
                  <Activity size={18} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight text-[#142C43]">
                {activityRows.length}
              </p>

            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Display Limit
                </p>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <FileText size={18} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight text-[#142C43]">
                100
              </p>

            </div>
          </section>

          {/* Filters */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
              <Filter size={17} className="text-[#167C80]" />
              <div>
                <h3 className="text-sm font-semibold text-[#142C43]">
                  Filter Activity
                </h3>

              </div>
            </div>

            <form
              method="GET"
              className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 xl:grid-cols-4"
            >
              <div className="xl:col-span-1">
                <label
                  htmlFor="activity-search"
                  className="mb-1.5 block text-xs font-semibold text-slate-600"
                >
                  Search description
                </label>
                <div className="relative">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="activity-search"
                    type="text"
                    name="q"
                    defaultValue={search}
                    placeholder="Search activity..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-[#172B3A] outline-none transition placeholder:text-slate-400 focus:border-[#167C80] focus:ring-4 focus:ring-[#167C80]/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="activity-module"
                  className="mb-1.5 block text-xs font-semibold text-slate-600"
                >
                  Module
                </label>
                <select
                  id="activity-module"
                  name="module"
                  defaultValue={selectedModule}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#172B3A] outline-none transition focus:border-[#167C80] focus:ring-4 focus:ring-[#167C80]/10"
                >
                  <option value="">All modules</option>
                  {modules.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="activity-action"
                  className="mb-1.5 block text-xs font-semibold text-slate-600"
                >
                  Action
                </label>
                <select
                  id="activity-action"
                  name="action"
                  defaultValue={selectedAction}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#172B3A] outline-none transition focus:border-[#167C80] focus:ring-4 focus:ring-[#167C80]/10"
                >
                  <option value="">All actions</option>
                  {actions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#167C80] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#11676B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#167C80]"
                >
                  <Search size={15} />
                  Apply filters
                </button>

                <Link
                  href="/activity-logs"
                  aria-label="Reset activity filters"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-600 transition hover:bg-slate-50 hover:text-[#142C43]"
                >
                  <RotateCcw size={16} />
                </Link>
              </div>
            </form>
          </section>

          {/* Activity list */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
            <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#142C43]">
                  Recent Activity
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {activityRows.length} matching{" "}
                  {activityRows.length === 1 ? "entry" : "entries"}
                </p>
              </div>

              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                <Activity size={13} />
                Latest 100
              </span>
            </div>

            {error ? (
              <div className="flex flex-col items-center px-5 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <ClipboardList size={22} />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-800">
                  Unable to load activity logs
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Please refresh the page or try again later.
                </p>
              </div>
            ) : activityRows.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-14 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <ClipboardList size={22} />
                </div>
                <p className="mt-3 text-sm font-semibold text-[#142C43]">
                  No activity found
                </p>
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  No entries match your current filters. Try changing your
                  search or selecting a different module or action.
                </p>
                <Link
                  href="/activity-logs"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#167C80] hover:text-[#11676B]"
                >
                  Clear filters
                  <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activityRows.map((activity) => {
                  const actionStyle = getActionStyle(activity.action);
                  const ActionIcon = actionStyle.icon;

                  return (
                    <article
                      key={activity.id}
                      className="flex flex-col gap-4 px-5 py-5 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="flex min-w-0 gap-3.5">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${actionStyle.className}`}
                        >
                          <ActionIcon size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-[#E7F2F2] px-2.5 py-1 text-xs font-semibold text-[#11676B]">
                              {formatModule(activity.entity_type)}
                            </span>

                            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              {formatAction(activity.action)}
                            </span>
                          </div>

                          <p className="mt-2.5 break-words text-sm font-medium leading-relaxed text-[#172B3A]">
                            {activity.description}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                            <UserRound size={13} />
                            <span>
                              {activity.user_id === user.id
                                ? `By ${profile.full_name} (You)`
                                : activity.user_id
                                  ? "By another staff member"
                                  : "System or unattributed action"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <time
                        dateTime={activity.created_at}
                        className="shrink-0 pl-[54px] text-xs font-medium text-slate-500 sm:pl-0 sm:pt-1"
                      >
                        {formatDate(activity.created_at)}
                      </time>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <footer className="flex flex-col gap-1 border-t border-slate-200 pt-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>GAEL HOMS · Healthcare Operations Management System</span>
            <span>Activity history is displayed in read-only mode.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
