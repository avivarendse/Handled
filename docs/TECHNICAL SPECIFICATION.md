# **Handled — Technical Specification**

**Project:** Handled  
**Document:** Technical Specification  
**Status:** MVP Technical Baseline  
**Purpose:** Technical source of truth for implementation

---

## **1\. Purpose**

This document defines the technical architecture, domain model, database design, business rules, security principles, and implementation constraints for the Handled MVP.

The document exists to translate the product requirements into a technical design that can be implemented consistently.

The Project Overview explains what Handled is.

The Requirements document explains what Handled must do.

The Development Roadmap explains when and in what order features are developed.

This document explains **how the MVP is intended to work technically**.

The architecture should remain as simple as possible while supporting the core field-service workflow and providing a strong foundation for future development.

---

# **2\. System Overview**

Handled is a mobile-first full-stack field-service operations platform for small South African plumbing and electrical businesses.

The core workflow is:

> Turn a customer request into a scheduled, tracked, documented, and completed job.

The MVP consists of:

* A Vue frontend  
* A Node.js/Express backend  
* A MySQL database  
* File/object storage for visit photos  
* Authentication and authorization for business staff

The high-level architecture is:

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
                
              \+  
                
       File/Object Storage  
       for visit photos

The frontend is responsible for presenting the interface and initiating user actions.

The backend is responsible for authentication, authorization, validation, business rules, state transitions, and database access.

The database is responsible for persistent data storage and structural integrity.

---

# **3\. Technology Stack**

## **Frontend**

* Vue  
* JavaScript  
* Vue Router  
* Pinia  
* Axios  
* CSS

The frontend will be mobile-first because technicians are expected to use Handled while working in the field.

---

## **Backend**

* Node.js  
* Express  
* JavaScript  
* mysql2

The backend will expose a REST API.

No ORM is currently planned for the MVP.

Database access will use mysql2 directly.

---

## **Database**

* MySQL

MySQL is responsible for persistent application data, relationships, constraints, indexes, and structured business records.

---

## **File Storage**

Visit photos will not be stored as binary data inside MySQL.

The actual image file will be stored using file/object storage.

The database will store a reference to the file, such as its URL or storage location.

---

# **4\. Application Architecture**

The backend will use a layered structure:

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

## **Routes**

Routes define API endpoints and connect HTTP requests to controllers.

Routes should not contain business logic.

---

## **Controllers**

Controllers handle HTTP concerns.

They are responsible for:

* receiving requests  
* extracting parameters/body data  
* calling appropriate services  
* returning HTTP responses

Controllers should not contain complex business rules.

---

## **Services**

Services contain application and domain logic.

Examples include:

* creating jobs  
* scheduling visits  
* starting visits  
* completing visits  
* applying visit completion outcomes  
* creating significant job events

Services are responsible for enforcing workflow rules.

---

## **Repositories**

Repositories handle database access.

They are responsible for queries and persistence rather than deciding whether an operation is allowed.

---

## **Middleware**

Middleware handles cross-cutting concerns such as:

* authentication  
* authorization  
* request validation where appropriate  
* error handling

---

# **5\. Core Domain Model**

The central domain concepts are:

* Business  
* User  
* Customer  
* Job  
* Visit  
* Note  
* Photo  
* Material  
* Job Event  
* Job Sign-off

The most important distinction is:

> **Job \= the overall piece of work.**  
> **Visit \= one physical attendance/appointment for that job.**

A single job can therefore have multiple visits.

Example:

Job \#1042  
Customer: ABC Property Management  
Problem: Burst pipe

Visit 1  
Monday 09:00  
Technician: Thabo  
\- Diagnose problem  
\- Temporary repair  
\- Parts required

Visit 2  
Wednesday 14:00  
Technician: Thabo  
\- Install replacement  
\- Test system  
\- Complete job

This distinction is fundamental to the Handled architecture.

---

# **6\. User Model**

Handled has two authenticated staff roles in the MVP.

## **Manager**

