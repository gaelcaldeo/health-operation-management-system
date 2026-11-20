
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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

export async function createPatient(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "healthcare_staff"].includes(profile.role)) {
    redirect("/patients?error=unauthorized");
  }

  const firstName = String(
    formData.get("first_name") ?? ""
  ).trim();

  const lastName = String(
    formData.get("last_name") ?? ""
  ).trim();

  const dateOfBirth = String(
    formData.get("date_of_birth") ?? ""
  ).trim();

  const gender = String(
    formData.get("gender") ?? ""
  ).trim();

  const phone = String(
    formData.get("phone") ?? ""
  ).trim();

  const email = String(
    formData.get("email") ?? ""
  ).trim();

  if (!firstName || !lastName || !dateOfBirth) {
    redirect("/patients/new?error=missing");
  }

  if (
    firstName.length > 100 ||
    lastName.length > 100 ||
    gender.length > 30 ||
    phone.length > 30 ||
    email.length > 254
  ) {
    redirect("/patients/new?error=invalid_input");
  }

  if (!isValidDate(dateOfBirth)) {
    redirect("/patients/new?error=invalid_date");
  }

  const today = getTodayInManila();

  if (dateOfBirth > today) {
    redirect("/patients/new?error=invalid_date");
  }

  if (
    email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    redirect("/patients/new?error=invalid_email");
  }

  const { error } = await supabase
    .from("patients")
    .insert({
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dateOfBirth,
      gender: gender || null,
      phone: phone || null,
      email: email || null,
      status: "active",
    });

  if (error) {
    console.error("Patient creation failed:", error);
    redirect("/patients/new?error=save_failed");
  }

  redirect("/patients?created=true");
}
