import { toLeadDate } from "@/lib/leadDates";

// Every stored date shape is decoded by toLeadDate, including the
// `{_seconds,_nanoseconds}` form a Firestore Timestamp takes over the wire.
// This used to carry its own partial copy of that logic.
export function formatCRMDate(value:unknown,fallback="—") {
    const date = toLeadDate(value);
    // The epoch is the placeholder written for legacy records with no real
    // date, so it is shown as "unknown" rather than as 1 January 1970.
    return date && date.getTime() > 0 ? date.toLocaleDateString() : fallback;
}

export function getApiError(result:unknown,fallback:string) {
    return result && typeof result === "object" && "error" in result && typeof result.error === "string" ? result.error : fallback;
}
