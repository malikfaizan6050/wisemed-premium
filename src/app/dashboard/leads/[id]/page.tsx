import { redirect } from "next/navigation";

/**
 * There is no per-lead page: a lead is opened in the drawer on the list.
 *
 * This route rendered `null`, so anything holding a link to a lead — an older
 * notification, a bookmark, a pasted URL — landed on a blank white screen with
 * no navigation and no indication that anything had gone wrong. It now sends
 * the visitor to the list the drawer opens from.
 */
export default async function LeadPage() {
    redirect("/dashboard/leads");
}