Managers are responsible primarily for planning and administration.

They can:

* create jobs  
* manage customers  
* schedule visits  
* assign technicians  
* schedule follow-up visits  
* review jobs  
* review job history  
* manage basic billing information  
* manage staff accounts

---

## **Technician**

Technicians are responsible primarily for field execution.

They can:

* view assigned visits  
* view job/customer information  
* start visits  
* add notes  
* add photos  
* record materials used  
* complete visits  
* provide a completion summary  
* indicate whether the overall job is complete or requires follow-up  
* participate in customer confirmation

Technicians should not have unrestricted ability to arbitrarily change job states.

---

# **7\. Customer Model**

Customers are **not authenticated Handled users in the MVP**.

A customer is a business record containing information such as:

* name  
* phone  
* email  
* address  
* customer type

Customers do not have:

* passwords  
* login accounts  
* customer navigation  
* customer dashboards

The customer interacts with the business through normal communication channels such as phone, WhatsApp, or email.

Customer confirmation occurs on the technician's device.

A future version may introduce secure customer confirmation links through channels such as WhatsApp, SMS, or email.

---

# **8\. Multi-Tenancy**

Handled is designed as a multi-business application.

Each business owns its:

* users  
* customers  
* jobs  
* visits  
* operational records

Major business-owned tables contain business\_id directly:

* users  
* customers  
* jobs

Other records inherit business ownership through their relationships.

For example:

business  
   ↓  
job  
   ↓  
job\_visit  
   ↓  
visit\_note

The backend must ensure that authenticated users can only access records belonging to their own business.

For example:

SELECT \*  
FROM jobs  
WHERE id \= ?  
AND business\_id \= ?;

The business\_id condition is part of the tenant-isolation strategy.

The frontend is not a security boundary.

Hiding another business's records in Vue is not sufficient. Backend authorization must enforce tenant isolation.

---

# **9\. Database Design**

The MVP contains ten core tables:

businesses  
users  
customers  
jobs  
job\_visits  
visit\_notes  
visit\_photos  
visit\_materials  
job\_events  
job\_signoffs  
---

## **9.1 businesses**

Represents a business using Handled.

businesses  
\----------  
id  
name  
phone  
email  
address  
created\_at  
updated\_at  
---

## **9.2 users**

Represents authenticated Handled staff.

users  
\-----  
id  
business\_id  
name  
email  
password\_hash  
role  
is\_active  
created\_at  
updated\_at

Roles:

MANAGER  
TECHNICIAN

User email uniqueness is scoped to the business:

UNIQUE (business\_id, email)

Users should be deactivated rather than deleted where historical records depend on them.

---

## **9.3 customers**

Represents customers belonging to a business.

customers  
\---------  
id  
business\_id  
name  
phone  
email  
address  
customer\_type  
created\_at  
updated\_at

Customer types:

INDIVIDUAL  
BUSINESS  
---

## **9.4 jobs**

Represents the overall piece of work.

jobs  
\----  
id  
business\_id  
customer\_id  
created\_by  
title  
description  
service\_type  
status  
service\_address  
invoice\_number  
invoice\_amount  
invoice\_status  
created\_at  
updated\_at

Job status:

NEW  
SCHEDULED  
IN\_PROGRESS  
FOLLOW\_UP\_REQUIRED  
COMPLETED  
CUSTOMER\_CONFIRMED  
CLOSED

The following do **not** belong on jobs:

* assigned technician  
* scheduled start  
* scheduled end  
* completion summary  
* visit completion timestamp

These belong to job\_visits.

---

## **9.5 job\_visits**

Represents a physical visit/appointment associated with a job.

job\_visits  
\----------  
id  
job\_id  
technician\_id  
status  
scheduled\_start  
scheduled\_end  
completion\_summary  
completed\_at  
created\_at  
updated\_at

Visit status:

SCHEDULED  
IN\_PROGRESS  
COMPLETED  
CANCELLED

A job may contain multiple visits.

---

## **9.6 visit\_notes**

