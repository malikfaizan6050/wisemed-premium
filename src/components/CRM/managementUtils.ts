export function formatCRMDate(value:unknown,fallback="—") {
    if(!value) return fallback;
    if(value instanceof Date) return value.getTime()<=0 ? fallback : value.toLocaleDateString();
    if(typeof value === "string"){
        const date = new Date(value);
        return Number.isNaN(date.getTime())||date.getTime()<=0 ? fallback : date.toLocaleDateString();
    }
    if(typeof value === "object"){
        if("seconds" in value && typeof value.seconds === "number") return value.seconds<=0 ? fallback : new Date(value.seconds*1000).toLocaleDateString();
        if("_seconds" in value && typeof value._seconds === "number") return value._seconds<=0 ? fallback : new Date(value._seconds*1000).toLocaleDateString();
    }
    return fallback;
}

export function getApiError(result:unknown,fallback:string) {
    return result && typeof result === "object" && "error" in result && typeof result.error === "string" ? result.error : fallback;
}
