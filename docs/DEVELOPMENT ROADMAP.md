DEVELOPMENT ROADMAP

1. PURPOSE

This roadmap defines the planned development progression for FieldFlow.

The project will be developed incrementally rather than attempting to build the entire application at once.

Each phase should produce a clear outcome before the project moves to the next major stage.

PHASE 1 — PROJECT FOUNDATION

Status: Completed

Objectives:

• Define the problem  
• Define target users  
• Define product vision  
• Establish MVP scope  
• Define user stories  
• Define functional requirements  
• Define non-functional requirements  
• Define business rules  
• Establish initial development roadmap

Deliverables:

• Project Overview  
• Requirements  
• Development Roadmap

PHASE 2 — UX AND USER FLOWS

Status: Next

Objectives:

• Define how each user interacts with FieldFlow  
• Map the manager workflow  
• Map the technician workflow  
• Map the customer workflow  
• Identify application screens/pages  
• Define navigation  
• Identify important UI states  
• Design the technician mobile-first experience

Key outcome:

A clear understanding of what each user needs to accomplish before technical architecture is finalised.

PHASE 3 — SYSTEM ARCHITECTURE

Objectives:

• Define frontend architecture  
• Define backend architecture  
• Define API architecture  
• Define authentication architecture  
• Define authorisation model  
• Define file handling approach  
• Define error-handling strategy  
• Define application boundaries

Deliverables:

• Architecture documentation  
• Initial project structure  
• Technology decisions

PHASE 4 — DATABASE DESIGN

Objectives:

• Identify entities  
• Define relationships  
• Define primary keys  
• Define foreign keys  
• Define constraints  
• Define indexes  
• Define job status representation  
• Define job history/event structure  
• Review data integrity requirements

Expected core entities may include:

• Users  
• Businesses  
• Customers  
• Jobs  
• Assignments  
• Notes  
• Photos  
• Materials  
• Job History  
• Sign-Offs  
• Invoice Information

The exact schema will be determined during this phase rather than assumed in advance.

PHASE 5 — PROJECT SETUP

Objectives:

• Create Vue frontend  
• Create Node/Express backend  
• Configure MySQL  
• Configure environment variables  
• Establish Git repository structure  
• Establish development scripts  
• Establish basic frontend/backend communication  
• Establish project conventions

PHASE 6 — AUTHENTICATION AND AUTHORISATION

Objectives:

• Implement registration where required  
• Implement login  
• Implement password hashing  
• Implement JWT authentication  
• Implement authentication middleware  
• Implement role-based authorisation  
• Protect API routes  
• Protect frontend routes  
• Test access restrictions

Key outcome:

Users can securely authenticate and only access functionality appropriate to their role.

PHASE 7 — BACKEND MVP

Development order:

1. Users and authentication  
2. Customers  
3. Jobs  
4. Scheduling  
5. Technician assignments  
6. Job status transitions  
7. Notes  
8. Materials  
9. Photograph/file handling  
10. Job history  
11. Completion  
12. Customer sign-off  
13. Basic invoice/payment status

Each major feature should be implemented and tested before moving to the next.

PHASE 8 — FRONTEND MVP

Development order:

1. Authentication interface  
2. Application shell/navigation  
3. Manager experience  
4. Customer management  
5. Job management  
6. Scheduling  
7. Technician dashboard  
8. Technician job details  
9. Job status updates  
10. Notes  
11. Photos  
12. Materials  
13. Job history/timeline  
14. Completion  
15. Customer sign-off  
16. Customer-facing experience

PHASE 9 — FRONTEND/BACKEND INTEGRATION

Objectives:

• Connect frontend screens to REST API  
• Handle loading states  
• Handle API errors  
• Handle validation errors  
• Handle authentication failures  
• Handle permission errors  
• Handle empty states  
• Handle upload failures  
• Verify complete workflows

PHASE 10 — VALIDATION AND ERROR HANDLING

Objectives:

• Validate frontend input  
• Validate backend input  
• Validate database operations  
• Standardise API error responses  
• Prevent invalid state transitions  
• Handle missing resources  
• Handle failed uploads  
• Handle expired/invalid authentication

PHASE 11 — TESTING

Testing should focus on the most important application behaviour.

Areas include:

• Authentication  
• Authorisation  
• Customer management  
• Job creation  
• Job assignment  
• Job status transitions  
• Technician workflow  
• File uploads  
• Job history  
• Customer sign-off  
• API error handling  
• Important frontend behaviour

