
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function archivePatient(patientId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify user permissions
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "healthcare_staff"].includes(profile.role)) {
    redirect(`/patients/${patientId}`);
  }

  // Archive the patient instead of deleting the record
  const { data, error } = await supabase
    .from("patients")
    .update({ status: "archived" })
    .eq("id", patientId)
    .neq("status", "archived")
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirect(`/patients/${patientId}?error=archive_failed`);
  }

  redirect("/patients?archived=true");
}
