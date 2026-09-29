# Handled — Technical Specification

**Project:** Handled  
**Document:** Technical Specification  
**Status:** MVP Technical Baseline  
**Purpose:** Technical source of truth for implementation

---

## 1. Purpose

This document defines the technical architecture, domain model, database design, business rules, security principles, and implementation constraints for the Handled MVP.

The document exists to translate the product requirements into a technical design that can be implemented consistently.

The Project Overview explains what Handled is.

The Requirements document explains what Handled must do.

The Development Roadmap explains when and in what order features are developed.

This document explains how the MVP is intended to work technically.

The architecture should remain as simple as possible while supporting the core field-service workflow and providing a strong foundation for future development.

---

# 2. System Overview

Handled is a mobile-first full-stack field-service operations platform for small South African plumbing and electrical businesses.

The core workflow is:

> Turn a customer request into a scheduled, tracked, documented, and completed job.

The MVP consists of:

- A Vue frontend
- A Node.js/Express backend
- A MySQL database
- File/object storage for visit photos
- Authentication and authorization for business staff

High-level architecture:

```text
Vue Frontend
     |
     | HTTP / JSON
     ↓
Express API
     |
     ├── Authentication
     ├── Authorization
     ├── Validation
     ├── Controllers
     ├── Services
     ├── Business Rules
     └── Repositories / Database Access
              |
              ↓
          MySQL Database

              +

       File/Object Storage
       for visit photos
```

The frontend presents the interface and initiates user actions.

The backend is responsible for authentication, authorization, validation, business rules, state transitions, and database access.

The database is responsible for persistent data storage and structural integrity.

---

# 3. Technology Stack

## Frontend

- Vue
- JavaScript
- Vue Router
- Pinia
- Axios
- CSS

The frontend is mobile-first because technicians are expected to use Handled while working in the field.

## Backend

- Node.js
- Express
- JavaScript
- mysql2

The backend exposes a REST API.

No ORM is currently planned for the MVP.

Database access uses `mysql2` directly.

## Database

- MySQL

## File Storage

Visit photos are stored outside MySQL.

The database stores a reference to each file.

---

# 4. Application Architecture

The backend uses the following conceptual structure:

```text
Backend/
└── src/
    ├── routes/
    ├── controllers/
    ├── services/
    ├── middleware/
    ├── repositories/
    ├── validators/
    ├── utils/
    └── server.js
```

### Routes

Define API endpoints and connect HTTP requests to controllers.

Routes should not contain business logic.

### Controllers

Handle HTTP concerns:

- receive requests
- extract request data
- call services
- return HTTP responses

Controllers should not contain complex business rules.

### Services

Contain application and domain logic.

Examples:

- creating jobs
- scheduling visits
- starting visits
- completing visits
- applying visit completion outcomes
- creating significant job events

### Repositories

Handle database queries and persistence.

### Middleware

Handles cross-cutting concerns such as:

- authentication
- authorization
- validation
- error handling

---

# 5. Core Domain Model

The core domain concepts are:

- Business
- User
- Customer
- Job
- Visit
- Note
- Photo
- Material
- Job Event
- Job Sign-off

The central distinction is:

> **Job = the overall piece of work.**  
> **Visit = one physical attendance/appointment for that job.**

One job can have multiple visits.

Example:

```text
Job #1042
Customer: ABC Property Management
Problem: Burst pipe

Visit 1
Monday 09:00
Technician: Thabo
- Diagnose problem
- Temporary repair
- Parts required

Visit 2
Wednesday 14:00
Technician: Thabo
- Install replacement
- Test system
- Complete job
```

---

# 6. User Model

Handled has two authenticated staff roles in the MVP:

- MANAGER
- TECHNICIAN

Managers primarily handle planning and administration.

Technicians primarily handle field execution.

Customers are not authenticated Handled users in the MVP.

---

# 7. Customer Model

Customers are business records only.

They do not have:

- Handled accounts
- passwords
- customer dashboards
- customer navigation

Customer confirmation occurs on the technician's device.

---

# 8. Multi-Tenancy

Handled is a multi-business application.

Each business owns its:

- users
- customers
- jobs
- operational records

Major business-owned tables contain `business_id` directly:

- users
- customers
- jobs

Related records inherit ownership through their relationships.

Backend authorization must enforce tenant isolation.

The frontend is not a security boundary.

---

