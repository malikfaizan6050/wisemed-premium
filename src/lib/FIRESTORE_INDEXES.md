# CRM Firestore index requirements

Deploy these composite indexes before production traffic:

| Collection | Fields | Used by |
| --- | --- | --- |
| `notifications` | `userId ASC`, `createdAt DESC` | Notification bell and list API |
| `crm_leads` | `ownerId ASC`, `createdAt DESC` | My Leads pagination (recommended next step) |
| `employee_activities` | `actorId ASC`, `createdAt DESC` | Employee activity and performance |
| `employee_activities` | `action ASC`, `createdAt DESC` | Activity action/date filtering |

Current analytics reads are bounded and aggregate in the server service. At higher volume, replace these scans with scheduled aggregate documents or Firestore count queries.

Firebase CLI index configuration should be added and deployed when infrastructure-file changes are authorized.
