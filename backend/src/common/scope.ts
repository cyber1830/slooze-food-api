import { Role } from './enums';

export interface AuthUser { id: string; name: string; role: string; country: string }

/**
 * Re-BAC: the single place that decides which country a user may touch.
 * Admins are org-wide (no filter). Managers and Members are pinned to their own country.
 * Every query/mutation that reads or writes country-owned data spreads this into its `where`.
 */
export function countryFilter(user: AuthUser): { country?: string } {
  return user.role === Role.ADMIN ? {} : { country: user.country };
}
