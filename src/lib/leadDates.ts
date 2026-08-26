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

    if(
        value &&
        typeof value === "object" &&
        "toDate" in value &&
        typeof value.toDate === "function"
    ){
        const date = value.toDate();
        return date instanceof Date && !Number.isNaN(date.getTime())
            ? date
            : null;
    }

    return null;
}

export function isLeadOverdue(dueDate:unknown,status:string) {
    if(status === "active_client" || status === "lost") return false;

    const date = toLeadDate(dueDate);
    if(!date) return false;

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