Testing should prioritise business-critical behaviour rather than attempting to achieve an arbitrary percentage of code coverage.

PHASE 12 — SECURITY REVIEW

The application should undergo a dedicated security review.

Areas to examine include:

• Password storage  
• JWT handling  
• Authentication  
• Broken access control  
• Role permissions  
• IDOR-style vulnerabilities  
• Input validation  
• SQL injection prevention  
• File upload security  
• Sensitive data exposure  
• Environment variables  
• CORS configuration  
• API error responses  
• Production configuration

PHASE 13 — DEPLOYMENT

Objectives:

• Deploy frontend  
• Deploy backend  
• Configure production database  
• Configure environment variables  
• Configure CORS  
• Enable HTTPS where supported  
• Configure production builds  
• Apply database schema/migrations  
• Verify production functionality

PHASE 14 — DOCUMENTATION

Objectives:

• Finalise README  
• Document architecture  
• Document database design  
• Document API  
• Document setup instructions  
• Document environment configuration  
• Document testing  
• Document security considerations  
• Document deployment process  
• Document important technical decisions

PHASE 15 — PORTFOLIO PRESENTATION

Objectives:

Create a clear portfolio case study explaining:

THE PROBLEM

What operational problem do small plumbing and electrical businesses experience?

THE USERS

Who uses FieldFlow, and what does each user need?

THE WORKFLOW

How does FieldFlow turn a service request into a completed job?

THE TECHNICAL CHALLENGE

What made this more than a basic CRUD application?

THE SOLUTION

How were the frontend, backend, database, authentication, authorisation and business rules implemented?

THE RESULT

What can the finished system demonstrate?

THE LESSONS

What technical and product lessons were learned during development?

PHASE 16 — FUTURE AI FEATURE

Only after the core MVP is stable should AI-assisted job intake be considered.

Potential workflow:

Unstructured customer request  
↓  
AI analysis  
↓  
Structured draft  
↓  
Staff review  
↓  
Staff edits/confirmation  
↓  
Actual job

The AI feature should be treated as an assistant rather than the source of truth.

2. DEVELOPMENT PRINCIPLES

The project should follow several principles throughout development.

PRINCIPLE 1 — Build incrementally

Do not generate hundreds of files or implement the entire system at once.

Each feature should be developed, tested and understood before moving forward.

PRINCIPLE 2 — Design before implementation

Important architectural decisions should be made before writing large amounts of code.

PRINCIPLE 3 — Workflow over CRUD

FieldFlow should be designed around the service-job lifecycle rather than as a collection of unrelated CRUD screens.

PRINCIPLE 4 — Backend security is authoritative

Frontend restrictions improve the user experience, but the backend must enforce authentication and authorisation.

PRINCIPLE 5 — Keep the MVP focused

Features should be evaluated against the core workflow.

If a feature does not materially improve the journey from customer request to completed job, it should be questioned before being added to the MVP.

PRINCIPLE 6 — AI-assisted development with human review

AI may be used to generate, explain, modify and debug code.

Generated code should be reviewed and understood before being accepted.

Important architectural and security decisions should not be delegated blindly to AI.

PRINCIPLE 7 — Document important decisions

Important technical decisions should be documented together with the reasoning behind them.

This will make the project easier to maintain and will provide useful material for the eventual portfolio case study.

3. DEFINITION OF DONE

A feature should not be considered complete simply because the code runs.

Where appropriate, completion should mean:

• The feature satisfies its requirement.  
• Appropriate users can access it.  
• Unauthorised users cannot access it.  
• Input is validated.  
• Errors are handled.  
• Relevant business rules are enforced.  
• The database correctly stores the information.  
• The frontend correctly communicates with the API.  
• The feature has been manually tested.  
• Appropriate automated tests exist where justified.  
• The implementation does not unnecessarily break unrelated functionality.  
• The relevant Git changes are committed clearly.

4. SCOPE CONTROL

New feature requests should be evaluated against the MVP.

Before adding a feature, ask:

1. Does it solve a real problem for one of the target users?  
2. Does it contribute to the core service-job workflow?  
3. Is it necessary for the MVP?  
4. What additional complexity does it introduce?  
5. Does the project have a simpler way to solve the same problem?

If the feature is not necessary for the MVP, it should normally be deferred.

This is intended to prevent FieldFlow from becoming an unnecessarily large enterprise field-service-management system.

