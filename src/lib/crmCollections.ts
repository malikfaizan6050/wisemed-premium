// Firestore collection names, in one place.
//
// Three different names for the same concept were in use: the public
// consultation form wrote to `consultations`, the CRM read from `crm_leads`,
// and the migration route wrote to `leads`. Website enquiries therefore landed
// somewhere nothing read, and never appeared in the pipeline.
//
// `crm_leads` is the live collection the CRM reads. Reference these constants
// rather than repeating string literals, so the names cannot drift apart again.

export const LEADS_COLLECTION = "crm_leads";

/**
 * Where deleted leads are kept. Deletion moves the record here instead of
 * destroying it, so a mistaken delete stays recoverable and the audit entry
 * still has something to reference.
 */
export const DELETED_LEADS_COLLECTION = "crm_leads_deleted";
export const ACTIVITIES_COLLECTION = "employee_activities";
export const NOTIFICATIONS_COLLECTION = "notifications";
export const USERS_COLLECTION = "users";
export const ROLES_COLLECTION = "roles";

/**
 * Pre-fix collection that still holds enquiries captured while the public form
 * wrote to the wrong place. Read-only: kept so those records can be migrated,
 * never written to again.
 */
export const LEGACY_CONSULTATIONS_COLLECTION = "consultations";