Stores notes associated with a visit.

visit\_notes  
\-----------  
id  
visit\_id  
created\_by  
note  
created\_at

Notes are historical records and do not initially require an updated\_at field.

---

## **9.7 visit\_photos**

Stores references to photos associated with a visit.

visit\_photos  
\------------  
id  
visit\_id  
uploaded\_by  
file\_url  
caption  
created\_at

The actual image is stored outside MySQL.

---

## **9.8 visit\_materials**

Records materials used during a visit.

visit\_materials  
\---------------  
id  
visit\_id  
name  
quantity  
unit  
created\_by  
created\_at

This is a usage record, not an inventory system.

The MVP does not track:

* stock levels  
* suppliers  
* purchase orders  
* warehouse inventory  
* automatic inventory deductions

---

## **9.9 job\_events**

Stores significant lifecycle events.

job\_events  
\----------  
id  
job\_id  
visit\_id  
user\_id  
event\_type  
description  
created\_at

Supported event types:

JOB\_CREATED  
VISIT\_CREATED  
TECHNICIAN\_ASSIGNED  
VISIT\_STARTED  
VISIT\_COMPLETED  
FOLLOW\_UP\_REQUIRED  
CUSTOMER\_CONFIRMED  
JOB\_CLOSED

visit\_id is nullable because some events are job-level.

user\_id is nullable because some events may not have a specific user associated with them.

### **Event philosophy**

job\_events is not a general activity log.

The following do not automatically require events:

* adding a note  
* uploading a photo  
* adding a material  
* ordinary database updates

Events represent significant lifecycle milestones.

Current state remains stored in the relevant status fields.

Events provide historical context rather than acting as the source of truth for current state.

---

## **9.10 job\_signoffs**

Stores the customer's final confirmation.

job\_signoffs  
\------------  
id  
job\_id  
customer\_name  
confirmed\_at  
confirmation\_type  
confirmation\_data

The MVP allows one final sign-off per job:

UNIQUE (job\_id)

The confirmation represents confirmation of the recorded completion.

It does not represent:

* payment  
* a legal waiver  
* a full digital signature system

---

# **10\. Database Relationships**

The core relationships are:

users.business\_id → businesses.id

customers.business\_id → businesses.id

jobs.business\_id → businesses.id  
jobs.customer\_id → customers.id  
jobs.created\_by → users.id

job\_visits.job\_id → jobs.id  
job\_visits.technician\_id → users.id

visit\_notes.visit\_id → job\_visits.id  
visit\_notes.created\_by → users.id

visit\_photos.visit\_id → job\_visits.id  
visit\_photos.uploaded\_by → users.id

visit\_materials.visit\_id → job\_visits.id  
visit\_materials.created\_by → users.id

job\_events.job\_id → jobs.id  
job\_events.visit\_id → job\_visits.id  
job\_events.user\_id → users.id

job\_signoffs.job\_id → jobs.id

Historical operational records should not disappear through careless cascading deletes.

Deactivation/archiving should generally be preferred where historical records must remain available.

---

# **11\. Job Lifecycle**

The job lifecycle is:

NEW  
 ↓  
SCHEDULED  
 ↓  
IN\_PROGRESS  
 ↓  
 ┌───────────────────────────┐  
 │                           │  
 ▼                           ▼  
FOLLOW\_UP\_REQUIRED        COMPLETED  
 │                           │  
 │                           ▼  
 │                    CUSTOMER\_CONFIRMED  
 │                           │  
 │                           ▼  
 │                         CLOSED  
 │  
 │ Manager schedules another visit  
 ▼  
SCHEDULED  
 ↓  
IN\_PROGRESS  
 ↓  
...

A job can therefore move through multiple visit cycles.

---

# **12\. Visit Lifecycle**

A normal visit follows:

SCHEDULED  
 ↓  
IN\_PROGRESS  
 ↓  
COMPLETED

A visit may also be cancelled:

SCHEDULED  
 ↓  
CANCELLED

