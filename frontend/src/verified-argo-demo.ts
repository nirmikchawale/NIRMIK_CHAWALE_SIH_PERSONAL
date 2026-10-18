import { CURRENT_VERIFIED_BASELINE } from "./main-block-engine";
import type { ProfileSummary } from "./types";

/**
 * Initial judge-facing observation: a provider-QC-screened Argo cast from the
 * separate immutable BASE-GLORYS-001 diagnostic package. This is an observation
 * profile, NEVER a model block or a pilot's source-backed grid.
 */
export const VERIFIED_ARGO_DEMO_ID = "20240102_indian_ocean_prof:23";
export const VERIFIED_ARGO_FLOAT_ID = "5907092";

export interface InitialArgoSelection {
  profileId: string;
  autoSelectedDemo: boolean;
}

/**
 * Keep an explicit valid profile from a saved/linked scientific context.
 * Only auto-select our documented verified float for BASE-GLORYS-001.
 * Never attach this diagnostic result to an unrelated Phase 3.5B pilot
 * or fabricate a profile when the verified catalog lacks the cast.
 */
export function selectInitialVerifiedArgo(
  profiles: readonly ProfileSummary[],
  requestedProfileId: string | null,
  blockId: string
): InitialArgoSelection {
  if (blockId !== CURRENT_VERIFIED_BASELINE.id) {
    return { profileId: "", autoSelectedDemo: false };
  }
  const requested = requestedProfileId
    ? profiles.find((profile) => profile.profile_id === requestedProfileId)
    : null;
  if (requested) {
    return { profileId: requested.profile_id, autoSelectedDemo: false };
  }
  const verified = profiles.find((profile) =>
    profile.profile_id === VERIFIED_ARGO_DEMO_ID &&
    profile.platform_id === VERIFIED_ARGO_FLOAT_ID &&
    profile.cycle === 13 &&
    profile.direction.toUpperCase() === "D" &&
    profile.matched_level_count === 50
  );
  return {
    profileId: verified?.profile_id ?? "",
    autoSelectedDemo: Boolean(verified)
  };
}
