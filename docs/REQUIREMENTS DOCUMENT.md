REQUIREMENTS DOCUMENT

1. PURPOSE

This document defines the initial functional requirements, non-functional requirements, user stories and business rules for FieldFlow.

The requirements are intended to guide system design and implementation while keeping the initial MVP within a realistic portfolio-project scope.

2. FUNCTIONAL REQUIREMENTS

FR-01 — Authentication

The system must allow authorised users to authenticate securely.

The system should:

• Support user login  
• Securely hash passwords  
• Authenticate protected requests  
• Issue and validate JWT authentication tokens  
• Allow users to log out  
• Reject unauthenticated access to protected resources

FR-02 — Role-Based Authorisation

The system must support different permissions for different user roles.

Initial roles:

• Manager  
• Technician  
• Customer

The backend must enforce authorisation.

Frontend controls such as hiding buttons must not be treated as the primary security mechanism.

FR-03 — Customer Management

Managers must be able to:

• Create customers  
• View customers  
• View customer details  
• Edit customer information  
• View customer job history

FR-04 — Job Creation

Managers must be able to create a job associated with an existing customer.

A job should contain appropriate information such as:

• Customer  
• Problem/service description  
• Job status  
• Scheduling information  
• Assigned technician where applicable  
• Relevant timestamps  
• Completion information where applicable

FR-05 — Job Viewing

Authorised users must be able to view job information appropriate to their role.

Managers should have broader visibility.

Technicians should have access to their assigned jobs and relevant information.

Customers should only have access to information relating to their own service jobs.

FR-06 — Job Editing

Authorised users must be able to modify job information where permitted.

The system must prevent users from modifying information they do not have permission to change.

FR-07 — Scheduling

Managers must be able to schedule jobs.

Scheduling information should include an appropriate date and time.

The system should prevent or appropriately handle invalid scheduling information.

FR-08 — Technician Assignment

Managers must be able to assign a technician to a job.

The system must verify that the selected technician is an authorised technician.

The system should record assignment activity in the job history.

FR-09 — Job Status

Jobs must have a defined status.

Initial statuses are:

• New  
• Scheduled  
• Assigned  
• In Progress  
• Completed  
• Closed

The final status model may be refined during system design.

FR-10 — Status Transitions

The system must enforce valid job status transitions.

Users must not be able to arbitrarily change a job to any status.

Each status transition must be authorised according to the user's role and the job's current state.

FR-11 — Technician Job Workflow

Technicians must be able to:

• View assigned jobs  
• Open job details  
• Start work  
• Update job status  
• Add notes  
• Upload photographs  
• Record materials  
• Document work performed  
• Complete the job

FR-12 — Notes

Authorised users must be able to add relevant notes to jobs.

Notes should remain associated with the appropriate job.

FR-13 — Photographs

Authorised users must be able to upload photographs associated with a job.

The system should validate uploaded files and restrict inappropriate file types and sizes.

Access to photographs must respect user permissions.

FR-14 — Materials

Technicians must be able to record materials used during a job.

Material records should be associated with the appropriate job.

FR-15 — Job History

The system must maintain a history of important job activity.

History may include:

• Job creation  
• Assignment  
• Status changes  
• Notes  
• Photograph uploads  
• Materials  
• Completion  
• Customer sign-off

The purpose is to provide an evidence trail of the job lifecycle.

FR-16 — Customer Sign-Off

The system must allow appropriate customer acknowledgement of completed work.

The exact technical implementation will be determined during UX and architecture design.

Sign-off should be associated with the relevant job and recorded as part of the job's history.

FR-17 — Basic Invoice Information

The MVP may store basic invoice information associated with a job.

The system should support an appropriate invoice/payment status.

FieldFlow will not implement complete accounting functionality.

FR-18 — Error Handling

The API must return appropriate responses when:

• Authentication fails  
• Authorisation fails  
• Requested resources do not exist  
• Validation fails  
• Database operations fail  
• File uploads fail  
• Invalid state transitions are attempted

3. NON-FUNCTIONAL REQUIREMENTS

NFR-01 — Security

The system must:

• Never store plaintext passwords  
• Use secure password hashing  
• Protect authenticated endpoints  
• Enforce server-side authorisation  
• Validate incoming data  
• Protect sensitive information  
• Keep secrets outside source control  
• Restrict file access  
• Avoid unnecessary data exposure

NFR-02 — Responsiveness

The application must provide a responsive experience across desktop and mobile devices.

The technician interface should be designed mobile-first.

NFR-03 — Usability

Common technician actions should require as few unnecessary interactions as reasonably possible.

