export function formatCRMDate(value:unknown) {
    if(!value) return "—";
    if(value instanceof Date) return value.toLocaleDateString();
    if(typeof value === "string"){
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
    }
    if(typeof value === "object"){
        if("seconds" in value && typeof value.seconds === "number") return new Date(value.seconds*1000).toLocaleDateString();
        if("_seconds" in value && typeof value._seconds === "number") return new Date(value._seconds*1000).toLocaleDateString();
    }
    return "—";
}

export function getApiError(result:unknown,fallback:string) {
    return result && typeof result === "object" && "error" in result && typeof result.error === "string" ? result.error : fallback;
}
