PROJECT OVERVIEW

1. PROJECT SUMMARY

Project Name: FieldFlow

Project Type: Full-Stack Web Application

Target Market: Small South African plumbing and electrical service businesses

Technology Direction:  
• Frontend: Vue \+ JavaScript  
• Backend: Node.js \+ Express  
• Database: MySQL  
• Authentication: JWT with secure password hashing  
• API: REST

FieldFlow is a mobile-first field-service operations platform designed for small plumbing and electrical businesses.

The platform aims to provide a single operational workflow for managing service jobs from the initial customer request through scheduling, technician assignment, field work, documentation, completion, customer sign-off and closure.

The project is designed as a portfolio application that demonstrates full-stack development, system design, business logic, authentication and authorisation, relational database design, mobile-first UX, file handling, testing, security and deployment.

2. PROBLEM

Small plumbing and electrical businesses often manage service jobs using a combination of WhatsApp messages, phone calls, calendars, spreadsheets, paper records, photographs and invoices.

This can result in important job information becoming fragmented across different tools.

A typical service job may involve the following process:

Customer contacts the business → request is recorded → appointment is arranged → technician is contacted → technician attends the job → photographs and notes are recorded separately → work is completed → customer acknowledges completion → invoice/payment information is updated.

When information is distributed across multiple systems, it becomes more difficult for business owners and managers to determine:

• Which jobs are currently active  
• Who is responsible for each job  
• What work has been completed  
• What happened during a job  
• Which materials were used  
• What photographs or notes belong to a particular job  
• Whether the customer has acknowledged completion  
• What remains outstanding

The problem is therefore not simply the use of multiple applications. The deeper problem is the absence of a single, reliable operational record for the service job.

3. PROBLEM STATEMENT

Small South African plumbing and electrical businesses need a simple way to manage the complete lifecycle of a service job because their current workflows are often fragmented across communication tools, calendars, spreadsheets and paper records.

This fragmentation can make it difficult to coordinate technicians, track job progress, maintain reliable job documentation and close jobs consistently.

FieldFlow addresses this problem by providing a central system for managing the service-job lifecycle from request through scheduling, assignment, field work, documentation, completion, customer sign-off and closure.

4. PRODUCT VISION

FieldFlow aims to turn a customer service request into a structured, trackable and documented job.

The core product idea is:

“Turn a customer request into a scheduled, tracked, documented and completed job.”

The application should focus on making the operational workflow clearer and more reliable rather than attempting to become a complete enterprise field-service-management platform.

5. TARGET USERS

5.1 Business Owners and Managers

Business owners and managers are responsible for coordinating service operations.

They need to:

• Manage customers  
• Create and manage jobs  
• Schedule work  
• Assign technicians  
• Monitor job status  
• View job history  
• Review job documentation  
• Monitor completion  
• Manage basic invoice and payment status

Their primary concern is operational visibility.

They should be able to answer questions such as:

• What jobs do we currently have?  
• What is happening with each job?  
• Which technician is responsible?  
• What has already been done?  
• Which jobs still require attention?

5.2 Technicians

Technicians perform the physical work at customer locations.

They need to:

• View assigned jobs  
• View relevant customer and job information  
• Update job status  
• Add notes  
• Upload photographs  
• Record materials used  
• Document work performed  
• Complete required job documentation  
• Obtain customer sign-off

The technician experience should be mobile-first because technicians are likely to use the application while working in the field.

The interface should therefore prioritise simple navigation, clear actions, large touch targets and minimal unnecessary data entry.

5.3 Customers

Customers interact with FieldFlow primarily in relation to their own service jobs.

They should be able to:

• View appropriate information about their service request  
• See job progress  
• View relevant completion information  
• Acknowledge completion through customer sign-off

Customers should not have access to the internal management functionality of the application.

6. CORE WORKFLOW

The central FieldFlow workflow is:

Customer Request  
↓  
New  
↓  
Scheduled  
↓  
Assigned  
↓  
In Progress  
↓  
Completed  
↓  
Customer Sign-off  
↓  
Closed

