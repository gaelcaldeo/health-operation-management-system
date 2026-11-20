
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ClaimStatus =
  | "draft"
  | "submitted"
  | "pending"
  | "approved"
  | "denied";

const validStatuses: ClaimStatus[] = [
  "draft",
  "submitted",
  "pending",
  "approved",
  "denied",
];

const allowedTransitions: Record<ClaimStatus, ClaimStatus[]> = {
  draft: ["submitted"],
  submitted: ["pending"],
  pending: ["approved", "denied"],
  approved: [],
  denied: [],
};

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
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

export async function updateClaim(
  id: string,
  formData: FormData
) {
  if (!isValidUuid(id)) {
    redirect("/claims");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    !["admin", "healthcare_staff", "claims_staff"].includes(profile.role)
  ) {
    redirect(`/claims/${id}?error=unauthorized`);
  }

  const status = String(
    formData.get("status") ?? ""
  ) as ClaimStatus;

  const submissionDate = String(
    formData.get("submission_date") ?? ""
  ).trim();

  const decisionDate = String(
    formData.get("decision_date") ?? ""
  ).trim();

  const rejectionReason = String(
    formData.get("rejection_reason") ?? ""
  ).trim();

  const notes = String(
    formData.get("notes") ?? ""
  ).trim();

  if (!validStatuses.includes(status)) {
    redirect(`/claims/${id}?error=invalid_status`);
  }

  if (
    (submissionDate && !isValidDate(submissionDate)) ||
    (decisionDate && !isValidDate(decisionDate))
  ) {
    redirect(`/claims/${id}?error=invalid_date`);
  }

  if (
    rejectionReason.length > 2000 ||
    notes.length > 2000
  ) {
    redirect(`/claims/${id}?error=invalid_input`);
  }

  const today = getTodayInManila();

  if (
    (submissionDate && submissionDate > today) ||
    (decisionDate && decisionDate > today)
  ) {
    redirect(`/claims/${id}?error=invalid_date`);
  }

  const { data: existingClaim, error: existingError } = await supabase
    .from("claims")
    .select("id, status, service_date, submission_date")
    .eq("id", id)
    .maybeSingle();

  if (existingError || !existingClaim) {
    redirect("/claims");
  }

  const currentStatus = existingClaim.status as ClaimStatus;

  if (!allowedTransitions[currentStatus]?.includes(status)) {
    redirect(`/claims/${id}?error=invalid_transition`);
  }

  const effectiveSubmissionDate =
    submissionDate || existingClaim.submission_date || "";

  if (
    ["submitted", "pending", "approved", "denied"].includes(status) &&
    !effectiveSubmissionDate
  ) {
    redirect(`/claims/${id}?error=submission_date_required`);
  }

  if (
    effectiveSubmissionDate &&
    (
      !isValidDate(effectiveSubmissionDate) ||
      effectiveSubmissionDate < existingClaim.service_date ||
      effectiveSubmissionDate > today
    )
  ) {
    redirect(`/claims/${id}?error=invalid_date`);
  }

  if (
    ["approved", "denied"].includes(status) &&
    !decisionDate
  ) {
    redirect(`/claims/${id}?error=decision_date_required`);
  }

  if (
    ["approved", "denied"].includes(status) &&
    decisionDate < effectiveSubmissionDate
  ) {
    redirect(`/claims/${id}?error=invalid_date`);
  }

  if (status === "denied" && !rejectionReason) {
    redirect(`/claims/${id}?error=denial_reason_required`);
  }

  const { data: updatedClaim, error } = await supabase
    .from("claims")
    .update({
      status,
      submission_date: effectiveSubmissionDate || null,
      decision_date: ["approved", "denied"].includes(status)
        ? decisionDate
        : null,
      rejection_reason: status === "denied"
        ? rejectionReason
        : null,
      notes: notes || null,
    })
    .eq("id", id)
    .eq("status", currentStatus)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Update claim failed:", error);
    redirect(`/claims/${id}?error=update_failed`);
  }

  if (!updatedClaim) {
    redirect(`/claims/${id}?error=invalid_transition`);
  }

  redirect(`/claims/${id}?updated=true`);
}
