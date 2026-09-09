import "server-only";
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

export class FirebaseAdminConfigurationError extends Error {
    constructor() { super("Firebase Admin configuration is unavailable or invalid."); }
}

function getAdminApp() {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim();
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
    const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim();
    // Temporary diagnostics: never log credential values or key substrings.
    if (!getApps().some(app => app.name === "[DEFAULT]")) {
        console.info("[Firebase Admin] Configuration diagnostics", {
            FIREBASE_ADMIN_PROJECT_ID_exists: Boolean(projectId),
            FIREBASE_ADMIN_CLIENT_EMAIL_exists: Boolean(clientEmail),
            FIREBASE_ADMIN_PRIVATE_KEY_exists: Boolean(rawKey),
            FIREBASE_ADMIN_PRIVATE_KEY_length: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length ?? 0,
            privateKeyHasPemHeader: rawKey?.includes("-----BEGIN PRIVATE KEY-----") ?? false,
            privateKeyHasPemFooter: rawKey?.includes("-----END PRIVATE KEY-----") ?? false,
            privateKeyHasEscapedNewlines: rawKey?.includes("\\n") ?? false,
            privateKeyHasRealNewlines: rawKey?.includes("\n") ?? false,
            clientProjectIdExists: Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim()),
            projectIdsMatch: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
                ? projectId === process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID.trim() : null
        });
    }
    if (!projectId || !clientEmail || !rawKey ||
        (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && projectId !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID.trim())) {
        throw new FirebaseAdminConfigurationError();
    }
    if (getApps().some(app => app.name === "[DEFAULT]")) return getApp();
    // Accept PEM pasted with real newlines, escaped newlines, or enclosing quotes.
    const privateKey = rawKey.replace(/^(["'])([\s\S]*)\1$/, "$2")
        .replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\r\n/g, "\n");
    try {
        return initializeApp({ projectId, credential: cert({ projectId, clientEmail, privateKey }) });
    } catch (error) {
        // Only known SDK messages can be emitted verbatim. Unknown exceptions
        // may contain credential input, so do not log the object, stack or cause.
        const safeMessages = [
            "Failed to parse private key.",
            'Service account object must contain a string "project_id" property.',
            'Service account object must contain a string "private_key" property.',
            'Service account object must contain a string "client_email" property.'
        ];
        const message = error instanceof Error ? error.message : "";
        console.error("[Firebase Admin] Initialization failed", {
            message: safeMessages.includes(message)
                ? message : "Unrecognized initialization error; message withheld to protect credentials."
        });
        throw new FirebaseAdminConfigurationError();
    }
}

// Defer initialization until a request so configuration failures can return JSON.
function lazyService<T extends object>(factory: () => T): T {
    return new Proxy({} as T, {
        get(_target, property) {
            const service = factory();
            const value = Reflect.get(service, property, service);
            return typeof value === "function" ? value.bind(service) : value;
        }
    });
}
export const db = lazyService(() => getFirestore(getAdminApp()));
export const adminAuth = lazyService(() => getAuth(getAdminApp()));
