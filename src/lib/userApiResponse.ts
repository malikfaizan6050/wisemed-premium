import { NextResponse } from "next/server";
import { UserServiceError } from "@/services/userService";

export function userApiError(error:unknown) {
    if(error instanceof UserServiceError){
        return NextResponse.json(
            { error:error.message,code:error.code },
            { status:error.status }
        );
    }
    return NextResponse.json(
        { error:"User operation failed" },
        { status:500 }
    );
}

export async function readJsonObject(request:Request) {
    const body:unknown = await request.json();
    if(!body || typeof body !== "object" || Array.isArray(body)){
        throw new UserServiceError("Invalid request body",400,"invalid_body");
    }
    return body as Record<string,unknown>;
}