# 9. Database Design

The MVP contains exactly ten core tables:

```text
businesses
users
customers
jobs
job_visits
visit_notes
visit_photos
visit_materials
job_events
job_signoffs
```

The following sections are the **authoritative SQL-level schema definition**.

When implementing the database, do not infer alternative types, nullability, defaults, indexes, or constraints unless this specification is deliberately updated first.

---

# 10. Database Conventions

Unless explicitly stated otherwise:

### IDs

All primary keys use:

```sql
INT UNSIGNED AUTO_INCREMENT
```

### Foreign keys

All foreign-key columns use:

```sql
INT UNSIGNED
```

to match the referenced primary key.

### Timestamps

Application timestamps use:

```sql
DATETIME
```

Both `created_at` and `updated_at` are explicitly maintained by the application/database implementation.

### Boolean values

Boolean fields use:

```sql
BOOLEAN
```

### Text

Use:

- `VARCHAR(n)` for bounded strings
- `TEXT` for potentially longer free-form text

### Money

Monetary amounts use:

```sql
DECIMAL(10,2)
```

Do not use floating-point types for monetary values.

### ENUM

ENUM values must match the values explicitly defined in this document.

Do not add additional application states without updating this specification.

---

# 11. businesses

Represents a business using Handled.

| Column | SQL Type | Null | Default | Constraints |
|---|---|---|---|---|
| id | INT UNSIGNED | NO | AUTO_INCREMENT | PRIMARY KEY |
| name | VARCHAR(150) | NO | — | |
| phone | VARCHAR(30) | YES | NULL | |
| email | VARCHAR(255) | YES | NULL | |
| address | VARCHAR(255) | YES | NULL | |
| created_at | DATETIME | NO | — | |
| updated_at | DATETIME | NO | — | |
| business_code | VARCHAR(20) | NOT NULL | UNIQUE |

No unique constraint is required for `phone` or `email` in the MVP.

Indexes:

- PRIMARY KEY (`id`)

---

## Business Identifier

Each business has two identifiers:

1. `businesses.id`
   - Internal database identifier.
   - Used for foreign-key relationships.
   - Never used as the normal user-facing login identifier.

2. `businesses.business_code`
   - Human-facing business identifier.
   - Used during authentication to identify the user's business.
   - Globally unique.
   - Uppercase alphanumeric only.
   - Maximum length: 20 characters.

Example:

Business ID: 42
Business code: CTP001

The database ID and business code serve different purposes and must not be treated as interchangeable.

---

# 12. users

Represents authenticated Handled staff.

| Column | SQL Type | Null | Default | Constraints |
|---|---|---|---|---|
| id | INT UNSIGNED | NO | AUTO_INCREMENT | PRIMARY KEY |
| business_id | INT UNSIGNED | NO | — | FK → businesses.id |
| name | VARCHAR(150) | NO | — | |
| email | VARCHAR(255) | NO | — | |
| password_hash | VARCHAR(255) | NO | — | |
| role | ENUM('MANAGER','TECHNICIAN') | NO | — | |
| is_active | BOOLEAN | NO | TRUE | |
| created_at | DATETIME | NO | — | |
| updated_at | DATETIME | NO | — | |

Constraints:

```sql
PRIMARY KEY (id)
UNIQUE (business_id, email)
FOREIGN KEY (business_id) REFERENCES businesses(id)
```

Indexes:

```text
INDEX (business_id)
UNIQUE (business_id, email)
```

Users should normally be deactivated rather than deleted.

---

# 13. customers

Represents customers belonging to a business.

| Column | SQL Type | Null | Default | Constraints |
|---|---|---|---|---|
| id | INT UNSIGNED | NO | AUTO_INCREMENT | PRIMARY KEY |
| business_id | INT UNSIGNED | NO | — | FK → businesses.id |
| name | VARCHAR(150) | NO | — | |
| phone | VARCHAR(30) | YES | NULL | |
| email | VARCHAR(255) | YES | NULL | |
| address | VARCHAR(255) | YES | NULL | |
| customer_type | ENUM('INDIVIDUAL','BUSINESS') | NO | — | |
| created_at | DATETIME | NO | — | |
| updated_at | DATETIME | NO | — | |

Constraints:

```sql
PRIMARY KEY (id)
FOREIGN KEY (business_id) REFERENCES businesses(id)
```

Indexes:

