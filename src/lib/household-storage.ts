const KEY = "myturn_household_id";

export function saveLastHouseholdId(id: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* private mode */
  }
}

export function getLastHouseholdId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearLastHouseholdId() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* private mode */
  }
}