The interface should prioritise:

• Clear actions  
• Simple navigation  
• Readable information  
• Large touch targets  
• Useful feedback  
• Clear error messages

NFR-04 — Maintainability

The system should use a clear separation between:

• Frontend  
• Backend  
• Database  
• Business logic  
• API routes  
• Authentication/authorisation

Code should be organised so that future changes can be made without unnecessary modification to unrelated components.

NFR-05 — Reliability

The application should handle expected errors without crashing or exposing sensitive implementation information.

Users should receive meaningful feedback when an operation fails.

NFR-06 — Performance

The system should use sensible database queries and avoid unnecessary data retrieval.

Where appropriate, the system should use:

• Database indexes  
• Pagination  
• Efficient queries  
• Appropriate API response sizes  
• Sensible file handling

NFR-07 — Deployment

The final MVP should be deployed to a production environment.

The deployed system should use appropriate production configuration and environment variables.

4. USER STORIES

MANAGER

US-01  
As a manager, I want to create a customer so that their information can be associated with service jobs.

US-02  
As a manager, I want to view my customers so that I can find existing customers quickly.

US-03  
As a manager, I want to view a customer's previous jobs so that I can understand their service history.

US-04  
As a manager, I want to create a job for a customer so that a service request can be tracked.

US-05  
As a manager, I want to view job details so that I can understand what work is required.

US-06  
As a manager, I want to see job statuses so that I know what is currently happening.

US-07  
As a manager, I want to schedule jobs so that work can be planned.

US-08  
As a manager, I want to assign technicians so that responsibility for jobs is clear.

US-09  
As a manager, I want to see scheduled jobs so that I can coordinate the team's workload.

US-10  
As a manager, I want to view job history so that I can understand what happened during a job.

US-11  
As a manager, I want to monitor active jobs so that I can identify work that requires attention.

TECHNICIAN

US-12  
As a technician, I want to see my assigned jobs so that I know what work I need to perform.

US-13  
As a technician, I want to view relevant job and customer information so that I understand the work before arriving.

US-14  
As a technician, I want to update job status so that the business knows my progress.

US-15  
As a technician, I want to add notes so that I can document observations and work performed.

US-16  
As a technician, I want to upload photographs so that I can provide visual evidence of the work.

US-17  
As a technician, I want to record materials used so that the job contains a record of what was required.

US-18  
As a technician, I want to document completed work so that the business has a reliable record.

US-19  
As a technician, I want to obtain customer sign-off so that completion can be acknowledged.

US-20  
As a technician, I want a simple mobile interface so that I can use the application efficiently while working in the field.

CUSTOMER

US-21  
As a customer, I want to view my service request so that I know what job has been recorded.

US-22  
As a customer, I want to see job progress so that I know the status of my service.

US-23  
As a customer, I want to see relevant completion information so that I know what work was recorded.

US-24  
As a customer, I want to acknowledge completion so that there is a record that the job was completed.

5. BUSINESS RULES

BR-01  
Every job must belong to a customer.

BR-02  
Every job must have a valid status.

BR-03  
Only authorised users may access job information.

BR-04  
Users may only perform actions permitted by their role.

BR-05  
Technicians may only access jobs they are authorised to work on.

BR-06  
Job status changes must follow defined transition rules.

BR-07  
A job cannot be marked as completed unless required completion information has been provided.

BR-08  
Customer sign-off can only occur at an appropriate stage of the job lifecycle.

BR-09  
Important job events must be recorded in the job history.

BR-10  
Customers must not be able to access internal business management functionality.

BR-11  
The backend must enforce authorisation independently of frontend controls.

BR-12  
Uploaded files must be validated before being accepted.

BR-13  
Users must not be able to access another business's data if the system supports multiple businesses.

BR-14  
The application should maintain the integrity of historical records rather than silently overwriting important events.

6. MVP ACCEPTANCE CRITERIA

The MVP should be considered functionally complete when a realistic job can successfully move through the following workflow:

1. A manager creates a customer.  
2. The manager creates a job for that customer.  
3. The manager schedules the job.  
4. The manager assigns a technician.  
5. The technician can see the assigned job.  
6. The technician opens the job.  
7. The technician updates the job status.  
8. The technician records notes.  
9. The technician uploads relevant photographs.  
10. The technician records materials.  
11. The technician documents the work performed.  
12. The technician completes the job.  
13. The customer can acknowledge completion.  
14. The system records the relevant history.

15. The manager can review the completed job and its history.

In addition, unauthorised users must be prevented from accessing or modifying resources they do not have permission to access.  