```text
INDEX (business_id)
```

There is no unique constraint on customer phone or email in the MVP.

---

# 14. jobs

Represents the overall piece of work.

| Column | SQL Type | Null | Default | Constraints |
|---|---|---|---|---|
| id | INT UNSIGNED | NO | AUTO_INCREMENT | PRIMARY KEY |
| business_id | INT UNSIGNED | NO | — | FK → businesses.id |
| customer_id | INT UNSIGNED | NO | — | FK → customers.id |
| created_by | INT UNSIGNED | NO | — | FK → users.id |
| title | VARCHAR(200) | NO | — | |
| description | TEXT | YES | NULL | |
| service_type | VARCHAR(100) | YES | NULL | |
| status | ENUM('NEW','SCHEDULED','IN_PROGRESS','FOLLOW_UP_REQUIRED','COMPLETED','CUSTOMER_CONFIRMED','CLOSED') | NO | — | |
| service_address | VARCHAR(255) | NO | — | |
| invoice_number | VARCHAR(100) | YES | NULL | |
| invoice_amount | DECIMAL(10,2) | YES | NULL | |
| invoice_status | ENUM('NOT_INVOICED','INVOICED','PAID') | NO | 'NOT_INVOICED' | |
| created_at | DATETIME | NO | — | |
| updated_at | DATETIME | NO | — | |

Constraints:

```sql
PRIMARY KEY (id)
FOREIGN KEY (business_id) REFERENCES businesses(id)
FOREIGN KEY (customer_id) REFERENCES customers(id)
FOREIGN KEY (created_by) REFERENCES users(id)
```

Indexes:

```text
INDEX (business_id)
INDEX (customer_id)
INDEX (status)
INDEX (created_at)
```

The following fields deliberately do NOT exist on `jobs`:

- assigned_technician_id
- scheduled_start
- scheduled_end
- completion_summary
- completed_at
- closed_at
- priority

Those concepts belong elsewhere or are outside the MVP.

---

# 15. job_visits

Represents an individual physical attendance/appointment for a job.

| Column | SQL Type | Null | Default | Constraints |
|---|---|---|---|---|
| id | INT UNSIGNED | NO | AUTO_INCREMENT | PRIMARY KEY |
| job_id | INT UNSIGNED | NO | — | FK → jobs.id |
| technician_id | INT UNSIGNED | NO | — | FK → users.id |
| status | ENUM('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED') | NO | — | |
| scheduled_start | DATETIME | NO | — | |
| scheduled_end | DATETIME | NO | — | |
| completion_summary | TEXT | YES | NULL | |
| completed_at | DATETIME | YES | NULL | |
| created_at | DATETIME | NO | — | |
| updated_at | DATETIME | NO | — | |

Constraints:

```sql
PRIMARY KEY (id)
FOREIGN KEY (job_id) REFERENCES jobs(id)
FOREIGN KEY (technician_id) REFERENCES users(id)
```

Indexes:

```text
INDEX (job_id)
INDEX (technician_id)
INDEX (status)
INDEX (scheduled_start)
```

`completion_summary` is nullable because it is only required when the backend transitions a visit to `COMPLETED`.

That requirement is a business rule, not a simple column-level database requirement.

---

# 16. visit_notes

Stores notes associated with a visit.

| Column | SQL Type | Null | Default | Constraints |
|---|---|---|---|---|
| id | INT UNSIGNED | NO | AUTO_INCREMENT | PRIMARY KEY |
| visit_id | INT UNSIGNED | NO | — | FK → job_visits.id |
| created_by | INT UNSIGNED | NO | — | FK → users.id |
| note | TEXT | NO | — | |
| created_at | DATETIME | NO | — | |

Constraints:

```sql
PRIMARY KEY (id)
FOREIGN KEY (visit_id) REFERENCES job_visits(id)
FOREIGN KEY (created_by) REFERENCES users(id)
```

Indexes:

```text
INDEX (visit_id)
```

No `updated_at` field is required because notes are treated as historical records.

---

# 17. visit_photos

Stores references to photos associated with a visit.

| Column | SQL Type | Null | Default | Constraints |
|---|---|---|---|---|
| id | INT UNSIGNED | NO | AUTO_INCREMENT | PRIMARY KEY |
| visit_id | INT UNSIGNED | NO | — | FK → job_visits.id |
| uploaded_by | INT UNSIGNED | NO | — | FK → users.id |
| file_url | VARCHAR(500) | NO | — | |
| caption | VARCHAR(255) | YES | NULL | |
| created_at | DATETIME | NO | — | |

