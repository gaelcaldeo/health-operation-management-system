
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

export async function updateInsurancePolicy(
  policyId: string,
  formData: FormData
) {
  if (!isValidUuid(policyId)) {
    redirect("/insurance");
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

  if (!profile || !["admin", "healthcare_staff"].includes(profile.role)) {
    redirect(`/insurance/${policyId}?error=unauthorized`);
  }

  const provider = String(
    formData.get("insurance_provider") ?? ""
  ).trim();

  const policyNumber = String(
    formData.get("policy_number") ?? ""
  ).trim();

  const groupNumber = String(
    formData.get("group_number") ?? ""
  ).trim();

  const effectiveDate = String(
    formData.get("effective_date") ?? ""
  ).trim();

  const expirationDate = String(
    formData.get("expiration_date") ?? ""
  ).trim();

  const status = String(
    formData.get("status") ?? ""
  ).trim();

  if (!provider || !policyNumber || !effectiveDate) {
    redirect(`/insurance/${policyId}/edit?error=missing`);
  }

  if (
    provider.length > 150 ||
    policyNumber.length > 100 ||
    groupNumber.length > 100
  ) {
    redirect(`/insurance/${policyId}/edit?error=invalid_input`);
  }

  if (
    !isValidDate(effectiveDate) ||
    (expirationDate && !isValidDate(expirationDate))
  ) {
    redirect(`/insurance/${policyId}/edit?error=invalid_date`);
  }

  if (expirationDate && expirationDate < effectiveDate) {
    redirect(`/insurance/${policyId}/edit?error=invalid_date`);
  }

  const today = getTodayInManila();

  if (effectiveDate > today) {
    redirect(`/insurance/${policyId}/edit?error=invalid_date`);
  }

  if (!["active", "inactive", "terminated"].includes(status)) {
    redirect(`/insurance/${policyId}/edit?error=invalid_status`);
  }

  const { data: existingPolicy, error: existingError } = await supabase
    .from("insurance_policies")
    .select("id")
    .eq("id", policyId)
    .maybeSingle();

  if (existingError || !existingPolicy) {
    redirect("/insurance");
  }

  const { error } = await supabase
    .from("insurance_policies")
    .update({
      insurance_provider: provider,
      policy_number: policyNumber,
      group_number: groupNumber || null,
      effective_date: effectiveDate,
      expiration_date: expirationDate || null,
      status,
    })
    .eq("id", policyId);

  if (error) {
    if (error.code === "23505") {
      redirect(`/insurance/${policyId}/edit?error=duplicate`);
    }

    console.error("Insurance policy update failed:", error);
    redirect(`/insurance/${policyId}/edit?error=save_failed`);
  }

  redirect(`/insurance/${policyId}?updated=true`);
}
