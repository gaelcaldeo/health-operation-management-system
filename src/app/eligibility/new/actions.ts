
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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

export async function createEligibilityCheck(formData: FormData) {
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
    !["admin", "healthcare_staff", "authorization_staff"].includes(profile.role)
  ) {
    redirect("/eligibility?error=unauthorized");
  }

  const policyId = String(
    formData.get("insurance_policy_id") ?? ""
  ).trim();

  const checkDate = String(
    formData.get("check_date") ?? ""
  ).trim();

  const status = String(
    formData.get("status") ?? ""
  ).trim();

  const responseDetails = String(
    formData.get("response_details") ?? ""
  ).trim();

  const notes = String(
    formData.get("notes") ?? ""
  ).trim();

  if (!isValidUuid(policyId)) {
    redirect("/eligibility/new?error=invalid_policy");
  }

  if (!isValidDate(checkDate)) {
    redirect("/eligibility/new?error=invalid_date");
  }

  const today = new Date().toISOString().slice(0, 10);

  if (checkDate > today) {
    redirect("/eligibility/new?error=invalid_date");
  }

  if (!["eligible", "ineligible", "pending"].includes(status)) {
    redirect("/eligibility/new?error=invalid_status");
  }

  if (
    responseDetails.length > 5000 ||
    notes.length > 2000
  ) {
    redirect("/eligibility/new?error=invalid_input");
  }

  const { data: policy, error: policyError } = await supabase
    .from("insurance_policies")
    .select("id, patient_id, status")
    .eq("id", policyId)
    .maybeSingle();

  if (policyError || !policy) {
    redirect("/eligibility/new?error=invalid_policy");
  }

  if (policy.status !== "active") {
    redirect("/eligibility/new?error=inactive_policy");
  }

  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("id, status")
    .eq("id", policy.patient_id)
    .maybeSingle();

  if (
    patientError ||
    !patient ||
    patient.status !== "active"
  ) {
    redirect("/eligibility/new?error=invalid_patient");
  }

  const { error } = await supabase
    .from("eligibility_checks")
    .insert({
      patient_id: policy.patient_id,
      insurance_policy_id: policy.id,
      checked_by: user.id,
      check_date: checkDate,
      status,
      response_details: responseDetails || null,
      notes: notes || null,
    });

  if (error) {
    console.error("Eligibility check creation failed:", error);
    redirect("/eligibility/new?error=save_failed");
  }

  redirect("/eligibility?created=true");
}
