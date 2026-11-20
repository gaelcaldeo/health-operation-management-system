
type Activity = {
  id: number;
  description: string;
  time: string;
  user: string;
};

type RecentActivityProps = {
  activities: Activity[];
};

export default function RecentActivity({
  activities,
}: RecentActivityProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-slate-900">Recent Activity</h3>
      <p className="mt-1 text-xs text-slate-500">
        Latest actions across the system
      </p>

      <div className="mt-5 space-y-5">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-3">
            <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-teal-500" />

            <div>
              <p className="text-sm text-slate-700">
                {activity.description}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {activity.user} · {activity.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
