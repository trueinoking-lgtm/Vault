# Vault Epsilon — School, Class, and Teacher Primitives Design

**Phase:** Epsilon A (design only)
**Status:** Draft
**Date:** 2026-07-04
**Git ref:** `0595c15` (HEAD — Delta memory loop checkpoint)

---

## 1. Current State

Vault is a **single-learner application**. The entire data model, API surface, and frontend are built for one user who is both the administrator and the sole learner. Key characteristics of the current architecture:

| Layer | Current State |
|-------|---------------|
| **Authentication** | Single password middleware (`PasswordAuthMiddleware`). Owner routes (`/owner/*`) are gated by a cookie (`vault-owner-access`). No user accounts, no registration, no roles. |
| **Domain Models** | All models (`Notebook`, `Source`, `Note`, `StudySession`, `LeafReviewEvent`, `LeafReviewState`) are tenant-unaware — no `user_id`, `school_id`, or `owner_id` fields. |
| **Study Data** | All review events, weak spots, and study sessions exist in a single namespace. Every learner (in a shared deployment) sees the same data. |
| **Sidebar/Navigation** | AppSidebar shows learner routes (Vault, Materials, Libraries). OwnerSidebar shows admin routes. Both are compiled in, not role-derived. |
| **Deployment** | Self-hosted on a single VPS (port 3003 frontend, 5055 API, 8000 SurrealDB). No multi-instance isolation. |

### What Delta Built

The Delta phase delivered a complete single-learner memory loop:

- Study sessions with lifecycle management (auto-close after 12h)
- Persistent review events (`check_started`, `remembered`, `needs_review`)
- Review state per leaf (denormalized for fast reads)
- Weak-spot heuristic (≥2 `needs_review`, no later `remembered`, ≥1h cooldown)
- Three-tier ReviewQueue: Needs practice → Needs review → Recently remembered
- Stale session auto-close (two-layer guard: frontend + backend)

### What Exists for "Owner" (Not "Teacher")

The `/owner/*` routes currently provide:

- AI provider configuration (API keys, models)
- Processing settings
- Runtime tools (command/job monitoring)
- No classroom management, no learner roster, no progress dashboards

---

## 2. Problem Statement

Vault cannot be deployed in a school or classroom setting today because:

1. **No user isolation.** Two learners in the same Vault instance see each other's notebooks, study sessions, and review queues. There is no way to distinguish one learner's data from another's.
2. **No teacher role.** A teacher cannot create a class, enroll learners, assign materials, or monitor progress. The only privileged role is "owner" (administrator), who manages AI config, not pedagogy.
3. **No school entity.** A school deploying Vault across multiple classrooms has no container for school-wide settings, curriculum mappings, or cross-classroom analytics.
4. **No enrollment flow.** There is no concept of "joining a class." Notebooks (libraries) are created by the single user and are visible to everyone (or no one).
5. **No graded progress signals.** The current weak-spot heuristic tracks review outcomes per leaf, but there is no aggregation at the class, teacher, or school level.
6. **Single-password auth is a security risk.** The owner password, once shared with a teacher, gives full access to AI configuration and runtime tools. There is no way to grant limited access.

---

## 3. Goals

1. **Define a minimal set of new entities** (School, SchoolMembership, Classroom, ClassEnrollment, SchoolSettings) that enable Vault to operate in a school context without building a full SaaS multi-tenant platform.
2. **Keep the single-learner deployment intact.** Every new entity and field must be **optional** — unset = "single-learner mode." Existing instances upgrade with zero data migration and zero behavioral change.
3. **Introduce three roles** — `owner`, `teacher`, `learner` — with clear boundaries. The existing owner role becomes one of the three; teacher and learner are new.
4. **Design data isolation** that works at the query level for now (backend filtering by `school_id` or `teacher_id`), not at the database namespace level.
5. **Design the minimum API surface** needed to create schools, manage memberships, form classes, and enroll learners.
6. **Define the first teacher dashboard read model** (what a teacher would see) without implementing it yet.
7. **Keep the architecture self-hostable.** Vault remains deployable by a school's IT administrator on a single server. No cloud dependency, no SaaS orchestration.

---

## 4. Non-Goals