Constraints:

```sql
PRIMARY KEY (id)
FOREIGN KEY (visit_id) REFERENCES job_visits(id)
FOREIGN KEY (uploaded_by) REFERENCES users(id)
```

Indexes:

```text
INDEX (visit_id)
```

The actual image is stored outside MySQL.

---

# 18. visit_materials

Records materials used during a visit.

| Column | SQL Type | Null | Default | Constraints |
|---|---|---|---|---|
| id | INT UNSIGNED | NO | AUTO_INCREMENT | PRIMARY KEY |
| visit_id | INT UNSIGNED | NO | — | FK → job_visits.id |
| name | VARCHAR(150) | NO | — | |
| quantity | DECIMAL(10,2) | NO | — | |
| unit | VARCHAR(30) | NO | — | |
| created_by | INT UNSIGNED | NO | — | FK → users.id |
| created_at | DATETIME | NO | — | |

Constraints:

```sql
PRIMARY KEY (id)
FOREIGN KEY (visit_id) REFERENCES job_visits(id)
FOREIGN KEY (created_by) REFERENCES users(id)
```

Indexes:

```text
INDEX (visit_id)
```

This table represents material usage only.

It does not represent inventory.

---

# 19. job_events

Stores significant job lifecycle events.

| Column | SQL Type | Null | Default | Constraints |
|---|---|---|---|---|
| id | INT UNSIGNED | NO | AUTO_INCREMENT | PRIMARY KEY |
| job_id | INT UNSIGNED | NO | — | FK → jobs.id |
| visit_id | INT UNSIGNED | YES | NULL | FK → job_visits.id |
| user_id | INT UNSIGNED | YES | NULL | FK → users.id |
| event_type | ENUM('JOB_CREATED','VISIT_CREATED','TECHNICIAN_ASSIGNED','VISIT_STARTED','VISIT_COMPLETED','FOLLOW_UP_REQUIRED','CUSTOMER_CONFIRMED','JOB_CLOSED') | NO | — | |
| description | VARCHAR(500) | YES | NULL | |
| created_at | DATETIME | NO | — | |

Constraints:

```sql
PRIMARY KEY (id)
FOREIGN KEY (job_id) REFERENCES jobs(id)
FOREIGN KEY (visit_id) REFERENCES job_visits(id)
FOREIGN KEY (user_id) REFERENCES users(id)
```

Indexes:

```text
INDEX (job_id)
INDEX (visit_id)
INDEX (created_at)
```

`visit_id` is nullable because some events are job-level.

`user_id` is nullable because some events may not have a specific user associated with them.

`job_events` is not a general activity log.

It should contain significant lifecycle events only.

---

# 20. job_signoffs

Stores the customer's final confirmation.

| Column | SQL Type | Null | Default | Constraints |
|---|---|---|---|---|
| id | INT UNSIGNED | NO | AUTO_INCREMENT | PRIMARY KEY |
| job_id | INT UNSIGNED | NO | — | FK → jobs.id |
| customer_name | VARCHAR(150) | NO | — | |
| confirmed_at | DATETIME | NO | — | |
| confirmation_type | ENUM('TYPED_CONFIRMATION') | NO | — | |
| confirmation_data | TEXT | YES | NULL | |

Constraints:

```sql
PRIMARY KEY (id)
UNIQUE (job_id)
FOREIGN KEY (job_id) REFERENCES jobs(id)
```

The MVP allows one final sign-off per job.

---

# 21. Complete Foreign-Key Map

The database relationships are:

```text
users.business_id
    → businesses.id

customers.business_id
    → businesses.id

jobs.business_id
    → businesses.id

jobs.customer_id
    → customers.id

jobs.created_by
    → users.id

job_visits.job_id
    → jobs.id

job_visits.technician_id
    → users.id

visit_notes.visit_id
    → job_visits.id

visit_notes.created_by
    → users.id

visit_photos.visit_id
    → job_visits.id

visit_photos.uploaded_by
    → users.id

visit_materials.visit_id
    → job_visits.id

visit_materials.created_by
    → users.id

job_events.job_id
    → jobs.id

job_events.visit_id
    → job_visits.id

job_events.user_id
    → users.id

job_signoffs.job_id
    → jobs.id
```

