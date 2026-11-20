
"use client";

import { archivePatient } from "./actions";

type ArchivePatientButtonProps = {
  patientId: string;
};

export default function ArchivePatientButton({
  patientId,
}: ArchivePatientButtonProps) {
  const archiveAction = archivePatient.bind(null, patientId);

  return (
    <form
      action={archiveAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          "Are you sure you want to archive this patient? The record will be retained but removed from the regular patient directory."
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-lg border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
      >
        Archive Patient
      </button>
    </form>
  );
}
