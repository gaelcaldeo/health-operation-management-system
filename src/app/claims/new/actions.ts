
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function createClaim(formData: FormData) {
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
    redirect("/claims?error=unauthorized");
  }

  const insurancePolicyId = String(
    formData.get("insurance_policy_id") ?? ""
  ).trim();

  const serviceDate = String(
    formData.get("service_date") ?? ""
  ).trim();

  const rawClaimAmount = String(
    formData.get("claim_amount") ?? ""
  ).trim();

  const status = String(
    formData.get("status") ?? "draft"
  ).trim();

  const submissionDate = String(
    formData.get("submission_date") ?? ""
  ).trim();

  const notes = String(
    formData.get("notes") ?? ""
  ).trim();

  const claimAmount = Number(rawClaimAmount);
  const validStatuses = ["draft", "submitted"];

  if (
    !isValidUuid(insurancePolicyId) ||
    !isValidDate(serviceDate) ||
    rawClaimAmount === "" ||
    !Number.isFinite(claimAmount) ||
    claimAmount < 0 ||
    claimAmount > 9999999999.99 ||
    !/^\d+(\.\d{1,2})?$/.test(rawClaimAmount) ||
    !validStatuses.includes(status) ||
    notes.length > 2000
  ) {
    redirect("/claims/new?error=invalid");
  }

  const today = new Date().toISOString().slice(0, 10);

  if (serviceDate > today) {
    redirect("/claims/new?error=invalid_date");
  }

  if (submissionDate && !isValidDate(submissionDate)) {
    redirect("/claims/new?error=invalid_date");
  }

  if (status === "submitted" && !submissionDate) {
    redirect("/claims/new?error=submission_date_required");
  }

  if (submissionDate) {
    if (submissionDate < serviceDate || submissionDate > today) {
      redirect("/claims/new?error=invalid_date");
    }
  }

  const { data: policy, error: policyError } = await supabase
    .from("insurance_policies")
    .select("id, patient_id, status, effective_date, expiration_date")
    .eq("id", insurancePolicyId)
    .single();

  if (policyError || !policy || policy.status !== "active") {
    redirect("/claims/new?error=invalid_policy");
  }

  if (serviceDate < policy.effective_date) {
    redirect("/claims/new?error=inactive_policy");
  }

  if (policy.expiration_date && serviceDate > policy.expiration_date) {
    redirect("/claims/new?error=expired_policy");
  }

  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("id, status")
    .eq("id", policy.patient_id)
    .single();

  if (patientError || !patient || patient.status !== "active") {
    redirect("/claims/new?error=invalid_patient");
  }

  const { error } = await supabase.from("claims").insert({
    patient_id: policy.patient_id,
    insurance_policy_id: policy.id,
    created_by: user.id,
    service_date: serviceDate,
    submission_date: submissionDate || null,
    claim_amount: claimAmount,
    status,
    notes: notes || null,
  });

  if (error) {
    console.error("Create claim failed:", error);
    redirect("/claims/new?error=create_failed");
  }

  redirect("/claims?created=true");
}