---

# 22. Foreign-Key Delete Behaviour

Historical operational records must not be accidentally destroyed through cascading deletes.

Therefore:

- Do not use `ON DELETE CASCADE` on operational relationships where deleting a parent would remove historical records.
- Users should be deactivated rather than deleted.
- Businesses, jobs, visits, notes, photos, materials, events, and sign-offs should not be casually deleted.
- Where deletion behavior is not explicitly required by the MVP, prefer restrictive foreign-key behavior.

The exact SQL implementation should use restrictive/default foreign-key behavior unless a specific relationship requires another behavior.

---

# 23. Tenant Integrity

The database relationships do not by themselves guarantee that all related records belong to the same business.

For example:

```text
jobs.business_id
customers.business_id
```

could technically reference different businesses while still satisfying their individual foreign keys.

The backend must therefore validate tenant consistency before creating or modifying related records.

Example:

```text
Job.business_id = Business A
Customer.business_id = Business A
```

is valid.

```text
Job.business_id = Business A
Customer.business_id = Business B
```

must be rejected by the backend.

This is an application-level integrity rule.

---

# 24. Job Lifecycle

```text
NEW
 ↓
SCHEDULED
 ↓
IN_PROGRESS
 ↓
 ┌───────────────────────────┐
 │                           │
 ▼                           ▼
FOLLOW_UP_REQUIRED        COMPLETED
 │                           │
 │                           ▼
 │                    CUSTOMER_CONFIRMED
 │                           │
 │                           ▼
 │                         CLOSED
 │
 │ Manager schedules another visit
 ▼
SCHEDULED
 ↓
IN_PROGRESS
 ↓
...
```

---

# 25. Visit Lifecycle

```text
SCHEDULED
 ↓
IN_PROGRESS
 ↓
COMPLETED
```

or:

```text
SCHEDULED
 ↓
CANCELLED
```

A cancelled visit does not automatically cancel the overall job.

---

# 26. Action-Based Workflow

The frontend should expose meaningful actions instead of arbitrary status editing.

Examples:

- Start Visit
- Complete Visit

The backend validates whether each action is permitted.

---

# 27. Visit Completion Workflow

When completing a visit, the technician provides:

- completion summary
- completion outcome

The outcome is:

```text
JOB_COMPLETE
```

or:

```text
FOLLOW_UP_REQUIRED
```

### JOB_COMPLETE

```text
Visit → COMPLETED
Job → COMPLETED
```

### FOLLOW_UP_REQUIRED

```text
Visit → COMPLETED
Job → FOLLOW_UP_REQUIRED
```

The manager subsequently schedules another visit against the same job.

No separate follow-up visit table exists.

---

# 28. Customer Confirmation

After overall job completion:

```text
COMPLETED
    ↓
CUSTOMER_CONFIRMED
    ↓
CLOSED
```

Customer confirmation occurs on the technician's device in the MVP.

---

# 29. Business Rules

### BR-01 — Business ownership

Users, customers, and jobs belong to a business.

Backend access must enforce business ownership.

### BR-02 — User roles

Users are either MANAGER or TECHNICIAN.

### BR-03 — Job ownership

Every job belongs to exactly one business and customer.

### BR-04 — Multiple visits

A job may have multiple visits.

### BR-05 — Visit assignment

Technician assignment belongs to the visit.

### BR-06 — Visit completion

A visit cannot transition to COMPLETED without a completion summary.

### BR-07 — Visit completion outcome

When a technician completes a visit, they must indicate whether the overall job is complete or requires follow-up.

The backend validates the request and applies the corresponding job state transition.

### BR-08 — Follow-up

If follow-up is required:

```text
Visit → COMPLETED
Job → FOLLOW_UP_REQUIRED
```

A subsequent visit is created against the same job.

### BR-09 — Significant events only

`job_events` records important lifecycle events, not every operational database change.

### BR-10 — Job completion

If the technician indicates that the overall job is complete:

```text
Visit → COMPLETED
Job → COMPLETED
```

subject to backend validation.

### BR-11 — Customer confirmation

Customer confirmation applies to the overall completed job.

### BR-12 — Customer authentication

Customers do not have Handled accounts in the MVP.

### BR-13 — User deactivation

Users should be deactivated rather than deleted where historical records depend on them.

### BR-14 — Materials

