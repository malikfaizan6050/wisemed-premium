export class ValidationError extends Error {
    constructor(message:string,public readonly code="validation_error") { super(message); }
}

export function objectBody(value:unknown):Record<string,unknown> {
    if(!value || typeof value !== "object" || Array.isArray(value)) throw new ValidationError("Request body must be an object");
    return value as Record<string,unknown>;
}

export function requiredId(value:unknown,label:string) {
    if(typeof value !== "string" || !value.trim() || value.length > 128) throw new ValidationError(`${label} is required`);
    return value.trim();
}