The exact lifecycle may be refined during development.

The important principle is that jobs should move through controlled states rather than allowing arbitrary status values.

Each important change to a job should contribute to its operational history.

7. MVP SCOPE

The initial MVP will focus on the following capabilities.

7.1 Customer Management

Businesses can:

• Create customers  
• View customers  
• Edit customer information  
• View customer details  
• View a customer's associated job history

7.2 Job Management

Businesses can:

• Create jobs  
• Associate jobs with customers  
• View jobs  
• View job details  
• Edit appropriate job information  
• View job history

7.3 Scheduling and Assignment

Managers can:

• Schedule jobs  
• Assign jobs to technicians  
• View scheduled work  
• Change assignments where appropriate

7.4 Technician Workflow

Technicians can:

• View assigned jobs  
• Open job details  
• Update job status  
• Add notes  
• Upload photographs  
• Record materials used  
• Document work performed  
• Complete required job information  
• Obtain customer sign-off

7.5 Job History

The system should maintain an evidence trail of important job activity, including:

• Job creation  
• Assignment  
• Status changes  
• Notes  
• Photographs  
• Materials  
• Completion  
• Customer sign-off  
• Relevant invoice or payment status changes

7.6 Basic Invoice and Payment Status

The MVP may store basic invoice information and payment status.

FieldFlow will not attempt to replace dedicated accounting software.

The purpose is to provide enough information for the business to understand the operational status of a job.

8. USER ROLES

The initial system will contain three primary user roles:

• Manager  
• Technician  
• Customer

Each role will have different permissions.

Authorisation must be enforced by the backend rather than relying solely on frontend interface restrictions.

9. CORE BUSINESS RULES

Initial business rules include:

• Every job must be associated with a customer.  
• Jobs must have a defined status.  
• Only authorised users can perform particular job actions.  
• Technicians should only be able to access jobs they are authorised to work on.  
• Job status changes should follow defined transition rules.  
• Completion should require appropriate completion information.  
• Customer sign-off should only occur at an appropriate stage of the workflow.  
• Important job events should be recorded in the job history.  
• Users should not be able to access information belonging to other users or businesses without authorisation.

10. WHAT FIELDflow IS NOT

FieldFlow is intentionally not designed to become a complete enterprise field-service-management platform.

The MVP will not include:

• Live GPS tracking  
• Advanced route optimisation  
• Fleet management  
• Payroll  
• Full accounting  
• Complex logistics  
• Advanced CRM functionality  
• Large-scale enterprise analytics  
• Numerous specialised user roles  
• Microservice architecture  
• Large numbers of AI features

11. FUTURE AI FEATURE

A future feature may provide AI-assisted job intake.

For example, a customer could provide an unstructured request such as:

“Our kitchen tap has been leaking since yesterday, and we need someone to come have a look.”

The AI system could analyse the request and generate a structured draft containing information such as:

• Problem description  
• Service category  
• Urgency  
• Relevant customer information  
• Suggested job details

The AI output would not automatically become an authoritative job record.

Instead:

Customer request  
↓  
AI-generated draft  
↓  
Staff review  
↓  
Staff edits or confirms  
↓  
Structured job

The application remains the source of truth, while AI acts as an assistant.

This feature will be developed only after the core FieldFlow workflow has been implemented successfully.

12. PORTFOLIO OBJECTIVE

FieldFlow is intended to demonstrate that the developer can design and build a realistic full-stack system around an actual business workflow.

The project should demonstrate:

Problem  
→ Users  
→ Workflow  
→ Data model  
→ Business rules  
→ API  
→ UI  
→ Authentication  
→ Authorisation  
→ Evidence/Audit trail  
→ Testing  
→ Security  
→ Deployment

The goal is for FieldFlow to demonstrate more than basic CRUD functionality.

The central technical challenge is designing a multi-role system where service jobs move through controlled states while maintaining a reliable record of what happened throughout the job lifecycle.