Materials are usage records, not inventory.

### BR-15 — Lightweight billing

The MVP stores invoice number, invoice amount, and invoice status only.

### BR-16 — No priority system

The MVP does not include job priority scoring or priority levels.

---

# 30. Authentication and Authorization

Authentication will use:

- email
- password
- secure password hashing
- JWT-based authentication

Passwords must never be stored in plaintext.

Authorization will be business-aware and role-aware.

The backend is the final security boundary.

Handled authenticates MANAGER and TECHNICIAN users.

Customers do not authenticate in the MVP.

User login requires:

- Business code
- Email address
- Password

Authentication flow:

1. Receive business code, email, and password.
2. Validate the business code format.
3. Find the business using `business_code`.
4. Find the user using `business_id` and email.
5. Confirm that the user is active.
6. Verify the supplied password against `password_hash`.
7. Issue an authenticated session/token containing the user's identity, business, and role.

A failed business lookup, user lookup, inactive user check, or password verification must not reveal which specific authentication condition failed.

---

## Authentication Token

The authentication token must contain only the information required to identify and authorize the authenticated user.

Required claims:

- `sub` — authenticated user ID
- `businessId` — authenticated user's business ID
- `role` — authenticated user's role

The token must not contain:

- password or password hash
- customer data
- job data
- visit data
- notes
- photos
- billing information
- other unnecessary application data

The backend must treat the token as the source of authenticated identity, but must still enforce resource ownership and business rules on every protected operation.

---

## Authentication and Authorization

Authentication answers:

"Who is this user?"

Authorization answers:

"What is this authenticated user allowed to do?"

Tenant isolation answers:

"Does the requested resource belong to this user's business?"

All three are required for protected operations.

A valid JWT alone does not grant access to arbitrary resources.

Role checks alone are also insufficient. A user must be authorized by both role and business/resource ownership where applicable.

---

## Business Code Validation

Business codes must:

- be 1–20 characters
- contain only `A-Z` and `0-9`
- be stored in uppercase
- be globally unique
- not contain whitespace
- not contain punctuation or special characters

The API must validate business codes before attempting authentication.

User-entered business codes may be normalized to uppercase before lookup so that `ctp001` and `CTP001` resolve consistently.

The canonical stored value remains uppercase.

Schema changes made after an existing migration has been applied must be implemented through a new migration.

Applied migrations must not be rewritten casually.

For example, adding `businesses.business_code` after `001_initial_schema.sql` has been applied requires a new migration rather than modifying `001_initial_schema.sql`.

---

## User Activation

Users are deactivated using `is_active = FALSE` rather than being deleted when historical records depend on the user.

Inactive users:

- cannot authenticate
- cannot receive new assignments
- cannot perform authenticated operational actions

Existing historical records associated with an inactive user remain intact.

---

# 31. Technician Authorization

Before a technician starts or completes a visit, the backend should verify:

1. The user is authenticated.
2. The user belongs to the same business as the job.
3. The user has the appropriate role.
4. The visit belongs to the relevant job.
5. The visit is assigned to that technician.
6. The visit is currently in a valid state for the requested action.

---

# 32. Validation Strategy

Validation occurs at several levels:

### Frontend

Immediate user feedback.

### Request/API validation

Checks request structure and data types.

### Business-rule validation

Services verify whether an operation is allowed.

### Database constraints

The database enforces structural integrity.

No single layer is responsible for every validation rule.

---

# 33. Transactional Operations

Operations that modify multiple related records should use database transactions where consistency matters.

For example, completing a visit may require:

```text
Update visit
    ↓
Update job
    ↓
Create job event
```

These operations should succeed or fail together.

---

# 34. Database Indexing Strategy

Indexes exist to support common queries rather than being added indiscriminately.

The MVP requires the following indexes:

### businesses

```text
PRIMARY KEY (id)
```

### users

```text
PRIMARY KEY (id)
INDEX (business_id)
UNIQUE (business_id, email)
```

### customers

```text
PRIMARY KEY (id)
INDEX (business_id)
```

### jobs

```text
PRIMARY KEY (id)
INDEX (business_id)
INDEX (customer_id)
INDEX (status)
INDEX (created_at)
```

### job_visits

```text
PRIMARY KEY (id)
INDEX (job_id)
INDEX (technician_id)
INDEX (status)
INDEX (scheduled_start)
```

