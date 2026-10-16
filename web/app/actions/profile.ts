"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { triggerUserRun } from "@/lib/agent";
import { createClient } from "@/lib/supabase/server";
import { UK_REGIONS } from "@/lib/types";

export type ProfileState = { error?: string; saved?: boolean };

const VALID_REGIONS = new Set(UK_REGIONS.map((r) => r.code));

function list(value: FormDataEntryValue | null, max = 30) {
  return String(value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);
}

function money(value: FormDataEntryValue | null) {
  const n = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function saveProfile(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const mode = form.get("mode") === "onboarding" ? "onboarding" : "settings";
  const keywords = list(form.get("keywords"));
  const description = String(form.get("description") ?? "").trim().slice(0, 2000);
  const companyName = String(form.get("company_name") ?? "").trim().slice(0, 200);

  if (!companyName) return { error: "Add your business name." };
  if (description.length < 20) return { error: "Describe what your business does in a sentence or two." };
  if (keywords.length === 0) return { error: "Add at least one service or keyword, such as \"website design\"." };

  const regions = form.getAll("regions").map(String).filter((r) => VALID_REGIONS.has(r));
  const minValue = money(form.get("min_value"));
  const maxValue = money(form.get("max_value"));
  if (minValue && maxValue && minValue > maxValue) return { error: "The smallest contract size is bigger than the largest." };

  const { error } = await supabase
    .from("profiles")
    .update({
      company_name: companyName,
      description,
      keywords,
      exclude_keywords: list(form.get("exclude_keywords")),
      cpv_prefixes: list(form.get("cpv_prefixes")).filter((c) => /^\d{2,8}$/.test(c)),
      regions: regions.length ? regions : ["UK"],
      min_value: minValue,
      max_value: maxValue,
      onboarded: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: "Couldn't save your profile. Try again in a moment." };

  if (mode === "onboarding") {
    await triggerUserRun(user.id);
    redirect("/dashboard?welcome=1");
  }
  revalidatePath("/dashboard", "layout");
  return { saved: true };
}
