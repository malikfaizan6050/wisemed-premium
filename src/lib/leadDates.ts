/**
 * Reads a date out of anything the CRM stores one in.
 *
 * Firestore Timestamps do not survive `JSON.stringify` as dates: the Admin SDK
 * class carries no `toJSON`, so a timestamp reaches the browser as the plain
 * object `{_seconds,_nanoseconds}` (the web SDK uses `{seconds,nanoseconds}`).
 * Neither shape has a `toDate` method by the time it arrives, so every client
 * date read `null`: the dashboard's Created From/To filters matched no lead at
 * all, and the lead lists fell back to sorting by document id instead of by
 * date. Both wire shapes are handled here, once, so every screen agrees.
 */
export function toLeadDate(value:unknown):Date|null {
    if(value instanceof Date){
        return Number.isNaN(value.getTime()) ? null : value;
    }

    if(typeof value === "string" || typeof value === "number"){
        const date =
            typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
            ? new Date(
                Number(value.slice(0,4)),
                Number(value.slice(5,7)) - 1,
                Number(value.slice(8,10))
            )
            : new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    if(value && typeof value === "object"){
        if("toDate" in value && typeof value.toDate === "function"){
            const date = value.toDate();
            return date instanceof Date && !Number.isNaN(date.getTime())
                ? date
                : null;
        }

        // Serialised Timestamp, in either SDK's field naming.
        const record = value as Record<string,unknown>;
        const seconds = typeof record._seconds === "number"
            ? record._seconds
            : typeof record.seconds === "number" ? record.seconds : null;
        if(seconds !== null){
            const nanoseconds = typeof record._nanoseconds === "number"
                ? record._nanoseconds
                : typeof record.nanoseconds === "number" ? record.nanoseconds : 0;
            const date = new Date(seconds*1000 + Math.round(nanoseconds/1_000_000));
            return Number.isNaN(date.getTime()) ? null : date;
        }
    }

    return null;
}

export function isLeadOverdue(dueDate:unknown,status:string) {
    if(status === "active_client" || status === "lost") return false;

    const parsed = toLeadDate(dueDate);
    if(!parsed) return false;

    // Copied before truncating. toLeadDate hands back the very object it was
    // given when that object is already a Date, so truncating in place used to
    // rewrite the caller's own due date to midnight.
    const date = new Date(parsed.getTime());
    const today = new Date();
    today.setHours(0,0,0,0);
    date.setHours(0,0,0,0);

    return date < today;
}

export function toDateInputValue(value:unknown) {
    const date = toLeadDate(value);
    if(!date) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2,"0");
    const day = String(date.getDate()).padStart(2,"0");
    return `${year}-${month}-${day}`;
}