Cancelling a visit does not automatically cancel the overall job.

---

# **13\. Action-Based Workflow**

The frontend should expose meaningful actions rather than allowing users to manipulate arbitrary status fields.

Examples:

Start Visit  
Complete Visit

rather than:

Change Status

This makes the interface reflect actual business actions.

The backend remains responsible for validating whether an action is permitted.

---

# **14\. Visit Completion Workflow**

When a technician completes a visit, they provide:

* completion summary  
* completion outcome

The completion outcome is one of:

JOB\_COMPLETE  
FOLLOW\_UP\_REQUIRED

The backend validates the request and applies the appropriate state transition.

---

## **14.1 Job complete**

When the technician indicates that the overall job is complete:

Visit → COMPLETED  
Job → COMPLETED

A significant visit-completion event is recorded.

---

## **14.2 Follow-up required**

When the technician indicates that more work is required:

Visit → COMPLETED  
Job → FOLLOW\_UP\_REQUIRED

Significant events are recorded for:

VISIT\_COMPLETED  
FOLLOW\_UP\_REQUIRED

The manager then schedules another visit against the same job.

No separate follow\_up\_visits table is required.

A follow-up is simply another job\_visits record.

---

# **15\. Customer Confirmation**

Once the overall job has been completed, the customer reviews the completion information on the technician's device.

The customer confirms the recorded completion.

The job then moves to:

COMPLETED  
 ↓  
CUSTOMER\_CONFIRMED  
 ↓  
CLOSED

The MVP treats customer confirmation as the final confirmation step before closure.

Future versions may introduce more sophisticated customer confirmation mechanisms.

---

# **16\. Business Rules**

The following rules form the technical baseline for the MVP.

### **BR-01 — Business ownership**

Users, customers, and jobs belong to a business.

Backend access must enforce business ownership.

---

### **BR-02 — User roles**

Users are either:

MANAGER  
TECHNICIAN

Customer accounts do not exist in the MVP.

---

### **BR-03 — Job ownership**

Every job belongs to exactly one business and customer.

---

### **BR-04 — Multiple visits**

A job may have multiple visits.

Visits represent individual physical attendances associated with the same overall job.

---

### **BR-05 — Visit assignment**

Technician assignment belongs to the visit rather than the overall job.

---

### **BR-06 — Visit completion**

A visit cannot transition to COMPLETED without a completion summary.

This is a backend business rule rather than merely a database nullability constraint.

---

### **BR-07 — Visit completion outcome**

When a technician completes a visit, they must indicate whether the overall job is complete or requires follow-up.

The backend validates the request and applies the corresponding job state transition.

---

### **BR-08 — Follow-up**

If a technician indicates that follow-up is required:

Visit → COMPLETED  
Job → FOLLOW\_UP\_REQUIRED

A subsequent visit is created against the same job.

---

### **BR-09 — Significant events only**

job\_events records important lifecycle events.

It is not a general activity log and should not record every operational database change.

---

### **BR-10 — Job completion**

If the technician indicates that the overall job is complete:

Visit → COMPLETED  
Job → COMPLETED

subject to backend validation.

---

### **BR-11 — Customer confirmation**

Customer confirmation applies to the overall completed job.

---

### **BR-12 — Customer authentication**

Customers do not have Handled accounts or passwords in the MVP.

---

### **BR-13 — User deactivation**

Users should be deactivated rather than deleted where historical records depend on them.

---

### **BR-14 — Materials**

Materials are usage records associated with visits.

They do not constitute inventory management.

---

### **BR-15 — Lightweight billing**

The MVP supports basic invoice information:

* invoice number  
* invoice amount  
* invoice status

The MVP does not implement full accounting or payment processing.

---

### **BR-16 — No priority system**

The MVP does not include job priority scoring or priority levels.

---

# **17\. Authentication and Authorization**

Authentication will use:

* email  
* password  
* securely hashed password storage  
* JWT-based authentication

Passwords must never be stored in plaintext.