### visit_notes

```text
PRIMARY KEY (id)
INDEX (visit_id)
```

### visit_photos

```text
PRIMARY KEY (id)
INDEX (visit_id)
```

### visit_materials

```text
PRIMARY KEY (id)
INDEX (visit_id)
```

### job_events

```text
PRIMARY KEY (id)
INDEX (job_id)
INDEX (visit_id)
INDEX (created_at)
```

### job_signoffs

```text
PRIMARY KEY (id)
UNIQUE (job_id)
```

---

# 35. Database Migration Strategy

Database schema changes must be versioned and repeatable.

If a migration system is not already present, implement a lightweight migration approach.

Example:

```text
001_create_businesses
002_create_users
003_create_customers
004_create_jobs
005_create_job_visits
006_create_visit_notes
007_create_visit_photos
008_create_visit_materials
009_create_job_events
010_create_job_signoffs
```

Future schema changes should be added as new migrations.

Previously applied migrations should not be rewritten unless there is a deliberate database migration strategy for doing so.

---

# 36. File Storage

Visit photos are stored outside the relational database.

The database stores metadata and file references.

Workflow:

```text
Technician
    ↓
Upload photo
    ↓
Backend validation
    ↓
File/Object Storage
    ↓
Store file reference in MySQL
```

---

# 37. MVP Billing

Billing is intentionally lightweight.

Fields:

```text
invoice_number
invoice_amount
invoice_status
```

Invoice status:

```text
NOT_INVOICED
INVOICED
PAID
```

No full accounting or payment processing is implemented.

---

# 38. MVP Exclusions

The following are outside the MVP:

- customer login
- customer portal
- dedicated multi-location entity
- inventory management
- suppliers
- purchase orders
- full accounting
- tax calculations
- payment processing
- line-item invoicing
- digital signature infrastructure
- GPS tracking
- route optimization
- AI scheduling
- AI summaries
- automated WhatsApp workflows
- advanced reporting
- priority scoring

---

# 39. Implementation Principles

### Keep domain concepts explicit

Use separate entities when they represent genuinely different concepts.

### Prefer actions over arbitrary state editing

Users perform meaningful actions rather than directly editing status fields.

### Backend owns business rules

Frontend controls are not security boundaries.

### Keep the database relational

Use explicit relationships and constraints.

### Avoid premature abstraction

Do not introduce infrastructure before the application requires it.

### Keep dependencies minimal

Add dependencies only when they solve a demonstrated problem.

### Preserve historical information

Avoid destructive deletion where historical information would be lost.

### Build around the core workflow

```text
Customer request
      ↓
Job
      ↓
Scheduled visit
      ↓
Technician execution
      ↓
Documentation
      ↓
Completion / follow-up
      ↓
Customer confirmation
      ↓
Closure
```

---

# 40. Current Implementation Boundary

Implementation should progress through these layers:

```text
1. Database/schema
        ↓
2. Authentication
        ↓
3. Authorization
        ↓
4. Backend foundation
        ↓
5. Job/visit API
        ↓
6. Frontend foundation
        ↓
7. Manager workflows
        ↓
8. Technician workflows
        ↓
9. Customer confirmation
        ↓
10. Validation/testing/security review
```

Each layer should be implemented and verified before unnecessarily expanding into the next.

---

# 41. Source of Truth

The documentation hierarchy is:

### Project Overview

Source of truth for:

- product purpose
- product concept
- target users
- overall problem

### Requirements

Source of truth for:

- functional requirements
- user capabilities
- MVP scope

### Development Roadmap

Source of truth for:

- implementation sequence
- project milestones

### Technical Specification

Source of truth for:

- system architecture
- technical design
- domain model
- database schema
- SQL data types
- nullability
- defaults
- indexes
- constraints
- foreign keys
- technical business rules
- security principles
- implementation boundaries

If implementation reveals a conflict, do not silently reinterpret the architecture.

The relevant documentation must be updated deliberately.

---

# 42. Current Technical Status

Established:

- Handled repository
- Vue frontend
- Node.js/Express backend
- MySQL database choice
- mysql2 database access
- initial backend health endpoint
- core product workflow
- Job/Visit domain model
- MVP database model
- business rules
- MVP exclusions
- technical architecture

The next implementation task is the **database/schema layer**.

Authentication and API implementation should begin only after the database foundation has been implemented and reviewed.