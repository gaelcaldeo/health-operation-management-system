
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

export async function createAuthorization(formData: FormData) {
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
    redirect("/authorizations?error=unauthorized");
  }

  const insurancePolicyId = String(
    formData.get("insurance_policy_id") ?? ""
  ).trim();

  const requestedService = String(
    formData.get("requested_service") ?? ""
  ).trim();

  const requestDate = String(
    formData.get("request_date") ?? ""
  ).trim();

  const status = String(
    formData.get("status") ?? "draft"
  ).trim();

  const notes = String(
    formData.get("notes") ?? ""
  ).trim();

  if (!isValidUuid(insurancePolicyId)) {
    redirect("/authorizations/new?error=invalid_policy");
  }

  if (!requestedService || !requestDate) {
    redirect("/authorizations/new?error=missing_fields");
  }

  if (!isValidDate(requestDate)) {
    redirect("/authorizations/new?error=invalid_date");
  }

  const today = new Date().toISOString().slice(0, 10);

  if (requestDate > today) {
    redirect("/authorizations/new?error=invalid_date");
  }

  if (!["draft", "submitted"].includes(status)) {
    redirect("/authorizations/new?error=invalid_status");
  }

  if (
    requestedService.length > 500 ||
    notes.length > 2000
  ) {
    redirect("/authorizations/new?error=invalid_input");
  }

  const { data: policy, error: policyError } = await supabase
    .from("insurance_policies")
    .select(
      "id, patient_id, status, effective_date, expiration_date, patients(status)"
    )
    .eq("id", insurancePolicyId)
    .maybeSingle();

  if (policyError || !policy) {
    redirect("/authorizations/new?error=invalid_policy");
  }

  if (policy.status !== "active") {
    redirect("/authorizations/new?error=inactive_policy");
  }

  const patient = policy.patients as unknown as {
    status: string;
  } | null;

  if (!patient || patient.status !== "active") {
    redirect("/authorizations/new?error=inactive_patient");
  }

  if (requestDate < policy.effective_date) {
    redirect("/authorizations/new?error=before_effective_date");
  }

  if (
    policy.expiration_date &&
    requestDate > policy.expiration_date
  ) {
    redirect("/authorizations/new?error=expired_policy");
  }

  const { error } = await supabase.from("authorizations").insert({
    patient_id: policy.patient_id,
    insurance_policy_id: policy.id,
    created_by: user.id,
    requested_service: requestedService,
    request_date: requestDate,
    status,
    notes: notes || null,
  });

  if (error) {
    console.error("Create authorization failed:", error);
    redirect("/authorizations/new?error=create_failed");
  }

  redirect("/authorizations?created=true");
}