- ❌ **Full RBAC / permissions framework.** No per-resource ACLs, no role hierarchy beyond owner → teacher → learner. Epsilon uses role-based *scoping* (who sees what), not role-based *permissions* (who can do what).
- ❌ **Multi-tenant SaaS isolation.** No database-per-tenant, no row-level security policies, no tenant-routing middleware. All tenants share the same database; `school_id` and `user_id` filter at the query layer.
- ❌ **Teacher dashboard UI.** The teacher dashboard is designed in this document but explicitly deferred to Epsilon E. This phase produces the data model and API that will power it.
- ❌ **User registration / onboarding flow.** No sign-up pages, no email verification, no password reset. The owner (admin) creates teacher accounts; teachers create learner accounts or import rosters. Registration flows are post-Epsilon polish.
- ❌ **Spaced repetition, quizzes, scoring.** These remain deferred to Zeta and beyond. Epsilon is about data isolation and school structure, not new pedagogical features.
- ❌ **Guardian/parent role.** Deferred. The role model stays flat (owner, teacher, learner) for Epsilon.
- ❌ **SSO / OAuth / LDAP integration.** Deferred. Password-based auth is sufficient for self-hosted school deployments.
- ❌ **AI provider changes.** No new provider integrations, no per-school AI configuration (that's an Epsilon+ feature). SchoolSettings uses the existing global AI providers.
- ❌ **Changes to the Delta learner-memory-loop.** Study sessions, review events, weak-spot heuristic, and review queue remain exactly as designed. Epsilon adds `user_id` scoping but does not change their behavior.

---

## 5. Proposed Entities

### 5.1 `school`

**Purpose:** A container for a deploying organisation (school, university, tutoring centre). Holds school-wide settings and relationships to members and classrooms.

**Why not optional?** Even a single-teacher deployment benefits from a school entity — it groups classrooms, provides a settings namespace, and future-proofs for multi-school deployments.

```surql
DEFINE TABLE IF NOT EXISTS school SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS name ON TABLE school TYPE string;
DEFINE FIELD IF NOT EXISTS slug ON TABLE school TYPE string
  ASSERT string::len($value) >= 2 AND string::len($value) <= 32;
DEFINE FIELD IF NOT EXISTS description ON TABLE school TYPE option<string>;
DEFINE FIELD IF NOT EXISTS settings ON TABLE school TYPE option<object>;
DEFINE FIELD IF NOT EXISTS active ON TABLE school TYPE bool DEFAULT true;
DEFINE FIELD IF NOT EXISTS created ON TABLE school TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS updated ON TABLE school TYPE datetime DEFAULT time::now();
```

| Field | Required | Notes |
|-------|----------|-------|
| `id` | auto | SurrealDB record ID (`school:uuid`) |
| `name` | Yes | Display name (e.g., "Zimbabwe High School") |
| `slug` | Yes | URL-safe identifier (e.g., "zimbabwe-high"), min 2 chars, max 32 |
| `description` | No | Optional long description |
| `settings` | No | Flexible JSON object for school-level configuration (see SchoolSettings below) |
| `active` | Yes | Soft-deactivate a school without data loss |
| `created` | auto | Timestamp |
| `updated` | auto | Timestamp |

**Indexes/query patterns:**
- `SELECT * FROM school WHERE active = true ORDER BY name` — list active schools
- `SELECT * FROM school WHERE slug = $slug` — lookup by slug
- `SELECT * FROM school WHERE id IN (SELECT school_id FROM school_membership WHERE user_id = $uid)` — schools a user belongs to

### 5.2 `school_membership`

**Purpose:** Links a user identity to a school with a specific role. A user can belong to multiple schools (e.g., a teacher who teaches at two schools).

```surql
DEFINE TABLE IF NOT EXISTS school_membership SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS school_id ON TABLE school_membership TYPE record<school>;
DEFINE FIELD IF NOT EXISTS user_id ON TABLE school_membership TYPE record<user>;
DEFINE FIELD IF NOT EXISTS role ON TABLE school_membership TYPE string
  ASSERT $value INSIDE ["owner", "teacher", "learner"];
DEFINE FIELD IF NOT EXISTS joined_at ON TABLE school_membership TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS active ON TABLE school_membership TYPE bool DEFAULT true;
```

| Field | Required | Notes |
|-------|----------|-------|
| `id` | auto | SurrealDB record ID |
| `school_id` | Yes | Links to the school |
| `user_id` | Yes | Links to the user record |
| `role` | Yes | One of `owner`, `teacher`, `learner` |
| `joined_at` | auto | When this membership was created |
| `active` | Yes | Soft-remove a member without data loss |

**Indexes/query patterns:**
- `SELECT * FROM school_membership WHERE school_id = $sid AND role = "teacher"` — list teachers at a school
- `SELECT * FROM school_membership WHERE user_id = $uid AND active = true` — all active school memberships for a user
- `SELECT * FROM school_membership WHERE school_id = $sid AND role = "learner"` — learner roster

### 5.3 `user` (new primary identity)

**Purpose:** A Vault user account. Replaces the single-password model. Every person who interacts with Vault — owner, teacher, or learner — gets a user record.

```surql
DEFINE TABLE IF NOT EXISTS user SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS display_name ON TABLE user TYPE string;
DEFINE FIELD IF NOT EXISTS email ON TABLE user TYPE string
  ASSERT string::is::email($value);
DEFINE FIELD IF NOT EXISTS password_hash ON TABLE user TYPE string;
DEFINE FIELD IF NOT EXISTS avatar_url ON TABLE user TYPE option<string>;
DEFINE FIELD IF NOT EXISTS is_global_owner ON TABLE user TYPE bool DEFAULT false;
DEFINE FIELD IF NOT EXISTS active ON TABLE user TYPE bool DEFAULT true;
DEFINE FIELD IF NOT EXISTS last_login_at ON TABLE user TYPE option<datetime>;
DEFINE FIELD IF NOT EXISTS created ON TABLE user TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS updated ON TABLE user TYPE datetime DEFAULT time::now();
```

| Field | Required | Notes |
|-------|----------|-------|
| `id` | auto | SurrealDB record ID (`user:uuid`) |
| `display_name` | Yes | Learner/teacher display name |
| `email` | Yes | Unique email; validated as email format |
| `password_hash` | Yes | Bcrypt/argon2 hash — never plaintext |
| `avatar_url` | No | Optional avatar |
| `is_global_owner` | Yes | Singleton flag: the original Vault admin. Only one user can have this. |
| `active` | Yes | Soft-disable an account |
| `last_login_at` | No | Updated on successful login |
| `created` | auto | |
| `updated` | auto | |

**The `is_global_owner` flag** preserves backward compatibility:
- The existing single-password owner (from env var or DB config) is migrated to a user record with `is_global_owner = true`
- This user has full system access across all schools (if any) and the existing `/owner/*` routes
- This ensures no capability is lost during migration

**Indexes/query patterns:**
- `SELECT * FROM user WHERE email = $email` — login lookup
- `SELECT * FROM user WHERE active = true ORDER BY display_name` — directory listing

### 5.4 `classroom` (or `class`)

**Purpose:** A teaching group within a school. A teacher's period, section, or tutoring group. Contains enrolled learners and assigned notebooks.

`class` is a reserved word in SurrealQL; use `classroom`.

```surql
DEFINE TABLE IF NOT EXISTS classroom SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS school_id ON TABLE classroom TYPE record<school>;
DEFINE FIELD IF NOT EXISTS teacher_id ON TABLE classroom TYPE record<school_membership>;
DEFINE FIELD IF NOT EXISTS name ON TABLE classroom TYPE string;
DEFINE FIELD IF NOT EXISTS description ON TABLE classroom TYPE option<string>;
DEFINE FIELD IF NOT EXISTS subject ON TABLE classroom TYPE option<string>;
DEFINE FIELD IF NOT EXISTS grade_level ON TABLE classroom TYPE option<string>;
DEFINE FIELD IF NOT EXISTS active ON TABLE classroom TYPE bool DEFAULT true;
DEFINE FIELD IF NOT EXISTS created ON TABLE classroom TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS updated ON TABLE classroom TYPE datetime DEFAULT time::now();
```

| Field | Required | Notes |
|-------|----------|-------|
| `id` | auto | SurrealDB record ID (`classroom:uuid`) |
| `school_id` | Yes | Parent school |
| `teacher_id` | Yes | The teacher's school_membership record |
| `name` | Yes | Display name (e.g., "Form 4A Mathematics") |
| `description` | No | Optional description |
| `subject` | No | e.g., "Mathematics", "Science" |
| `grade_level` | No | e.g., "Form 4", "Year 11", "Grade 7" |
| `active` | Yes | Soft-deactivate |
| `created` | auto | |
| `updated` | auto | |

**Indexes/query patterns:**
- `SELECT * FROM classroom WHERE school_id = $sid AND active = true ORDER BY name` — list classes at a school
- `SELECT * FROM classroom WHERE teacher_id = $tid` — a teacher's classes

### 5.5 `class_enrollment`

**Purpose:** Links a learner to a classroom. A learner can be enrolled in multiple classrooms.

```surql
DEFINE TABLE IF NOT EXISTS class_enrollment SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS classroom_id ON TABLE class_enrollment TYPE record<classroom>;
DEFINE FIELD IF NOT EXISTS learner_id ON TABLE class_enrollment TYPE record<school_membership>;
DEFINE FIELD IF NOT EXISTS enrolled_at ON TABLE class_enrollment TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS active ON TABLE class_enrollment TYPE bool DEFAULT true;
```

| Field | Required | Notes |
|-------|----------|-------|
| `id` | auto | |
| `classroom_id` | Yes | The classroom being joined |
| `learner_id` | Yes | The learner's school_membership record (role must be `learner`) |
| `enrolled_at` | auto | |
| `active` | Yes | Soft-unenroll without data loss |

**Indexes/query patterns:**
- `SELECT * FROM class_enrollment WHERE classroom_id = $cid AND active = true` — class roster
- `SELECT * FROM class_enrollment WHERE learner_id = $lid AND active = true` — learner's schedule
- `SELECT count() FROM class_enrollment WHERE classroom_id = $cid AND active = true GROUP ALL` — class size

### 5.6 `school_settings` (embedded in `school.settings`)

**Purpose:** School-level configuration. Stored as a JSON object in the `school.settings` field rather than as a separate table, to avoid over-normalization for v1.

```typescript
interface SchoolSettings {
  // Language / locale
  defaultLocale?: string               // e.g., "en", "sn" (Shona), "nd" (Ndebele)

  // Feature flags
  allowLearnerSelfRegistration?: boolean  // default false
  requireTeacherApprovalForEnrollment?: boolean // default true

  // Study defaults
  defaultWeakSpotThreshold?: number     // override global ≥2 default
  defaultStaleSessionHours?: number     // override global 12h default

  // Look and feel
  branding?: {
    logoUrl?: string
    primaryColor?: string
    schoolName?: string
  }

  // AI defaults (uses global AI providers)
  defaultChatModel?: string
  defaultEmbeddingModel?: string

  // Custom fields extension
  extensions?: Record<string, unknown>
}
```

All fields are optional. An empty or missing `settings` object means "use Vault's compiled defaults."

---

## 6. Entity Relationship Diagram

```
user 1──────────────────────0..* school_membership
  │                              │
  │                              │ role: "owner" | "teacher" | "learner"
  │                              │
  │                              └──────────0..* classroom (via teacher_id)
  │                              │
  │                              └──────────0..* class_enrollment (via learner_id)
  │
  │
school 1─────────────────────0..* school_membership
  │                              │
  │                              │
  └──────────────────────────0..* classroom
                                   │
                                   └────────────────────0..* class_enrollment
                                                                  │
                                                                  └──> (learner_id → school_membership)
```

### Relationship to Existing Delta Entities

| Existing Entity | Epsilon Relationship |
|----------------|---------------------|
| `notebook` (Library) | A notebook can optionally be **owned** by a school (via `school_id` field) or a teacher (via `created_by`). Teachers assign notebooks to classrooms via a new `classroom_assignment` table (see §7.2). |
| `source` (Material) | Inherits notebook's school scope. Learners add materials to their assigned notebooks. |
| `note` (Leaf) | Inherits notebook's scope. Existing weak-spot heuristic remains unchanged; `user_id` added for learner isolation. |
| `study_session` | Gets an optional `user_id` and `school_id` field. Queries filter by these when set. |
| `leaf_review_event` | Gets an optional `user_id` field. When in school mode, every event records the learner. |
| `leaf_review_state` | Gets an optional `user_id` field. Weak spots are per-learner, per-leaf (which is already the semantic; `user_id` makes it explicit). |

### Key Design Decision: Add `user_id` to Existing Tables

Rather than creating parallel tables for school-mode data, Epsilon adds **nullable** `user_id` and `school_id` fields to the existing Delta tables:

```surql
-- Added to study_session (migration 17)
DEFINE FIELD IF NOT EXISTS user_id ON TABLE study_session TYPE option<record<user>>;
DEFINE FIELD IF NOT EXISTS school_id ON TABLE study_session TYPE option<record<school>>;

-- Added to leaf_review_event (migration 17)
DEFINE FIELD IF NOT EXISTS user_id ON TABLE leaf_review_event TYPE option<record<user>>;

-- Added to leaf_review_state (migration 17)
DEFINE FIELD IF NOT EXISTS user_id ON TABLE leaf_review_state TYPE option<record<user>>;

-- Added to notebook (migration 17)
DEFINE FIELD IF NOT EXISTS school_id ON TABLE notebook TYPE option<record<school>>;
DEFINE FIELD IF NOT EXISTS created_by ON TABLE notebook TYPE option<record<user>>;
```

**Why nullable?** Existing single-learner deployments have no `user_id` on any record. Making the field optional (`option<record<user>>`) means:
- Zero migration data backfill
- Existing queries continue working unchanged
- Single-learner mode never sets these fields
- School-mode sets them, and queries add `WHERE user_id = $current_user` filters

---

## 7. Proposed API Surface

All new endpoints use the `/api/schools/` prefix. All are gated behind owner or teacher permissions.

### 7.1 School Management

| Endpoint | Method | Purpose | Permission |
|----------|--------|---------|------------|
| `/api/schools` | POST | Create a school | Owner only |
| `/api/schools` | GET | List schools | Owner, Teacher (own schools) |
| `/api/schools/{school_id}` | GET | Get school details + settings | School member |
| `/api/schools/{school_id}` | PATCH | Update school settings | Owner, School admin |
| `/api/schools/{school_id}` | DELETE | Deactivate a school | Owner only |

### 7.2 Classroom Management

| Endpoint | Method | Purpose | Permission |
|----------|--------|---------|------------|
| `/api/schools/{school_id}/classrooms` | POST | Create a classroom | Teacher at this school |
| `/api/schools/{school_id}/classrooms` | GET | List classrooms (with roster counts) | School member |
| `/api/schools/{school_id}/classrooms/{class_id}` | GET | Classroom details + roster | Class teacher, School admin |
| `/api/schools/{school_id}/classrooms/{class_id}` | PATCH | Update classroom | Class teacher |
| `/api/schools/{school_id}/classrooms/{class_id}` | DELETE | Deactivate classroom | School admin |

### 7.3 Membership & Enrollment

| Endpoint | Method | Purpose | Permission |
|----------|--------|---------|------------|
| `/api/schools/{school_id}/members` | GET | List school members (filterable by role) | School admin, Teacher |
| `/api/schools/{school_id}/members` | POST | Add a member to the school | School admin |
| `/api/schools/{school_id}/members/{member_id}` | PATCH | Change role or deactivate | School admin |
| `/api/schools/{school_id}/members/{member_id}` | DELETE | Remove member | School admin |
| `/api/classrooms/{class_id}/enrollments` | POST | Enroll a learner | Class teacher |
| `/api/classrooms/{class_id}/enrollments` | GET | List enrollments (roster) | Class teacher |
| `/api/classrooms/{class_id}/enrollments/{enrollment_id}` | DELETE | Unenroll a learner | Class teacher |

### 7.4 User Account Management

| Endpoint | Method | Purpose | Permission |
|----------|--------|---------|------------|
| `/api/auth/register` | POST | Register a new user (owner-created invite flow) | Public (with invite) |
| `/api/auth/login` | POST | Authenticate, return session token | Public |
| `/api/auth/logout` | POST | Invalidate session | Authenticated user |
| `/api/auth/me` | GET | Current user profile + memberships | Authenticated user |
| `/api/users` | GET | List users (for inviting to school) | School admin |
| `/api/users/{user_id}` | PATCH | Update display name, avatar | Self, School admin |

### 7.5 Notebook Assignment

| Endpoint | Method | Purpose | Permission |
|----------|--------|---------|------------|
| `/api/classrooms/{class_id}/assignments` | POST | Assign a notebook to a classroom | Class teacher |
| `/api/classrooms/{class_id}/assignments` | GET | List assigned notebooks | Class teacher, Enrolled learner |
| `/api/classrooms/{class_id}/assignments/{assignment_id}` | DELETE | Remove assignment | Class teacher |

### 7.6 Teacher Read Model (future — designed, not implemented)

| Endpoint | Method | Purpose | Permission |
|----------|--------|---------|------------|
| `/api/schools/{school_id}/dashboard/class-overview` | GET | Per-class: roster size, leaves needing practice, recent activity | Teacher (own classes) |
| `/api/classrooms/{class_id}/dashboard/progress` | GET | Per-learner: weak spots, session count, last active | Class teacher |
| `/api/classrooms/{class_id}/dashboard/weak-spots` | GET | Aggregate weak spots across the class (which leaves are hardest) | Class teacher |

These endpoints are **not implemented in Epsilon A**. They are defined here to validate that the data model supports them.

---

## 8. Proposed Frontend Surfaces (Designed, Not Implemented)

### 8.1 Owner/Admin School Management (`/owner/schools`)

- List of schools (table: name, slug, teacher count, learner count, created)
- Create school form (name, slug, description)
- School detail page: members, classrooms, settings editor
- Invite teacher form (email → creates user + school_membership)

**Where it lives:** Under the existing `/owner/*` route group. Adds a "Schools" nav item to `OwnerSidebar`.

### 8.2 Teacher Dashboard (`/dashboard`)

- **My Classes** overview: cards for each classroom with roster count, recent activity, weak-spot counts
- **Class Detail** (`/dashboard/classrooms/{id}`):
  - Roster: list of enrolled learners with last-active timestamp
  - Assignments: notebooks assigned to this class; "Assign material" action
  - Progress: per-leaf weak-spot heatmap (which leaves the class struggles with most)

**Where it lives:** New route group `/(teacher)/dashboard/`. A new `TeacherSidebar` component with: Dashboard, My Classes.

### 8.3 Learner Portal (`/learn`)

- **My Classes**: list of classrooms the learner is enrolled in
- **My Assignments**: notebooks assigned to those classes
- **My Progress**: personal review queue, weak spots, study history (existing `/vault` dashboard but scoped)

**Where it lives:** New route group `/(learner)/learn/`. The existing `/vault` dashboard becomes the learner's home view when in school mode.

### 8.4 Sidebar Changes

| Current Sidebar | Epsilon Sidebar |
|----------------|-----------------|
| `AppSidebar`: Vault, Materials, Libraries, Study | → `LearnerSidebar`: Learn, My Classes, My Materials, Review Queue |
| `OwnerSidebar`: Overview, AI Providers, Processing, Runtime | → `AdminSidebar`: Overview, Schools, AI Providers, Processing, Runtime |

A new **role router** component renders the correct sidebar based on the user's highest-privilege role:

```
User Role → Sidebar
──────────────────
owner    → AdminSidebar (sees everything)
teacher  → TeacherSidebar (owner-like but no AI config / schools management)
learner  → LearnerSidebar (existing vault dashboard)
```

---

## 9. Permission Model Sketch

### 9.1 Roles and Capabilities

| Capability | Owner | Teacher | Learner |
|------------|-------|---------|---------|
| Create/delete schools | ✅ | ❌ | ❌ |
| Manage AI providers | ✅ | ❌ | ❌ |
| Configure processing | ✅ | ❌ | ❌ |
| View runtime/job monitor | ✅ | ❌ | ❌ |
| Invite teachers to school | ✅ | ❌ | ❌ |
| Create classrooms | ✅ | ✅ (own school) | ❌ |
| Enroll/unenroll learners | ✅ | ✅ (own class) | ❌ |
| Assign notebooks | ✅ | ✅ (own class) | ❌ |
| View class progress | ✅ | ✅ (own class) | ❌ |
| View own review queue | ✅ | ❌ | ✅ |
| Study (create sessions, log events) | ✅ | ❌ | ✅ |
| View own weak spots | ✅ | ❌ | ✅ |
| Create notebooks | ✅ | ✅ | ✅ (if assigned) |
| Add materials to notebooks | ✅ | ✅ | ✅ (if assigned) |

### 9.2 Enforcement Points

Permission checks happen at three layers:

1. **API Middleware** — Authenticate the request (valid session token). Populate `request.user` with user object and `request.memberships` with active school memberships.
2. **Router Dependency** — A `require_school_membership(school_id, role="teacher")` FastAPI dependency checks that the user has the required role at the specified school. Returns 403 if not.
3. **Query Scoping** — Every study-related query adds `WHERE user_id = $current_user` when the data is learner-scoped. Teachers see data across their learners; owners see everything.

### 9.3 Authentication Flow (v1)

```
1. Owner deploys Vault, sets up single owner password (existing flow).
2. Owner creates a school via /owner/schools.
3. Owner invites teachers: enters email → system creates user + school_membership.
4. Teacher logs in with temporary password (reset on first login).
5. Teacher creates classrooms, enrolls learners.
6. Learners receive login credentials; they see only their assigned classrooms and notebooks.
7. All study activity is scoped: events carry user_id, sessions carry user_id.
```

**In single-learner mode** (no schools created), the existing password middleware continues to work. The owner is the only user; there is no teacher or learner distinction.

---

## 10. Privacy / Security Notes

1. **Learner reflection text is never persisted.** The check-yourself textarea content (`answerText` in `LeafStudyCard.tsx`) is component-local state. Epsilon does not change this. The API receives only `event_type` and `event_metadata` — never the learner's typed answer. This is a hard privacy boundary.

2. **Weak-spot computation is deterministic and auditable.** The heuristic runs on the backend from raw event counts. No AI model examines learner content to determine weak spots. This makes the system explainable and privacy-safe.

3. **Teacher sees aggregate signals, not raw answers.** The teacher dashboard (Epsilon E) shows weak-spot counts per leaf and per learner, but never the learner's typed reflections. A teacher can see "3 learners marked this leaf as needs_review" but cannot read what those learners wrote.

4. **Password hashing.** All passwords are hashed with bcrypt (or argon2) before storage. The `password_hash` field is never returned in API responses.

5. **Session tokens.** Auth tokens are random 64-byte hex strings, stored hashed in a `session` table. No JWTs in v1 (they add complexity without benefit for self-hosted deployments). Token expiry: 30 days, configurable.

6. **Data isolation is query-layer, not cryptographic.** Vault does not encrypt per-learner data. A bug in query scoping could expose data to the wrong user. Mitigation: every school-scoped query is tested with explicit "user A cannot see user B's data" test cases.

7. **No cross-learner AI training.** Vault does not use learner data to train AI models. The self-hosted nature means no data ever leaves the deployment.

---

## 11. Migration Plan

### Migration 17: School Primitives

```surql
── Migration 17: School, user, classroom, and enrollment tables
── for Vault's school-ready foundation (Epsilon B).

── 1. User accounts
DEFINE TABLE IF NOT EXISTS user SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS display_name ON TABLE user TYPE string;
DEFINE FIELD IF NOT EXISTS email ON TABLE user TYPE string
  ASSERT string::is::email($value);
DEFINE FIELD IF NOT EXISTS password_hash ON TABLE user TYPE string;
DEFINE FIELD IF NOT EXISTS avatar_url ON TABLE user TYPE option<string>;
DEFINE FIELD IF NOT EXISTS is_global_owner ON TABLE user TYPE bool DEFAULT false;
DEFINE FIELD IF NOT EXISTS active ON TABLE user TYPE bool DEFAULT true;
DEFINE FIELD IF NOT EXISTS last_login_at ON TABLE user TYPE option<datetime>;
DEFINE FIELD IF NOT EXISTS created ON TABLE user TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS updated ON TABLE user TYPE datetime DEFAULT time::now();

── 2. School
DEFINE TABLE IF NOT EXISTS school SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS name ON TABLE school TYPE string;
DEFINE FIELD IF NOT EXISTS slug ON TABLE school TYPE string;
DEFINE FIELD IF NOT EXISTS description ON TABLE school TYPE option<string>;
DEFINE FIELD IF NOT EXISTS settings ON TABLE school TYPE option<object> FLEXIBLE;
DEFINE FIELD IF NOT EXISTS active ON TABLE school TYPE bool DEFAULT true;
DEFINE FIELD IF NOT EXISTS created ON TABLE school TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS updated ON TABLE school TYPE datetime DEFAULT time::now();

── 3. School membership
DEFINE TABLE IF NOT EXISTS school_membership SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS school_id ON TABLE school_membership TYPE record<school>;
DEFINE FIELD IF NOT EXISTS user_id ON TABLE school_membership TYPE record<user>;
DEFINE FIELD IF NOT EXISTS role ON TABLE school_membership TYPE string
  ASSERT $value INSIDE ["owner", "teacher", "learner"];
DEFINE FIELD IF NOT EXISTS joined_at ON TABLE school_membership TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS active ON TABLE school_membership TYPE bool DEFAULT true;

── 4. Classroom
DEFINE TABLE IF NOT EXISTS classroom SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS school_id ON TABLE classroom TYPE record<school>;
DEFINE FIELD IF NOT EXISTS teacher_id ON TABLE classroom TYPE record<school_membership>;
DEFINE FIELD IF NOT EXISTS name ON TABLE classroom TYPE string;
DEFINE FIELD IF NOT EXISTS description ON TABLE classroom TYPE option<string>;
DEFINE FIELD IF NOT EXISTS subject ON TABLE classroom TYPE option<string>;
DEFINE FIELD IF NOT EXISTS grade_level ON TABLE classroom TYPE option<string>;
DEFINE FIELD IF NOT EXISTS active ON TABLE classroom TYPE bool DEFAULT true;
DEFINE FIELD IF NOT EXISTS created ON TABLE classroom TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS updated ON TABLE classroom TYPE datetime DEFAULT time::now();

── 5. Class enrollment
DEFINE TABLE IF NOT EXISTS class_enrollment SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS classroom_id ON TABLE class_enrollment TYPE record<classroom>;
DEFINE FIELD IF NOT EXISTS learner_id ON TABLE class_enrollment TYPE record<school_membership>;
DEFINE FIELD IF NOT EXISTS enrolled_at ON TABLE class_enrollment TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS active ON TABLE class_enrollment TYPE bool DEFAULT true;

── 6. Classroom assignment (notebook → classroom)
DEFINE TABLE IF NOT EXISTS classroom_assignment SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS classroom_id ON TABLE classroom_assignment TYPE record<classroom>;
DEFINE FIELD IF NOT EXISTS notebook_id ON TABLE classroom_assignment TYPE record<notebook>;
DEFINE FIELD IF NOT EXISTS assigned_by ON TABLE classroom_assignment TYPE record<school_membership>;
DEFINE FIELD IF NOT EXISTS assigned_at ON TABLE classroom_assignment TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS active ON TABLE classroom_assignment TYPE bool DEFAULT true;

── 7. Session token (optional — for auth)
DEFINE TABLE IF NOT EXISTS auth_session SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS user_id ON TABLE auth_session TYPE record<user>;
DEFINE FIELD IF NOT EXISTS token_hash ON TABLE auth_session TYPE string;
DEFINE FIELD IF NOT EXISTS expires_at ON TABLE auth_session TYPE datetime;
DEFINE FIELD IF NOT EXISTS created ON TABLE auth_session TYPE datetime DEFAULT time::now();
```

### Fields Added to Existing Tables (same migration)

```surql
── Add user/school scoping to existing Delta entities
── All fields are option<> so existing records are unaffected.

DEFINE FIELD IF NOT EXISTS user_id ON TABLE study_session TYPE option<record<user>>;
DEFINE FIELD IF NOT EXISTS school_id ON TABLE study_session TYPE option<record<school>>;

DEFINE FIELD IF NOT EXISTS user_id ON TABLE leaf_review_event TYPE option<record<user>>;

DEFINE FIELD IF NOT EXISTS user_id ON TABLE leaf_review_state TYPE option<record<user>>;

DEFINE FIELD IF NOT EXISTS school_id ON TABLE notebook TYPE option<record<school>>;
DEFINE FIELD IF NOT EXISTS created_by ON TABLE notebook TYPE option<record<user>>;
```

### Down Migration (Migration 17 Down)

```surql
── Rollback migration 17
REMOVE FIELD user_id ON TABLE leaf_review_state;
REMOVE FIELD user_id ON TABLE leaf_review_event;
REMOVE FIELD school_id ON TABLE study_session;
REMOVE FIELD user_id ON TABLE study_session;
REMOVE FIELD created_by ON TABLE notebook;
REMOVE FIELD school_id ON TABLE notebook;

DROP TABLE IF EXISTS classroom_assignment;
DROP TABLE IF EXISTS class_enrollment;
DROP TABLE IF EXISTS classroom;
DROP TABLE IF EXISTS school_membership;
DROP TABLE IF EXISTS school;
DROP TABLE IF EXISTS auth_session;
DROP TABLE IF EXISTS user;
```

### Registration in `async_migrate.py`

Add migration 17 to both `up_migrations` and `down_migrations` lists in `AsyncMigrationManager.__init__()`.

### Data Migration (Existing Owner)

When migration 17 runs, the system should:

1. Check if a global owner user record already exists (by `is_global_owner = true`)
2. If not, create a user record for the existing owner using the configured owner password:
   - Email: derive from environment or prompt (fallback: `admin@vault.local`)
   - Display name: "Administrator"
   - `is_global_owner = true`
3. Hash the existing password into `password_hash`
4. Log a startup message: *"Migrated owner to user account. Email: admin@vault.local"*

This ensures no existing deployment loses access after the migration.

---

## 12. Rollout Plan

Epsilon B through E are implementation phases. Epsilon A (this document) defines the design.

### Phase: Epsilon B — Backend Schema and Domain Models

1. Create migration 17 (SurrealQL file + async_migrate registration)
2. Add domain models:
   - `vault_core/domain/school.py`: `School`, `SchoolMembership`, `Classroom`, `ClassEnrollment`, `ClassroomAssignment`
   - `vault_core/domain/user.py`: `User`, `AuthSession`
   - Each model extends `ObjectModel` following the pattern in `study.py`
3. Add scoping fields to existing domain models:
   - `StudySession`: add `user_id` and `school_id` fields
   - `LeafReviewEvent`: add `user_id` field
   - `LeafReviewState`: add `user_id` field
   - `Notebook`: add `school_id` and `created_by` fields
4. Add domain methods: `get_learners_for_teacher()`, `get_assignments_for_learner()`, `get_enrolled_classrooms()`
5. Add factory/seeder for the owner migration
6. Validate: `uv run python -m pytest tests/`

### Phase: Epsilon C — API Endpoints

1. Add new FastAPI router: `api/routers/schools.py`
2. Add Pydantic models in `api/models.py`:
   - `SchoolCreate`, `SchoolResponse`, `SchoolUpdate`
   - `ClassroomCreate`, `ClassroomResponse`, `ClassroomUpdate`
   - `MemberAddRequest`, `MemberResponse`
   - `EnrollmentRequest`, `EnrollmentResponse`
   - `AssignmentRequest`, `AssignmentResponse`
   - `UserRegistrationRequest`, `LoginRequest`, `AuthResponse`
3. Add auth router: `api/routers/auth.py` (upgrade the existing auth middleware)
4. Register routers in `api/main.py`
5. Add dependencies for permission checks:
   - `require_school_membership(school_id, role)` → FastAPI dependency
   - `get_current_user()` → extracts user from auth token
6. Add backend tests for all new endpoints
7. Validate: `uv run python -m pytest tests/`

### Phase: Epsilon D — Owner/Teacher Management UI Shell

1. Add new TypeScript types in `frontend/src/lib/types/api.ts`:
   - `SchoolResponse`, `ClassroomResponse`, `MemberResponse`, `EnrollmentResponse`
2. Add API client in `frontend/src/lib/api/schools.ts`
3. Add new route: `frontend/src/app/(dashboard)/owner/schools/`
   - School list page
   - School detail page (members, classrooms)
   - Create school form
   - Invite teacher form
4. Add new route: `frontend/src/app/(dashboard)/owner/schools/[id]/classrooms/`
   - Classroom list + create form
   - Classroom detail (roster, assignments)
5. Update `OwnerSidebar.tsx`: add "Schools" nav item
6. Add role router: render correct sidebar based on user role
7. Auth login/logout UI for non-owner users
8. Validate: `cd frontend && npm test && npm run build`

### Phase: Epsilon E — Class-Level Learner Progress Read Model

1. Add teacher read-model endpoints:
   - `GET /api/schools/{school_id}/dashboard/class-overview`
   - `GET /api/classrooms/{class_id}/dashboard/progress`
   - `GET /api/classrooms/{class_id}/dashboard/weak-spots`
2. These endpoints aggregate from `leaf_review_event` and `leaf_review_state` filtered by enrolled learners
3. Add teacher dashboard UI (deferred to this phase — build the actual page):
   - Class overview cards
   - Learner progress table
   - Weak-spot heatmap per leaf
4. Add learner portal: `/learn` route showing assigned classrooms and personal progress
5. Validate: full suite + manual walkthrough of teacher flow

---

## 13. Testing Plan

### Unit Tests (Backend)

| Test | What it validates |
|------|-------------------|
| `test_create_school` | School is created with correct fields and slug |
| `test_create_duplicate_slug` | Duplicate slug returns validation error |
| `test_add_school_member` | User is added with correct role |
| `test_school_member_wrong_role` | Invalid role string is rejected |
| `test_create_classroom` | Classroom under a school with a teacher owner |
| `test_enroll_learner_in_classroom` | Learner membership can be enrolled |
| `test_enroll_non_learner` | Teacher/owner membership cannot be enrolled (role check) |
| `test_class_roster_count` | Enrolled learners are counted correctly |
| `test_assign_notebook_to_classroom` | Notebook can be assigned to a classroom |
| `test_unauthorized_user_cannot_access_classroom` | Non-member gets 403 |
| `test_single_learner_mode_unchanged` | Existing study flow works without school_id set |
| `test_owner_migration` | Existing owner is migrated to user record |

### Integration Tests

| Test | What it validates |
|------|-------------------|
| `test_learner_sees_only_own_study_data` | Query scoping: learner A cannot see learner B's events |
| `test_teacher_sees_class_aggregates` | Teacher can view their class's weak spots |
| `test_teacher_cannot_see_other_teachers_class` | Cross-class isolation |
| `test_owner_sees_all_schools` | Admin has full visibility |
| `test_login_flow` | Register → login → session token → authenticated request |
| `test_full_school_flow` | Create school → add teacher → create class → enroll learner → assign notebook → study → view progress |

### Frontend Tests

| Test | What it validates |
|------|-------------------|
| `renders school list for owner` | Schools page loads correctly |
| `renders create school form` | Form validation works |
| `renders class roster` | Enrolled learners displayed |
| `renders dashboard for teacher` | Teacher sees class overview |
| `excludes school nav for learner` | Learner sidebar has no school management |
| `auth login form works` | Login, logout, session persistence |
| `locale keys for school UI` | All new locale keys exist in all locale files |

---

## 14. Teacher Dashboard v1 — Read Model Specification

Although the teacher dashboard UI is deferred to Epsilon E, the read model is designed here to validate that the data model supports it.

### 14.1 Class Overview Card

```
GET /api/schools/{school_id}/dashboard/class-overview

Response:
{
  "classes": [
    {
      "classroom_id": "classroom:abc",
      "name": "Form 4A Mathematics",
      "subject": "Mathematics",
      "roster_size": 32,
      "assigned_notebooks": 3,
      "leaves_needing_practice": 14,        // across all enrolled learners
      "active_learners_last_7d": 28,
      "total_study_sessions_this_week": 47,
      "created": "2026-07-01T00:00:00Z"
    }
  ]
}
```

### 14.2 Learner Progress View

```
GET /api/classrooms/{class_id}/dashboard/progress

Response:
{
  "classroom": {
    "id": "classroom:abc",
    "name": "Form 4A Mathematics"
  },
  "learners": [
    {
      "learner_id": "user:xyz",
      "display_name": "Tendai M.",
      "leaves_reviewed": 12,
      "leaves_needing_practice": 3,
      "weak_spots": [
        { "note_id": "note:1", "title": "Trigonometric Identities", "review_count": 5, "last_reviewed": "2026-07-03T14:30:00Z" },
        { "note_id": "note:2", "title": "Quadratic Equations",    "review_count": 3, "last_reviewed": "2026-07-02T09:15:00Z" }
      ],
      "study_sessions_this_week": 4,
      "last_active": "2026-07-04T10:00:00Z"
    }
  ]
}
```

### 14.3 Class Weak-Spot Heatmap

```
GET /api/classrooms/{class_id}/dashboard/weak-spots

Response:
{
  "classroom": { "id": "classroom:abc", "name": "Form 4A Mathematics" },
  "leaves": [
    {
      "note_id": "note:1",
      "title": "Trigonometric Identities",
      "total_learners_struggling": 8,     // learners with is_weak_spot=true
      "total_needs_review_count": 23,      // sum across all learners
      "assigned_notebook": "Trigonometry Unit"
    }
  ]
}
```

### Query Strategy

The read model endpoints aggregate from `leaf_review_event` and `leaf_review_state`:

```
-- Learners enrolled in a class who have weak spots on this leaf
SELECT
  count() AS total_struggling,
  math::sum(review_count) AS total_reviews
FROM leaf_review_state
WHERE note_id = $note_id
  AND user_id IN (
    SELECT learner_id FROM class_enrollment
    WHERE classroom_id = $class_id AND active = true
  )
  AND needs_review = true
GROUP ALL
```

This is a query-time aggregation, not a precomputed table. It is fast enough for class sizes up to ~100 learners. If performance degrades, a materialized view can be added later.

---

## 15. Failure / Rollback Plan

| Failure mode | Impact | Recovery |
|-------------|--------|----------|
| Migration 17 fails (new tables) | API startup fails | Fix the migration SQL, restart. Existing data is untouched. |
| Migration 17 fails (field addition to existing tables) | API startup fails | `REMOVE FIELD` on any partially-added fields. The SurrealDB schema change is DDL-only, no data loss. |
| Auth system breaks existing login | Users cannot log in | Rollback: revert to password middleware. The old `.env` password still works as a fallback. |
| Query scoping bug leaks learner data | User A sees User B's study data | Fix the query, add test, deploy. In single-learner mode (no schools), this bug is impossible because `user_id` is null. |
| Teacher dashboard query too slow (>2s) for 50-learner class | Perceived sluggishness | Add a `weak_spot_summary` or `class_learner_progress` denormalized table updated by a periodic aggregation. |
| Slug collision on school creation | API returns error | Let the owner choose a different slug. Slugs are not shown to learners — only used internally. |
| `is_global_owner` flag set on multiple users | Two users with full system access | Enforce at the application layer: `SELECT count() FROM user WHERE is_global_owner = true` must be ≤1 during registration. |

**Rollback command (migration 17 down):**
```surql
REMOVE FIELD user_id ON TABLE leaf_review_state;
REMOVE FIELD user_id ON TABLE leaf_review_event;
REMOVE FIELD school_id ON TABLE study_session;
REMOVE FIELD user_id ON TABLE study_session;
REMOVE FIELD created_by ON TABLE notebook;
REMOVE FIELD school_id ON TABLE notebook;

DROP TABLE IF EXISTS classroom_assignment;
DROP TABLE IF EXISTS class_enrollment;
DROP TABLE IF EXISTS classroom;
DROP TABLE IF EXISTS school_membership;
DROP TABLE IF EXISTS auth_session;
DROP TABLE IF EXISTS school;
DROP TABLE IF EXISTS user;
```

No data loss — events, sessions, and notes remain intact. The `user_id` and `school_id` fields are simply removed from the schema.

---

## 16. Open Questions

1. **Should a teacher be a `school_membership` with `role = "teacher"` or a separate `teacher` table?**  
   *Decision:* A single `school_membership` table with a `role` field. This avoids a parallel table structure and makes it easy to promote a learner to teacher (or teacher to owner) by updating the role field.

2. **Should notebooks be assigned to classrooms directly, or should there be a catalog/curriculum layer?**  
   *Decision:* Direct assignment via `classroom_assignment` table for v1. A curriculum catalog (curated notebook collections) is a future concern.

3. **Should learner data be hard-deleted on unenrollment?**  
   *Decision:* Soft-delete (set `active = false`). Learner data remains for audit and historical analysis. A separate data retention policy can be implemented later.

4. **Should school-level AI provider overrides be allowed?**  
   *Decision:* Not in Epsilon. SchoolSettings uses the global AI providers. Per-school provider configuration adds significant complexity (credential isolation, rate limiting, billing). Defer to Epsilon+.

5. **Should the weak-spot heuristic be configurable per school?**  
   *Decision:* Yes — `SchoolSettings.defaultWeakSpotThreshold` overrides the global `≥2` default. This is a simple numeric override, not a full heuristic DSL.

6. **How should the owner migration work for new deployments?**  
   *Decision:* New deployments create the owner user record during initial setup (first-run wizard). Existing deployments get the migration logic described in §11.

---

## 17. Implementation Slices Summary

| Slice | Scope | Files | Validation |
|-------|-------|-------|------------|
| **Epsilon A** (this doc) | Design | `docs/architecture/vault_epsilon_school_primitives_design.md` | `git status --short` |
| **Epsilon B** | Backend schema + domain models | Migration 17, `domain/school.py`, `domain/user.py`, field additions to study/notebook models | `uv run python -m pytest tests/` |
| **Epsilon C** | API endpoints + auth | `routers/schools.py`, `routers/auth.py`, `models.py`, `main.py` | `uv run python -m pytest tests/` |
| **Epsilon D** | Owner/teacher management UI | Schools page, classroom management, role router, sidebar, login UI | `npm test` + `npm run build` |
| **Epsilon E** | Teacher dashboard + learner portal | Dashboard endpoints, classroom progress, learner `/learn` route | Full suite + manual E2E |

---

    *-- Rollback migration 18*
    *REMOVE FIELD IF EXISTS school_id ON TABLE notebook;*
    *REMOVE FIELD IF EXISTS created_by ON TABLE notebook;*
    *REMOVE FIELD IF EXISTS school_id ON TABLE source;*
    *REMOVE FIELD IF EXISTS created_by ON TABLE source;*
    *REMOVE FIELD IF EXISTS school_id ON TABLE note;*
    *REMOVE FIELD IF EXISTS user_id ON TABLE note;*
    *REMOVE FIELD IF EXISTS user_id ON TABLE study_session;*
    *REMOVE FIELD IF EXISTS school_id ON TABLE study_session;*
    *REMOVE FIELD IF EXISTS user_id ON TABLE leaf_review_event;*
    *REMOVE FIELD IF EXISTS user_id ON TABLE leaf_review_state;*
    *

No data loss — events, sessions, and notes remain intact. The `user_id` and `school_id` fields are simply removed from the schema.

---
*Prepared: 2026-07-04 · Git ref: `0595c15`*
