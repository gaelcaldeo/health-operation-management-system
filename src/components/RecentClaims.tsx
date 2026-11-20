
type ClaimStatus = "Draft" | "Submitted" | "Pending" | "Approved" | "Denied";

type Claim = {
  id: string;
  patient: string;
  amount: string;
  status: ClaimStatus;
};

type RecentClaimsProps = {
  claims: Claim[];
};

const statusStyles: Record<ClaimStatus, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Submitted: "bg-blue-50 text-blue-700",
  Pending: "bg-amber-50 text-amber-700",
  Approved: "bg-green-50 text-green-700",
  Denied: "bg-red-50 text-red-700",
};

export default function RecentClaims({ claims }: RecentClaimsProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h3 className="font-semibold text-slate-900">Recent Claims</h3>
        <p className="mt-1 text-xs text-slate-500">
          Latest claim activity
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Claim ID</th>
              <th className="px-5 py-3">Patient</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {claims.map((claim) => (
              <tr key={claim.id}>
                <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-800">
                  {claim.id}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                  {claim.patient}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                  {claim.amount}
                </td>
                <td className="whitespace-nowrap px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      statusStyles[claim.status]
                    }`}
                  >
                    {claim.status}
                  </span>
                </td>
              </tr>
            ))}

            {claims.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-8 text-center text-sm text-slate-500"
                >
                  No recent claims available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
