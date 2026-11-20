
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type AuthorizationStatus =
  | "draft"
  | "submitted"
  | "pending"
  | "approved"
  | "denied";

const validStatuses: AuthorizationStatus[] = [
  "draft",
  "submitted",
  "pending",
  "approved",
  "denied",
];

const allowedTransitions: Record<
  AuthorizationStatus,
  AuthorizationStatus[]
> = {
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

export async function updateAuthorization(
  id: string,
  formData: FormData
) {
  if (!isValidUuid(id)) {
    redirect("/authorizations");
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
    !["admin", "healthcare_staff", "authorization_staff"].includes(
      profile.role
    )
  ) {
    redirect(`/authorizations/${id}?error=unauthorized`);
  }

  const status = String(
    formData.get("status") ?? ""
  ) as AuthorizationStatus;

  const decisionDate = String(
    formData.get("decision_date") ?? ""
  ).trim();

  const denialReason = String(
    formData.get("denial_reason") ?? ""
  ).trim();

  const notes = String(
    formData.get("notes") ?? ""
  ).trim();

  if (!validStatuses.includes(status)) {
    redirect(`/authorizations/${id}?error=invalid_status`);
  }

  if (decisionDate && !isValidDate(decisionDate)) {
    redirect(`/authorizations/${id}?error=invalid_date`);
  }

  if (denialReason.length > 2000 || notes.length > 2000) {
    redirect(`/authorizations/${id}?error=text_too_long`);
  }

  const today = getTodayInManila();

  if (decisionDate && decisionDate > today) {
    redirect(`/authorizations/${id}?error=invalid_date`);
  }

  const { data: existing, error: existingError } = await supabase
    .from("authorizations")
    .select("id, status, request_date")
    .eq("id", id)
    .maybeSingle();

  if (existingError || !existing) {
    redirect("/authorizations");
  }

  if (!validStatuses.includes(existing.status as AuthorizationStatus)) {
    redirect(`/authorizations/${id}?error=invalid_transition`);
  }

  const currentStatus = existing.status as AuthorizationStatus;

  if (!allowedTransitions[currentStatus].includes(status)) {
    redirect(`/authorizations/${id}?error=invalid_transition`);
  }

  const isFinalDecision = ["approved", "denied"].includes(status);

  if (isFinalDecision && !decisionDate) {
    redirect(`/authorizations/${id}?error=decision_date_required`);
  }

  if (
    isFinalDecision &&
    decisionDate < existing.request_date
  ) {
    redirect(`/authorizations/${id}?error=invalid_date`);
  }

  if (status === "denied" && !denialReason) {
    redirect(`/authorizations/${id}?error=denial_reason_required`);
  }

  const { data: updated, error: updateError } = await supabase
    .from("authorizations")
    .update({
      status,
      decision_date: isFinalDecision ? decisionDate : null,
      denial_reason: status === "denied" ? denialReason : null,
      notes: notes || null,
    })
    .eq("id", id)
    .eq("status", currentStatus)
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error("Update authorization failed:", updateError);
    redirect(`/authorizations/${id}?error=update_failed`);
  }

  if (!updated) {
    redirect(`/authorizations/${id}?error=invalid_transition`);
  }

  redirect(`/authorizations/${id}?updated=true`);
}
