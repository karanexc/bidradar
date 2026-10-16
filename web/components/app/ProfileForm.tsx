"use client";

import { useActionState } from "react";
import { saveProfile, type ProfileState } from "@/app/actions/profile";
import { UK_REGIONS, type Profile } from "@/lib/types";

export function ProfileForm({ profile, mode }: { profile: Profile; mode: "onboarding" | "settings" }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfile, {});
  const selected = new Set(profile.regions?.length ? profile.regions : ["UK"]);

  return (
    <form action={action}>
      <input type="hidden" name="mode" value={mode} />

      <div className="field">
        <label htmlFor="company_name">Business name</label>
        <input id="company_name" name="company_name" type="text" defaultValue={profile.company_name ?? ""} required />
      </div>

      <div className="field">
        <label htmlFor="description">What does your business do?</label>
        <p className="hint" id="description-hint">
          The agent reads this to judge each tender, so be specific about services, sectors and experience.
        </p>
        <textarea
          id="description"
          name="description"
          aria-describedby="description-hint"
          defaultValue={profile.description ?? ""}
          placeholder="We're a 6-person web agency in Manchester. We design, build and host accessible websites for councils, charities and universities."
          required
        />
      </div>

      <div className="field">
        <label htmlFor="keywords">Services and keywords</label>
        <p className="hint" id="keywords-hint">Separate with commas. Tenders need to mention at least one.</p>
        <input
          id="keywords"
          name="keywords"
          type="text"
          aria-describedby="keywords-hint"
          defaultValue={profile.keywords?.join(", ")}
          placeholder="website, web design, hosting, accessibility, digital"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="exclude_keywords">Words to avoid (optional)</label>
        <p className="hint" id="exclude-hint">Tenders containing these are skipped.</p>
        <input
          id="exclude_keywords"
          name="exclude_keywords"
          type="text"
          aria-describedby="exclude-hint"
          defaultValue={profile.exclude_keywords?.join(", ")}
          placeholder="furniture, catering"
        />
      </div>

      <fieldset>
        <legend style={{ fontWeight: 600 }}>Where do you work?</legend>
        <div className="checks">
          {UK_REGIONS.map((r) => (
            <label key={r.code} className="check">
              <input type="checkbox" name="regions" value={r.code} defaultChecked={selected.has(r.code)} />
              {r.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="row-2">
        <div className="field">
          <label htmlFor="min_value">Smallest contract worth bidding for (£)</label>
          <input id="min_value" name="min_value" type="number" min="0" step="1000" defaultValue={profile.min_value ?? ""} placeholder="10000" />
        </div>
        <div className="field">
          <label htmlFor="max_value">Largest contract you could deliver (£)</label>
          <input id="max_value" name="max_value" type="number" min="0" step="1000" defaultValue={profile.max_value ?? ""} placeholder="250000" />
        </div>
      </div>

      <details className="advanced">
        <summary>Advanced: CPV codes</summary>
        <div className="field">
          <label htmlFor="cpv_prefixes">CPV code prefixes</label>
          <p className="hint" id="cpv-hint">
            Public tenders are tagged with CPV category codes. Add prefixes like 72 (IT services) or 79341 (advertising) to catch tenders that don&apos;t use your keywords.
          </p>
          <input id="cpv_prefixes" name="cpv_prefixes" type="text" aria-describedby="cpv-hint" defaultValue={profile.cpv_prefixes?.join(", ")} placeholder="72, 79341" />
        </div>
      </details>

      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Saving…" : mode === "onboarding" ? "Save and find tenders" : "Save changes"}
        </button>
        {state.saved && <span className="form-ok" role="status">Changes saved</span>}
      </div>
    </form>
  );
}
