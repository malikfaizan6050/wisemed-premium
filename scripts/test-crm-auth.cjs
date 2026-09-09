// Isolated auth regression tests: no credentials or network required.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
function load(file, mocks, env = {}, globals = {}) {
    const exports = {};
    const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
    }).outputText;
    vm.runInNewContext(code, { exports, require: name => {
        if (name in mocks) return mocks[name];
        throw new Error(`Unexpected import: ${name}`);
    }, process: { env }, console: { warn() {}, info() {} }, Buffer, Date, ...globals });
    return exports;
}
class ConfigurationError extends Error {}
let profile, role, tokenError, lookupError, exists, calls;
const mocks = {
    "server-only": {}, "node:crypto": require("node:crypto"),
    "next/server": { NextResponse: { json: (body, init) => ({ body, ...init }) } },
    "@/lib/firebase-admin": {
        FirebaseAdminConfigurationError: ConfigurationError,
        adminAuth: { verifyIdToken: async (token, revoked) => {
            calls++;
            assert.equal(token, "test-token"); assert.equal(revoked, true);
            if (tokenError) throw tokenError;
            return { uid: "test-uid" };
        } },
        db: { collection: name => {
            assert.equal(name, "users");
            return { doc: uid => {
                assert.equal(uid, "test-uid");
                return { get: async () => {
                    if (lookupError) throw lookupError;
                    return { exists, data: () => profile };
                } };
            } };
        } }
    },
    "@/lib/crmUserRepository": { mapCRMUser: (uid, data) => data.roleId ? { uid, ...data } : null },
    "@/repositories/roleRepository": { getRoleById: async () => role },
    "@/repositories/userRepository": { activateInvitedUser: async () => { profile.status = "active"; } },
    "@/lib/permissions": { canCreateLead: () => false, hasPermission: () => false }
};
mocks["@/lib/crmUserRepository"] = load("src/lib/crmUserRepository.ts", mocks);
const auth = load("src/lib/apiAuth.ts", mocks);
const request = header => ({ headers: new Headers(header ? { authorization: header } : {}) });
function reset() {
    profile = { roleId: "sales", status: "active", mustChangePassword: false };
    role = { id: "sales", status: "active", permissions: ["leads.read.owned"] };
    exists = true; tokenError = null; lookupError = null; calls = 0;
}
(async () => {
    const scenarios = [
        ["crm_user_not_found", () => { exists = false; }],
        ["crm_user_inactive", () => { profile.status = "suspended"; }],
        ["crm_role_invalid", () => { profile.roleId = ""; }],
        ["crm_role_invalid", () => { role = null; }],
        ["crm_role_inactive", () => { role.status = "disabled"; }],
        ["crm_permissions_missing", () => { role.permissions = []; }],
        ["password_change_required", () => { profile.status = "invited"; profile.mustChangePassword = true; profile.temporaryPasswordExpiresAt = new Date(Date.now() + 60000); }],
        ["temporary_password_expired", () => { profile.mustChangePassword = true; }],
        ["auth_token_invalid", () => { tokenError = { code: "auth/id-token-revoked" }; }],
        ["crm_user_inactive", () => { tokenError = { code: "auth/user-disabled" }; }],
        ["firebase_admin_configuration_error", () => { tokenError = new ConfigurationError(); }],
        ["firebase_auth_access_denied", () => { tokenError = { code: "auth/insufficient-permission" }; }],
        ["crm_datastore_access_denied", () => { lookupError = { code: 7 }; }],
        ["internal_server_error", () => { lookupError = new Error("not logged"); }]
    ];
    reset();
    assert.equal((await auth.authenticateCRMUser(request())).code, "auth_token_missing");
    assert.equal((await auth.authenticateCRMUser(request("Basic invalid"))).code, "auth_token_invalid");
    assert.equal(calls, 0);
    for (const [expected, setup] of scenarios) {
        reset(); setup();
        assert.equal((await auth.authenticateCRMUser(request("Bearer test-token"))).code, expected);
        assert.equal(calls, 1);
    }
    reset(); profile.status = "invited";
    assert.equal((await auth.authenticateCRMUser(request("Bearer test-token"))).user.status, "active");
    for (const roleFields of [{ role: "sales", roleId: undefined }, { roleId: " sales " }]) {
        reset(); profile = { ...profile, ...roleFields, status: "invited" };
        const result = await auth.authenticateCRMUser(request("Bearer test-token"));
        assert.equal(result.ok, true);
        assert.equal(result.user.roleId, "sales");
    }
    reset();
    const route = load("src/app/api/users/me/route.ts", { ...mocks, "@/lib/apiAuth": auth });
    assert.equal((await route.GET(request())).status, 401);
    const success = await route.GET(request("Bearer test-token"));
    assert.equal(success.body.user.uid, "test-uid");
    assert.equal(success.headers["Cache-Control"], "private, no-store");
    let ready = false;
    const client = load("src/lib/authenticatedFetch.ts", {
        "@/lib/firebase": { auth: {
            authStateReady: async () => { ready = true; },
            currentUser: { getIdToken: async () => { assert.equal(ready, true); return "test-token"; } }
        } }
    }, {}, { Headers, fetch: async (input, init) => {
        assert.equal(input, "/api/users/me");
        assert.equal(init.headers.get("Authorization"), "Bearer test-token");
        assert.equal(init.headers.get("X-Test"), "preserved");
        assert.equal(init.cache, "no-store");
    } });
    await client.authenticatedFetch("/api/users/me", { headers: { "X-Test": "preserved" } });
    // Admin initialization is lazy and normalizes quoted, escaped and actual PEM lines.
    for (const raw of ["A\\nB", '"A\\nB"', "A\r\nB", "A\\r\\nB"]) {
        let initialized = false;
        const admin = load("src/lib/firebase-admin.ts", {
            "server-only": {},
            "firebase-admin/app": { getApps: () => [], cert: credential => {
                assert.equal(credential.privateKey, "A\nB"); return credential;
            }, initializeApp: () => { initialized = true; return {}; } },
            "firebase-admin/auth": { getAuth: () => ({ verifyIdToken: () => true }) },
            "firebase-admin/firestore": { getFirestore: () => ({}) }
        }, { FIREBASE_ADMIN_PROJECT_ID: "project", FIREBASE_ADMIN_CLIENT_EMAIL: "email", FIREBASE_ADMIN_PRIVATE_KEY: raw });
        assert.equal(initialized, false);
        assert.equal(admin.adminAuth.verifyIdToken(), true);
    }
    // Real role repository mapping must tolerate missing optional fields.
    const roleRepository = load("src/repositories/roleRepository.ts", {
        "server-only": {}, "firebase-admin/firestore": { FieldValue: {} },
        "@/lib/permissions": { isPermission: value => value === "leads.read.owned" },
        "@/lib/firebase-admin": { db: { collection: name => {
            assert.equal(name, "roles");
            return { doc: id => {
                assert.equal(id, "sales");
                return { get: async () => ({ exists: true, id, data: () => ({ status: "active", permissions: ["leads.read.owned"] }) }) };
            } };
        } } }
    });
    const mappedRole = await roleRepository.getRoleById("sales");
    assert.equal(mappedRole.status, "active");
    assert.equal(mappedRole.name, "");
    assert.equal(mappedRole.permissions.length, 1);
    reset();
    const minimalUser = await auth.authenticateCRMUser(request("Bearer test-token"));
    assert.equal(minimalUser.ok, true);
    assert.equal(minimalUser.user.displayName, "");
    assert.equal(minimalUser.user.createdAt, null);
    // Exercise the real password-setup function without initializing unrelated services.
    const serviceSource = fs.readFileSync("src/services/userService.ts", "utf8");
    const passwordFunction = serviceSource.slice(serviceSource.indexOf("export async function completeTemporaryPasswordSetup"), serviceSource.indexOf("function generateTemporaryPassword"));
    const passwordExports = {};
    let passwordUpdated = false;
    vm.runInNewContext(ts.transpileModule(passwordFunction, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
    }).outputText, {
        exports: passwordExports,
        getUser: async () => ({ status: "invited", mustChangePassword: true }),
        isExpired: () => false,
        personalPasswordPattern: { test: () => true },
        adminAuth: { updateUser: async () => { passwordUpdated = true; } },
        updateUserProfile: async (_uid, updates) => { assert.equal(updates.mustChangePassword, false); },
        UserServiceError: Error
    });
    await passwordExports.completeTemporaryPasswordSetup("test-uid", "test-only-value");
    assert.equal(passwordUpdated, true);
    console.log("CRM auth regression tests passed (error branches, invited flow, route response, PEM normalization).");
})().catch(error => { console.error(error); process.exitCode = 1; });