The backend will be responsible for verifying authenticated users.

Authorization will be role-aware and business-aware.

For example:

Authenticated user  
        ↓  
Identify user  
        ↓  
Identify business  
        ↓  
Check role  
        ↓  
Check resource ownership  
        ↓  
Allow or reject operation

Frontend route guards and hidden buttons may improve user experience but are not security mechanisms.

The backend is the final authority.

---

# **18\. Technician Authorization**

A technician should only be able to execute field actions for visits they are authorized to work on.

For example, before starting or completing a visit, the backend should verify:

1. The user is authenticated.  
2. The user belongs to the same business as the job.  
3. The user is a technician where technician privileges are required.  
4. The visit belongs to the relevant job.  
5. The visit is assigned to that technician.  
6. The visit is currently in a valid state for the requested action.

The frontend must not be trusted to enforce these rules.

---

# **19\. Tenant Integrity**

The database establishes relationships, but some cross-record business rules require backend validation.

For example:

jobs.business\_id  
customers.business\_id

must refer to the same business.

A normal foreign key does not automatically guarantee that relationship.

The backend must therefore verify tenant consistency when creating or modifying related records.

This principle applies throughout the application.

---

# **20\. File Storage**

Visit photos are stored outside the relational database.

The workflow is:

Technician  
    ↓  
Upload photo  
    ↓  
Backend validates request  
    ↓  
File storage  
    ↓  
Database stores file reference

The database stores metadata such as:

* visit  
* uploader  
* file URL/reference  
* caption  
* creation timestamp

The MVP does not define a specific cloud storage provider yet.

---

# **21\. Validation Strategy**

Validation occurs at multiple levels.

### **Frontend validation**

Used primarily for immediate user feedback.

### **API/request validation**

Ensures incoming requests have the correct structure and data types.

### **Business-rule validation**

Services verify whether the requested operation is allowed according to the current application state.

### **Database constraints**

The database enforces structural integrity such as:

* required fields  
* foreign keys  
* unique constraints  
* valid enum values  
* numeric types

No single layer should be relied upon to enforce every rule.

---

# **22\. Error Handling**

The backend should return consistent HTTP responses.

Errors should distinguish between categories such as:

400 — Invalid request  
401 — Unauthenticated  
403 — Unauthorized  
404 — Resource not found  
409 — State/conflict error  
500 — Unexpected server error

The exact API error format will be defined during backend implementation.

Internal implementation details and sensitive information should not be exposed to clients.

---

# **23\. Database Indexing**

Indexes should support common application queries.

Important indexes include:

users:  
    business\_id  
    UNIQUE (business\_id, email)

customers:  
    business\_id

jobs:  
    business\_id  
    customer\_id  
    status  
    created\_at

job\_visits:  
    job\_id  
    technician\_id  
    status  
    scheduled\_start

visit\_notes:  
    visit\_id

visit\_photos:  
    visit\_id

visit\_materials:  
    visit\_id

job\_events:  
    job\_id  
    visit\_id  
    created\_at

job\_signoffs:  
    UNIQUE (job\_id)

Indexes should be added deliberately rather than indiscriminately.

---

# **24\. Database Migration Strategy**

Database schema changes should be versioned and repeatable.

The project should use a maintainable migration approach rather than manually modifying a production database.

Each schema change should be represented by a migration.

Examples:

001\_create\_businesses  
002\_create\_users  
003\_create\_customers  
...

The exact migration tooling can remain lightweight and should not introduce an ORM.

Future schema changes should be added as new migrations rather than rewriting historical migrations that have already been applied.

---

# **25\. Transactional Operations**

Operations that modify multiple related records should use database transactions where consistency matters.

For example, completing a visit may involve:

Update visit  
Update job  
Create job event

These operations should succeed or fail together.

A partial completion could leave the job in an inconsistent state.

Therefore, the service layer should use a database transaction for multi-step state-changing operations.

---

# **26\. MVP Billing**

Billing is intentionally lightweight.

The MVP stores:

