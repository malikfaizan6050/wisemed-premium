# CRM roles and permissions

Firebase Authentication remains the identity provider. Authorization is resolved on every protected request by loading `users/{uid}`, requiring an active user, loading `roles/{roleId}`, requiring an active role, and checking the requested permission against the role's Firestore `permissions` array.

Firebase custom claims contain only `roleId`. Permission arrays are never stored in tokens, so permission changes take effect without rewriting claims or waiting for token refresh.

## Available permissions

| Permission | Purpose |
| --- | --- |
| `leads.read.all` | Read all CRM leads |
| `leads.read.owned` | Read leads owned by the current user |
| `leads.create` | Create leads |
| `leads.update.all` | Update any lead |
| `leads.update.owned` | Update owned leads |
| `leads.delete` | Soft-delete leads into `crm_leads_deleted` |
| `leads.export` | Export leads as CSV through the server, which records the export |
| `leads.assign` | Assign lead ownership |
| `users.assignable.read` | Read the restricted list of users a lead can be assigned to |
| `users.read` | Read employee profiles |
| `users.manage` | Create, update, disable, and reset users |
| `roles.read` | Read role definitions |
| `roles.manage` | Create, update, and delete custom roles |
| `activities.read.all` | Read all employee activity |
| `activities.read.own` | Read the current employee's activity |
| `analytics.read` | Read the CRM analytics dashboard |
| `import_leads` | Import leads from CSV or Excel (administrators only) |
| `system.migrate` | Run protected data migrations |
| `system.diagnostics` | Run protected backend diagnostics |

## Role lifecycle

1. A role is created as `active` or `disabled` with a unique name and validated permissions.
2. Active roles can be assigned to users. User assignment updates the Firebase `roleId` custom claim.
3. Permission changes are read directly from Firestore on the next API request.
4. Disabled roles cannot authorize users or be assigned through user management.
5. A custom role can be deleted only when no user document references it.
6. System roles cannot be deleted or disabled. `bootstrap-crm-auth.mjs` seeds three: `admin`, `sales_manager` and `sales`.

Every create, update, and delete operation writes a corresponding record to `employee_activities` in the same Firestore batch or transaction as the role mutation.