invoice\_number  
invoice\_amount  
invoice\_status

Supported invoice statuses:

NOT\_INVOICED  
INVOICED  
PAID

The MVP does not implement:

* tax calculations  
* line-item invoices  
* payment processing  
* payment gateways  
* accounting integrations  
* reconciliation  
* financial reporting

These can be considered later if product validation supports them.

---

# **27\. MVP Exclusions**

The following are intentionally outside the MVP:

* Customer login  
* Customer portal  
* Multi-location entity  
* Inventory management  
* Suppliers  
* Purchase orders  
* Full accounting  
* Tax calculations  
* Payment processing  
* Line-item invoicing  
* Digital signature infrastructure  
* GPS tracking  
* Route optimization  
* AI scheduling  
* AI-generated summaries  
* Automated WhatsApp workflows  
* Advanced reporting  
* Priority scoring

These exclusions prevent the MVP from expanding beyond its core field-service workflow.

---

# **28\. Future Extension Areas**

The architecture should leave room for future features without implementing them prematurely.

Potential future capabilities include:

* customer secure confirmation links  
* WhatsApp/SMS workflows  
* richer invoicing  
* payments  
* inventory  
* supplier management  
* advanced reporting  
* route optimization  
* AI-assisted scheduling  
* AI-assisted job summaries  
* customer portals  
* multiple service locations  
* integrations with accounting platforms

These are future considerations and are not requirements for the MVP.

---

# **29\. Implementation Principles**

The following principles should guide development.

### **Keep domain concepts explicit**

Use separate entities where they represent genuinely different concepts.

The Job/Visit distinction is a deliberate example.

### **Prefer actions over arbitrary state editing**

Users should perform meaningful actions such as:

Start Visit  
Complete Visit

rather than directly editing status values.

### **Backend owns business rules**

The frontend should not be trusted to enforce workflow or authorization.

### **Keep the database relational**

Use relationships and constraints to represent the domain clearly.

### **Avoid premature abstraction**

Do not introduce complex infrastructure before the application requires it.

### **Keep dependencies minimal**

Add libraries when they solve a demonstrated problem rather than because they are commonly used.

### **Preserve historical information**

Operational history is important to a field-service system.

Avoid destructive deletion where it would remove useful historical records.

### **Build around the core workflow**

The technical architecture should support:

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
---

# **30\. Current Implementation Boundary**

At the start of implementation, the project should progress through these technical layers:

1\. Database/schema  
        ↓  
2\. Authentication  
        ↓  
3\. Authorization  
        ↓  
4\. Backend foundation  
        ↓  
5\. Job/visit API  
        ↓  
6\. Frontend foundation  
        ↓  
7\. Manager workflows  
        ↓  
8\. Technician workflows  
        ↓  
9\. Customer confirmation  
        ↓  
10\. Validation/testing/security review

Each layer should be implemented and verified before unnecessarily expanding into the next.

---

# **31\. Source of Truth**

When implementing Handled:

* **Project Overview** is the source of truth for product purpose and overall concept.  
* **Requirements** is the source of truth for functional requirements.  
* **Development Roadmap** is the source of truth for implementation sequencing.  
* **Technical Specification** is the source of truth for architecture, technical design, domain model, database structure, and technical business rules.

If implementation reveals a genuine conflict between these documents, the conflict should be identified and resolved deliberately rather than silently choosing an interpretation.

The Technical Specification should be updated when an architectural decision changes.

---

# **32\. Current Technical Status**

The following foundation has already been established:

* Handled repository created  
* Frontend and Backend directories created  
* Vue frontend initialized  
* Node.js/Express backend initialized  
* MySQL selected as database  
* mysql2 selected for database access  
* Initial backend health endpoint working  
* Core product workflow defined  
* Job/Visit domain model defined  
* MVP database model defined  
* Business rules defined  
* MVP exclusions defined

The next implementation task is the **database/schema layer**.

Authentication and API implementation should begin only after the database foundation has been implemented and reviewed.

