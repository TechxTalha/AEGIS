# AEGIS --- End-State Vision & Development Roadmap

**Document status:** Living specification\
**Project:** AEGIS\
**Purpose:** Define the complete intended end state of AEGIS and divide
implementation into isolated stages that an engineering agent can
execute one at a time.

------------------------------------------------------------------------

# 1. What AEGIS Is

AEGIS is intended to be a personal AI command center and autonomous
operations system.

It is not simply a chatbot, dashboard, CRUD application, or collection
of hardcoded automation buttons.

The core idea is:

> The user gives AEGIS an objective. AEGIS understands the objective,
> determines what capabilities are required, creates an execution plan,
> uses the appropriate tools and agents, observes the results, verifies
> progress, handles failures, and reports back to the user.

AEGIS should eventually be capable of operating across:

-   The local machine
-   Linux systems
-   Windows/WSL systems
-   Remote servers through SSH
-   Databases
-   Filesystems
-   Git repositories
-   Docker/container environments when applicable
-   Web/internet resources
-   Development environments
-   An external agentic IDE/coding agent (Google Antigravity)
-   Monitoring and system information
-   Scheduled/background tasks
-   The user's iPhone or other client devices

The important architectural principle is that AEGIS should reason over
**capabilities and tools**, not over a fixed list of predefined business
functions.

For example, the system should not primarily contain functions such as:

-   `restartServer()`
-   `fixDatabase()`
-   `deployApplication()`
-   `searchWebsite()`

Instead, it should have controlled capabilities such as:

-   Execute a command
-   Read/write a file
-   Inspect a process
-   Connect to a database
-   Execute a database query
-   Connect to a remote machine
-   Search the web
-   Inspect a Git repository
-   Delegate work to a coding agent
-   Read agent output
-   Verify a result

AEGIS can then compose these capabilities dynamically.

------------------------------------------------------------------------

# 2. Ultimate Goal

The eventual AEGIS experience should look approximately like this:

1.  The user gives AEGIS a natural-language objective.
2.  AEGIS determines what the user wants.
3.  AEGIS identifies the resources, machines, repositories, databases,
    tools, and agents relevant to the objective.
4.  AEGIS creates an execution plan.
5.  AEGIS asks for confirmation when an operation is sufficiently
    sensitive or destructive.
6.  AEGIS executes safe operations automatically.
7.  AEGIS delegates specialized coding work to the external agentic IDE
    when appropriate.
8.  AEGIS monitors execution continuously.
9.  AEGIS collects command output, logs, files, test results, agent
    responses, and other evidence.
10. AEGIS evaluates whether the objective was actually achieved.
11. If something fails, AEGIS diagnoses the failure and determines the
    next action.
12. AEGIS retries, changes strategy, or asks the user for assistance
    when necessary.
13. AEGIS maintains a record of what happened.
14. AEGIS reports the result clearly to the user.
15. The user can observe and control the process from a browser or
    iPhone.

The system should eventually feel like a **supervisor controlling a
distributed collection of capabilities**, rather than a chatbot calling
a few APIs.

------------------------------------------------------------------------

# 3. Core Design Principles

These principles apply throughout the entire project.

## 3.1 AEGIS is the Orchestrator

AEGIS is the central reasoning and coordination layer.

It decides:

-   What needs to happen
-   Which capability is needed
-   Which machine should perform it
-   Whether an agent should be involved
-   What order actions should occur in
-   Whether the result is acceptable
-   What to do after success or failure

AEGIS should not directly embed every implementation detail.

------------------------------------------------------------------------

## 3.2 Tools Are Capabilities

Tools should expose controlled capabilities to the reasoning system.

Examples:

-   Terminal tool
-   Filesystem tool
-   SSH tool
-   Database tool
-   Git tool
-   Web search tool
-   Browser tool
-   Process/system tool
-   Machine information tool
-   Coding-agent tool
-   Notification tool

A tool should have:

-   A clear name
-   A description
-   Input schema
-   Output schema
-   Permission requirements
-   Risk classification
-   Timeout limits
-   Execution constraints
-   Audit information

The AI should discover and select tools based on their declared
capabilities.

------------------------------------------------------------------------

## 3.3 Agents Are Specialized Executors

AEGIS and agents have different responsibilities.

AEGIS:

-   Understands the overall objective
-   Plans
-   Delegates
-   Coordinates
-   Supervises
-   Verifies
-   Makes high-level decisions

Specialized agents:

-   Execute specialized work
-   Return structured progress/results
-   Operate within assigned boundaries

The external agentic IDE (Google Antigravity) is primarily a **coding specialist**.

AEGIS should not unnecessarily duplicate Google Antigravity's functionality.

------------------------------------------------------------------------

## 3.4 Execution Must Be Observable

Every meaningful action should eventually be observable.

The system should know:

-   Who requested it
-   What objective caused it
-   Which plan step caused it
-   Which tool was used
-   Which machine executed it
-   When it started
-   When it finished
-   What input was supplied
-   What output was returned
-   Whether it succeeded
-   Whether it was cancelled
-   What errors occurred

This information is essential for debugging, security, auditing, and
future AI reasoning.

------------------------------------------------------------------------

## 3.5 Safety Before Autonomy

AEGIS will eventually have extremely powerful capabilities.

It may be able to:

-   Execute shell commands
-   Modify files
-   Modify databases
-   Restart services
-   Access remote servers
-   Deploy software
-   Change configuration
-   Run privileged operations

Therefore autonomy must be designed around explicit security boundaries.

Potentially destructive actions should be distinguishable from read-only
actions.

Examples:

**Low risk** - List files - Read a log - Check disk space - Query system
status

**Medium risk** - Install a package - Modify a configuration file -
Restart an application - Update source code

**High risk** - Delete data - Drop database objects - Remove files
recursively - Change firewall/security rules - Execute destructive
production operations

AEGIS should eventually support policy-based approval and confirmation.

------------------------------------------------------------------------

## 3.6 Model Provider Independence and Layering

AEGIS should not be permanently tied to one AI provider.

The architecture should support a model abstraction so that different
providers can be used later. Crucially, multiple AI models must be
used in layers. Since we intend to use free variants, the system
must be resilient: if one model fails or hits a rate limit, another
model seamlessly takes its place as a fallback.

Potential providers may include:

-   OpenAI
-   Anthropic
-   Google
-   Local/self-hosted models
-   Other compatible providers

The rest of AEGIS should not need to know which model is currently
performing reasoning, nor should it need to manage the fallback
logic manually.

------------------------------------------------------------------------

## 3.7 Modular Monolith First

The initial AEGIS backend should remain a modular monolith.

Do not split the system into microservices simply because the eventual
system is distributed.

The application should first establish clean internal boundaries.

Possible future modules include:

-   Auth
-   Users
-   Machines
-   Tools
-   Agents
-   Tasks
-   Plans
-   Executions
-   Approvals
-   Memory
-   Model providers
-   Notifications
-   Monitoring
-   Audit

A service may be extracted later only when there is a real reason.

------------------------------------------------------------------------

## 3.8 Docker Is Not Part of This Roadmap

Docker/Docker Compose are intentionally excluded from the AEGIS
implementation roadmap.

Do not introduce Docker-specific infrastructure, deployment, or
development requirements unless explicitly requested later.

The current project should work directly in the existing local
development environment.

------------------------------------------------------------------------

# 4. High-Level Future Architecture

The eventual system should conceptually contain the following layers.

``` text
                        ┌─────────────────────┐
                        │       USER          │
                        │ Browser / iPhone    │
                        └──────────┬──────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │    AEGIS API/UI     │
                        │ Auth / WebSocket    │
                        └──────────┬──────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │   AEGIS CORE        │
                        │                     │
                        │ Intent              │
                        │ Planning            │
                        │ Reasoning           │
                        │ Orchestration       │
                        │ Verification        │
                        │ Policy/Safety       │
                        └──────────┬──────────┘
                                   │
                  ┌────────────────┼─────────────────┐
                  │                │                 │
                  ▼                ▼                 ▼
          ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
          │ Tool System  │ │ Agent System │ │ Model System │
          └──────┬───────┘ └──────┬───────┘ └──────────────┘
                 │                │
       ┌─────────┼─────────┐      │
       │         │         │      ▼
       ▼         ▼         ▼   ┌──────────────────┐
    Terminal    DB       SSH   │ Coding IDE Agent │
       │         │         │   └──────────────────┘
       └─────────┼─────────┘
                 │
                 ▼
       ┌─────────────────────┐
       │ Machine Agent Layer │
       ├─────────────────────┤
       │ Windows / WSL       │
       │ Linux                │
       │ Remote Servers       │
       └─────────────────────┘
```

This diagram is conceptual. Actual implementation details should be
decided during the relevant stages rather than prematurely encoded into
the baseline.

------------------------------------------------------------------------

# 5. Major System Components

## 5.1 User Interface

The UI should eventually provide:

-   Conversation interface
-   Task status
-   Active executions
-   Execution history
-   Tool activity
-   Agent activity
-   Logs/output
-   Approval requests
-   Machine status
-   Notifications
-   System configuration
-   User/account management

The UI should be useful for both quick commands and detailed inspection.

------------------------------------------------------------------------

## 5.2 Mobile Access

The iPhone should eventually be able to:

-   Talk to AEGIS
-   Start tasks
-   Monitor running tasks
-   Receive notifications
-   Approve sensitive actions
-   View execution results
-   Inspect machines and system status
-   Stop/cancel tasks when permitted

A web-based responsive interface/PWA can be used initially.

A dedicated native iOS application can be introduced later if it
provides meaningful benefits.

The backend should therefore be designed so the client is not tightly
coupled to the web UI.

------------------------------------------------------------------------

## 5.3 AEGIS Core

The AEGIS core is the central brain/orchestrator.

It eventually contains:

-   Request/intent processing
-   Context construction
-   Planning
-   Plan execution
-   Tool selection
-   Agent delegation
-   State management
-   Result evaluation
-   Retry/recovery
-   Approval handling
-   Memory access
-   Model selection
-   Task lifecycle management

The core must remain independent from individual tools whenever
possible.

------------------------------------------------------------------------

# 6. Task Model

The fundamental unit of autonomous work should eventually be a **Task**.

A task represents an objective given to AEGIS.

Example:

> "Check why the application on server X is returning 502 and fix it."

The task should eventually contain:

-   User request
-   Parsed objective
-   Current status
-   Priority
-   Created timestamp
-   Started timestamp
-   Completed timestamp
-   Plan
-   Execution steps
-   Required capabilities
-   Associated machines/resources
-   Tool calls
-   Agent assignments
-   Approvals
-   Results
-   Errors
-   Final outcome

Possible task states:

``` text
CREATED
PLANNING
WAITING_FOR_APPROVAL
EXECUTING
WAITING
BLOCKED
VERIFYING
COMPLETED
FAILED
CANCELLED
```

The exact state model should be finalized during the task/orchestration
stage.

------------------------------------------------------------------------

# 7. Planning System

AEGIS should eventually transform an objective into an executable plan.

Example:

``` text
Objective:
"Fix the 502 error on the application."

Possible plan:

1. Identify target server.
2. Check application health.
3. Inspect reverse proxy status.
4. Inspect application process.
5. Inspect recent logs.
6. Determine root cause.
7. If code change is required:
   delegate implementation to coding agent.
8. Run tests.
9. Deploy if authorized.
10. Restart/reload required service.
11. Verify endpoint.
12. Report result.
```

The plan must not be a rigid workflow.

The AI should be able to:

-   Add steps
-   Remove unnecessary steps
-   Reorder steps
-   Branch based on results
-   Retry
-   Change tools
-   Ask for approval
-   Delegate work
-   Stop when the objective is achieved

The planner should eventually support conditional execution.

------------------------------------------------------------------------

# 8. Execution Engine

The execution engine converts a plan into actual operations.

Responsibilities include:

-   Execute steps
-   Track state
-   Manage dependencies
-   Handle timeouts
-   Capture outputs
-   Detect failures
-   Retry where appropriate
-   Pause for approval
-   Resume paused tasks
-   Cancel tasks
-   Persist execution history
-   Emit real-time events

The execution engine should be deterministic about infrastructure
concerns even if the AI's planning is probabilistic.

------------------------------------------------------------------------

# 9. Tool System

AEGIS should eventually have a general tool registry.

Potential tools include:

### Terminal

Execute commands on an authorized machine.

### Filesystem

Read, write, move, copy, inspect, and manage files within allowed
boundaries.

### SSH

Connect to authorized remote machines.

### Database

Connect to authorized databases and perform permitted
queries/operations.

### Git

Inspect repositories, branches, commits, diffs, status, and perform
permitted Git operations.

### Web Search

Search the internet for current information.

### Browser

Navigate websites and retrieve information where needed.

### System

Inspect CPU, memory, disk, processes, services, networking,
operating-system details, etc.

### Coding Agent

Send coding objectives to the external agentic IDE and receive
progress/results.

### Notification

Send user-facing notifications.

### Scheduler

Create future or recurring tasks.

Tools should be registered dynamically rather than requiring the planner
to know implementation classes.

------------------------------------------------------------------------

# 10. Machine Agent System

AEGIS will eventually need machine-side agents.

A machine agent is a controlled execution component installed on a
machine that AEGIS is allowed to operate.

Possible hosts:

-   Windows
-   WSL
-   Linux workstation
-   Linux VPS
-   Remote server

The machine agent should expose capabilities such as:

-   Command execution
-   Filesystem access
-   Process information
-   Service management
-   System metrics
-   Network information
-   Local application interaction where supported

The machine agent should authenticate to AEGIS and identify itself.

AEGIS should know:

-   Machine identity
-   OS
-   Architecture
-   Agent version
-   Available capabilities
-   Connectivity status
-   Last heartbeat
-   Resource information

The machine agent must not simply expose an unrestricted remote shell.

------------------------------------------------------------------------

# 11. Remote Server / SSH Architecture

AEGIS should eventually be able to work with remote Linux servers.

There should be a distinction between:

1.  AEGIS-managed machine agents
2.  Direct SSH-managed machines

For SSH-managed machines, AEGIS should eventually maintain:

-   Host identity
-   Connection configuration
-   Credential/key reference
-   Available capabilities
-   Permissions
-   Connection status
-   Audit history

Secrets should not be stored as plain text in ordinary database fields.

------------------------------------------------------------------------

# 12. Database Control

AEGIS should eventually be able to work with databases.

Capabilities may include:

-   Discover databases
-   Inspect schemas
-   Inspect tables
-   Run read-only queries
-   Analyze query failures
-   Modify data when authorized
-   Run migrations when authorized
-   Diagnose database problems
-   Inspect indexes and performance
-   Generate reports

Database access must be permission-aware.

Read-only operations and destructive operations must be distinguishable.

The database tool should never give the AI unrestricted access by
default.

------------------------------------------------------------------------

# 13. Coding Agent Integration

The external agentic IDE is a specialized coding worker.

AEGIS should be able to:

-   Create a coding objective
-   Provide context
-   Assign a repository/project
-   Define constraints
-   Monitor progress
-   Receive status updates
-   Receive output/results
-   Inspect changed files/diffs
-   Run verification
-   Continue the task if necessary
-   Reject incomplete work
-   Ask the coding agent for corrections

Example:

``` text
User:
"Add CSV export to the employee report."

AEGIS:
1. Understand request.
2. Identify repository.
3. Inspect current implementation.
4. Determine that coding work is required.
5. Send implementation objective to coding agent.
6. Monitor agent.
7. Inspect resulting changes.
8. Run tests/build.
9. If successful, report completion.
10. If failed, send corrective instructions or ask user.
```

AEGIS should remain the supervisor.

The coding agent should not become the master controller of the entire
AEGIS environment.

------------------------------------------------------------------------

# 14. Verification System

AEGIS must not assume that a tool reporting success means the user's
objective was achieved.

Verification should be a first-class capability.

Examples:

-   Command exited with code 0
-   Application actually responds
-   Database migration actually exists
-   Tests actually pass
-   File actually contains expected content
-   Server service is actually running
-   Deployment endpoint actually works
-   Coding agent actually produced the requested change

The final task result should be based on evidence whenever possible.

------------------------------------------------------------------------

# 15. Memory and Context

AEGIS will eventually need persistent memory.

Potential memory categories:

### User preferences

How the user prefers AEGIS to operate.

### Machine knowledge

Known machines, environments, capabilities, and relationships.

### Project knowledge

Repositories, applications, services, deployment environments.

### Operational history

What happened during previous tasks.

### Long-term facts

Stable information that helps future planning.

### Task context

Information required while a task is active.

Memory must be separated from ordinary chat history.

The system should eventually distinguish:

-   Current task context
-   Short-term execution context
-   Persistent knowledge
-   User preferences

Memory retrieval should be selective rather than blindly injecting the
entire database into every model request.

------------------------------------------------------------------------

# 16. Model Abstraction

The model layer should eventually provide a provider-independent
interface.

Conceptually:

``` text
AEGIS Core
    ↓
Model Gateway
    ↓
Provider Adapter
    ├── OpenAI
    ├── Anthropic
    ├── Google
    └── Local Model
```

The rest of the system should request capabilities such as:

-   Reason
-   Plan
-   Summarize
-   Classify
-   Analyze tool output

without directly depending on a specific provider SDK.

Model selection may eventually depend on:

-   Task type
-   Required reasoning level
-   Cost
-   Latency
-   Context size
-   Availability
-   User preference

------------------------------------------------------------------------

# 17. Permissions and Security

Security is a core feature, not a later polish item.

AEGIS should eventually have:

-   Authentication
-   Authorization
-   Roles
-   Permissions
-   Tool permissions
-   Machine permissions
-   Resource permissions
-   Approval policies
-   Audit logs
-   Secret management
-   Session management
-   Rate limiting
-   Secure communication
-   Input validation
-   Output sanitization
-   Command restrictions
-   Execution timeouts

A tool should not automatically inherit unlimited authority merely
because AEGIS can invoke it.

------------------------------------------------------------------------

# 18. Approval System

Certain operations should require explicit user approval.

Examples:

-   Delete production data
-   Drop a database
-   Restart critical production infrastructure
-   Modify firewall rules
-   Deploy to production
-   Rotate credentials
-   Remove important files
-   Execute unknown or high-risk commands

An approval request should contain:

-   What AEGIS wants to do
-   Why it wants to do it
-   Target resource
-   Expected effect
-   Risk level
-   Relevant command/action
-   What happens if approved

The user should be able to approve or reject from the browser or iPhone.

------------------------------------------------------------------------

# 19. Real-Time Event System

WebSockets should eventually support live system events.

Examples:

-   Task started
-   Planning started
-   Plan updated
-   Tool started
-   Tool completed
-   Tool failed
-   Agent started
-   Agent progress
-   Approval requested
-   Task paused
-   Task resumed
-   Task completed
-   Task failed
-   Machine connected/disconnected

The UI should not need to constantly poll for every event.

The backend should have an internal event model so different clients can
consume the same task state.

------------------------------------------------------------------------

# 20. Scheduling and Background Operation

AEGIS should eventually support background tasks.

Examples:

-   "Check server health every hour."
-   "Tell me if disk usage exceeds 80%."
-   "Run this report every Monday."
-   "Monitor this application."
-   "Check whether SSL certificates are approaching expiry."

Scheduled tasks should use the same task/execution infrastructure as
interactive tasks where practical.

------------------------------------------------------------------------

# 21. Monitoring

AEGIS should eventually be able to monitor managed systems.

Potential monitoring data:

-   CPU
-   Memory
-   Disk
-   Network
-   Processes
-   Services
-   Application health
-   Database health
-   Logs
-   Availability

The goal is not necessarily to replace dedicated monitoring systems.

AEGIS should instead be able to consume and reason over operational
information.

Example:

> "Why did the server become slow?"

AEGIS could inspect CPU, memory, disk I/O, processes, logs, database
activity, and recent changes before producing a diagnosis.

------------------------------------------------------------------------

# 22. Audit and Observability

Every important autonomous action should eventually be auditable.

The system should be able to answer:

-   What did AEGIS do?
-   Why did it do it?
-   Who requested it?
-   Which model made the decision?
-   Which plan step triggered it?
-   Which tool executed it?
-   On which machine?
-   What happened?
-   What output was received?
-   Was approval required?
-   Who approved it?
-   What was the final result?

Logs should be structured and searchable.

------------------------------------------------------------------------

# 23. Failure and Recovery

Failure is expected.

AEGIS should eventually distinguish between:

-   Tool failure
-   Network failure
-   Authentication failure
-   Permission failure
-   Command failure
-   Agent failure
-   Model failure
-   Invalid plan
-   External service failure
-   Verification failure

For recoverable errors, AEGIS should be able to:

1.  Understand the error.
2.  Determine whether retrying is safe.
3.  Retry with appropriate limits.
4.  Change strategy if necessary.
5.  Request additional information if blocked.
6.  Ask the user for approval if required.
7.  Mark the task failed with useful evidence when recovery is
    impossible.

The system must avoid infinite autonomous loops.

------------------------------------------------------------------------

# 24. Initial Baseline

The baseline application has already been established around:

## Backend

-   Java 25
-   Spring Boot
-   Maven
-   Spring Security
-   Spring Data JPA
-   MySQL
-   Flyway
-   Bean Validation
-   REST
-   WebSocket foundation
-   Actuator
-   OpenAPI

## Frontend

-   React
-   Vite
-   JavaScript
-   React Router
-   Axios
-   Ant Design
-   Tailwind CSS
-   React Context where appropriate

## Baseline Features

-   Authentication
-   Basic authorization
-   User
-   Role
-   REST API
-   WebSocket foundation
-   Error handling
-   Validation
-   Logging
-   Health checks
-   API documentation
-   Testing

This baseline is infrastructure only.

Do not prematurely implement the complete AI system inside the baseline.

------------------------------------------------------------------------

# 25. Development Roadmap

Each stage below is intentionally isolated.

**Status values:** - `UNCOMPLETED` - `IN PROGRESS` - `COMPLETED` -
`BLOCKED`

Only one stage should normally be actively implemented at a time.

The coding agent should not silently jump ahead into future stages.

------------------------------------------------------------------------

## Stage 01 --- Architecture & Foundation Review

**Status:** COMPLETED

### Objective

Review the existing baseline and prepare it for AEGIS-specific
development without implementing autonomous behavior.

### Tasks

-   Inspect existing backend structure.
-   Inspect existing frontend structure.
-   Confirm package/module boundaries.
-   Confirm authentication foundation.
-   Confirm role/permission foundation.
-   Confirm database migration structure.
-   Confirm WebSocket foundation.
-   Confirm error handling.
-   Confirm logging.
-   Confirm configuration handling.
-   Confirm API documentation.
-   Confirm testing structure.
-   Identify technical debt that would interfere with future stages.
-   Document architectural decisions.

### Completion Criteria

-   Baseline is clean.
-   Existing functionality works.
-   No AEGIS-specific autonomous functionality is introduced yet.
-   Future module boundaries are documented.

------------------------------------------------------------------------

## Stage 02 --- AEGIS Domain Model

**Status:** COMPLETED

### Objective

Introduce the first AEGIS-specific domain concepts without connecting
them to AI execution.

### Initial concepts

Potentially:

-   Task
-   Task status
-   Task priority
-   Task metadata
-   Execution
-   Execution status
-   Event

### Tasks

-   Design entities.
-   Design relationships.
-   Create Flyway migrations.
-   Create repositories.
-   Create DTOs.
-   Create service layer.
-   Create REST endpoints where appropriate.
-   Add validation.
-   Add tests.

### Completion Criteria

AEGIS can persist and retrieve task/execution state, but cannot
autonomously execute tasks yet.

------------------------------------------------------------------------

## Stage 03 --- Task Lifecycle

**Status:** COMPLETED

### Objective

Build a reliable lifecycle around tasks.

### Tasks

Implement:

-   Create task
-   Start task
-   Pause task
-   Resume task
-   Cancel task
-   Complete task
-   Fail task
-   Task history
-   State transition validation

### Completion Criteria

Tasks have a predictable lifecycle independent of AI.

------------------------------------------------------------------------

## Stage 04 --- Event and Real-Time Infrastructure

**Status:** COMPLETED

### Objective

Turn task state changes and execution activity into real-time events.

### Tasks

-   Define event model.
-   Define event types.
-   Connect backend task lifecycle to events.
-   Expose events through WebSockets.
-   Authenticate WebSocket connections.
-   Update frontend in real time.
-   Add reconnect behavior.
-   Prevent duplicate/invalid event handling.

### Completion Criteria

A user can observe task state changes live.

No AI is required yet.

------------------------------------------------------------------------

## Stage 05 --- Tool Registry and Capability Model

**Status:** COMPLETED

### Objective

Create the generic tool framework that AEGIS will eventually reason
over.

### Tasks

Design:

-   Tool definition
-   Tool identity
-   Description
-   Input schema
-   Output schema
-   Tool status
-   Capability metadata
-   Permission requirements
-   Risk level
-   Execution constraints

Implement:

-   Tool registry
-   Tool discovery
-   Tool validation
-   Tool invocation abstraction
-   Tool result model

### Completion Criteria

AEGIS can register and discover abstract tools without yet implementing
every real-world tool.

------------------------------------------------------------------------

## Stage 06 --- Local Machine Agent

**Status:** COMPLETED

### Objective

Create the first controlled execution agent for the local development
environment.

### Tasks

-   Design machine-agent protocol.
-   Establish secure authentication.
-   Register machine identity.
-   Report OS and capabilities.
-   Implement heartbeat.
-   Implement controlled command execution.
-   Capture stdout/stderr.
-   Capture exit code.
-   Implement timeout handling.
-   Implement cancellation.
-   Implement basic filesystem operations where appropriate.
-   Add audit information.

### Completion Criteria

AEGIS can securely communicate with a local machine agent and perform
controlled operations.

The agent must not expose an unrestricted remote shell.

------------------------------------------------------------------------

## Stage 07 --- Terminal and System Tooling

**Status:** COMPLETED

### Objective

Expose machine capabilities through the generic AEGIS tool system.

### Tools

Initially:

-   Execute command
-   Inspect processes
-   Inspect memory
-   Inspect CPU
-   Inspect disk
-   Inspect services
-   Inspect network
-   Read logs

### Completion Criteria

AEGIS has a proper tool abstraction over machine operations.

The planner still does not need to be autonomous yet.

------------------------------------------------------------------------

## Stage 08 --- Filesystem Tooling

**Status:** COMPLETED

### Objective

Provide controlled filesystem capabilities.

### Tasks

Implement secure operations such as:

-   List directory
-   Read file
-   Write file
-   Create directory
-   Move file
-   Copy file
-   Delete file
-   Search files
-   Inspect metadata

### Requirements

-   Path restrictions
-   Permission checks
-   Risk classification
-   Size limits
-   Timeout handling
-   Audit logging

### Completion Criteria

Filesystem access is controlled and exposed through the tool framework.

------------------------------------------------------------------------

## Stage 09 --- SSH and Remote Machines

**Status:** COMPLETED

### Objective

Allow AEGIS to manage authorized remote machines.

### Tasks

-   Add machine/resource model.
-   Add remote machine registration.
-   Implement SSH connectivity.
-   Secure credential/key handling.
-   Implement connection validation.
-   Expose remote command execution through the tool system.
-   Record machine activity.
-   Support connection failure handling.

### Completion Criteria

AEGIS can securely operate on an authorized remote Linux machine.

------------------------------------------------------------------------

## Stage 10 --- Database Tooling

**Status:** COMPLETED

### Objective

Give AEGIS controlled database capabilities.

### Tasks

-   Database connection/resource model.
-   Secure credential handling.
-   Connection testing.
-   Schema inspection.
-   Table inspection.
-   Read-only query execution.
-   Query result handling.
-   Query timeout.
-   Permission enforcement.
-   Destructive-operation classification.

Write/update operations should be added only with appropriate safety
controls.

### Completion Criteria

AEGIS can safely inspect and reason over an authorized database.

------------------------------------------------------------------------

## Stage 11 --- Git and Project Inspection

**Status:** COMPLETED

### Objective

Allow AEGIS to understand software projects.

### Tasks

-   Repository discovery.
-   Repository metadata.
-   Git status.
-   Branch information.
-   Commit history.
-   Diff inspection.
-   File inspection.
-   Build/test detection where practical.

### Completion Criteria

AEGIS can inspect a software project without requiring the coding agent
for basic repository understanding.

------------------------------------------------------------------------

## Stage 12 --- Web Research Capability

**Status:** COMPLETED

### Objective

Allow AEGIS to retrieve current information from the internet when a
task requires it.

### Tasks

-   Web search abstraction.
-   Search result model.
-   Page retrieval.
-   Source tracking.
-   Content extraction.
-   Search failure handling.
-   Result summarization support.

### Requirements

AEGIS should preserve source information so that conclusions can be
traced back to retrieved information.

### Completion Criteria

AEGIS can perform controlled web research as a tool.

------------------------------------------------------------------------

## Stage 13 --- Model Gateway

**Status:** COMPLETED

### Objective

Introduce the model abstraction without creating autonomous execution
yet.

### Tasks

-   Define model provider interface.
-   Define request/response model.
-   Provider configuration.
-   Provider adapters.
-   Model selection abstraction.
-   Error handling.
-   Timeout handling.
-   Usage metadata.
-   Context limits.

### Completion Criteria

AEGIS can communicate with a model through a provider-independent
abstraction.

------------------------------------------------------------------------

## Stage 14 --- Context and Memory Foundation

**Status:** COMPLETED

### Objective

Give AEGIS structured context for reasoning.

### Tasks

Define:

-   Task context
-   Tool context
-   Machine context
-   Project context
-   User preferences
-   Persistent memory
-   Execution history

Implement selective context retrieval.

### Completion Criteria

AEGIS can construct a relevant context for a task without dumping all
stored information into every model request.

------------------------------------------------------------------------

## Stage 15 --- Planner

**Status:** COMPLETED

### Objective

Allow AEGIS to transform natural-language objectives into structured
plans.

### Tasks

-   Intent representation.
-   Objective representation.
-   Plan representation.
-   Plan steps.
-   Dependencies.
-   Conditions.
-   Required capabilities.
-   Model-assisted planning.
-   Plan validation.
-   Plan persistence.

### Completion Criteria

AEGIS can produce a structured plan but should not yet blindly execute
every plan automatically.

------------------------------------------------------------------------

## Stage 16 --- Tool-Aware Reasoning

**Status:** UNCOMPLETED

### Objective

Teach the reasoning layer how to select tools based on capabilities.

### Tasks

-   Tool discovery for a task.
-   Capability matching.
-   Tool input generation.
-   Tool result interpretation.
-   Context updates after tool execution.
-   Tool failure interpretation.

### Completion Criteria

AEGIS can reason:

``` text
Objective
→ required capability
→ available tool
→ tool input
→ tool result
→ next decision
```

without relying on hardcoded objective-specific workflows.

------------------------------------------------------------------------

## Stage 17 --- Execution Engine

**Status:** UNCOMPLETED

### Objective

Connect plans to actual tool execution.

### Tasks

-   Execute plan steps.
-   Persist execution state.
-   Handle dependencies.
-   Handle timeouts.
-   Handle retries.
-   Handle cancellation.
-   Capture tool output.
-   Emit events.
-   Recover from recoverable failures.
-   Stop on unsafe conditions.

### Completion Criteria

AEGIS can execute a structured plan through tools.

------------------------------------------------------------------------

## Stage 18 --- Verification and Outcome Evaluation

**Status:** UNCOMPLETED

### Objective

Ensure AEGIS verifies whether an objective was actually achieved.

### Tasks

-   Verification steps.
-   Evidence model.
-   Expected vs actual outcome.
-   Automated checks.
-   Model-assisted evaluation.
-   Failed verification handling.
-   Re-planning after failed verification.

### Completion Criteria

AEGIS does not declare success merely because individual commands
succeeded.

------------------------------------------------------------------------

## Stage 19 --- Approval and Safety System

**Status:** UNCOMPLETED

### Objective

Introduce safe autonomy.

### Tasks

-   Risk classification.
-   Permission policies.
-   Approval requests.
-   User approval/rejection.
-   Approval expiration.
-   Approval audit.
-   Tool restrictions.
-   Machine restrictions.
-   Resource restrictions.
-   Destructive-operation safeguards.

### Completion Criteria

Sensitive operations can be paused until explicitly approved.

------------------------------------------------------------------------

## Stage 20 --- Failure Recovery and Autonomous Retry

**Status:** UNCOMPLETED

### Objective

Make AEGIS resilient when operations fail.

### Tasks

-   Failure classification.
-   Safe retry policy.
-   Retry limits.
-   Alternative tool selection.
-   Alternative strategy generation.
-   Re-planning.
-   Human escalation.
-   Failure summaries.

### Completion Criteria

AEGIS can recover from common operational failures without entering
uncontrolled loops.

------------------------------------------------------------------------

## Stage 21 --- Coding Agent Integration

**Status:** UNCOMPLETED

### Objective

Connect AEGIS to the external agentic IDE as a specialized coding
worker.

### Tasks

-   Define coding-agent protocol.
-   Define job/request model.
-   Define progress model.
-   Define result model.
-   Assign repository/project.
-   Send coding objective.
-   Receive progress.
-   Receive completion.
-   Receive failure.
-   Inspect changed files/diffs.
-   Trigger verification.
-   Continue/reject/reassign work.

### Completion Criteria

AEGIS can delegate coding objectives and supervise their completion.

AEGIS remains the overall orchestrator.

------------------------------------------------------------------------

## Stage 22 --- Full Multi-Agent Orchestration

**Status:** UNCOMPLETED

### Objective

Allow multiple specialized agents/capabilities to cooperate under AEGIS.

Possible future agents:

-   Coding agent
-   Research agent
-   Infrastructure agent
-   Database agent
-   Monitoring agent
-   Analysis agent

### Completion Criteria

AEGIS can assign specialized work while retaining centralized planning,
supervision, safety, and verification.

------------------------------------------------------------------------

## Stage 23 --- Scheduling and Background Tasks

**Status:** UNCOMPLETED

### Objective

Allow AEGIS to operate without an active user session.

### Tasks

-   Scheduled task model.
-   One-time schedules.
-   Recurring schedules.
-   Background execution.
-   Task notifications.
-   Failure alerts.
-   Schedule management.

### Completion Criteria

AEGIS can perform authorized recurring operations.

------------------------------------------------------------------------

## Stage 24 --- Monitoring and Proactive AEGIS

**Status:** UNCOMPLETED

### Objective

Move from reactive commands to controlled proactive operation.

Examples:

> "Tell me if the server becomes unhealthy."

> "Monitor disk usage."

> "Watch the application logs and alert me if errors spike."

### Tasks

-   Monitoring resources.
-   Thresholds.
-   Health checks.
-   Event triggers.
-   Alert generation.
-   Automatic diagnostic tasks.
-   Optional remediation with approval policies.

### Completion Criteria

AEGIS can detect relevant events and initiate authorized diagnostic
workflows.

------------------------------------------------------------------------

## Stage 25 --- Notifications

**Status:** UNCOMPLETED

### Objective

Ensure important events reach the user even when they are not actively
viewing AEGIS.

### Potential channels

-   Web UI
-   Browser notifications
-   iPhone push notifications
-   Email where appropriate

### Events

-   Task completed
-   Task failed
-   Approval required
-   Server unhealthy
-   Scheduled task failed
-   Important monitoring alert

### Completion Criteria

Users can reliably receive important AEGIS events outside the active
conversation.

------------------------------------------------------------------------

## Stage 26 --- iPhone / Mobile Experience

**Status:** UNCOMPLETED

### Objective

Provide practical mobile control over AEGIS.

### Initial capabilities

-   Login
-   Conversation
-   Task creation
-   Task monitoring
-   Approval
-   Cancellation
-   Notifications
-   Result viewing

### Completion Criteria

The user can operate AEGIS effectively from an iPhone without needing
the desktop UI.

------------------------------------------------------------------------

## Stage 27 --- Advanced Memory and Long-Term Knowledge

**Status:** UNCOMPLETED

### Objective

Allow AEGIS to become increasingly aware of the user's environment over
time.

### Tasks

-   Persistent knowledge.
-   Relationship between resources.
-   Historical task outcomes.
-   Learned operational context.
-   User preferences.
-   Project history.
-   Machine history.
-   Selective memory retrieval.
-   Memory correction/expiration.

### Completion Criteria

AEGIS can use relevant historical knowledge to improve future decisions
without relying on raw conversation history alone.

------------------------------------------------------------------------

## Stage 28 --- Security Hardening

**Status:** UNCOMPLETED

### Objective

Harden the complete system before serious real-world use.

### Areas

-   Authentication
-   Session security
-   Authorization
-   Secret management
-   Encryption
-   Machine authentication
-   SSH security
-   Database security
-   Tool isolation
-   Command restrictions
-   Rate limiting
-   Audit integrity
-   Input validation
-   Output handling
-   WebSocket security
-   Mobile security
-   Dependency security
-   Security testing

### Completion Criteria

The system has undergone a dedicated security review rather than relying
solely on framework defaults.

------------------------------------------------------------------------

## Stage 29 --- Reliability, Testing and Recovery

**Status:** UNCOMPLETED

### Objective

Test the complete autonomous system under realistic failure conditions.

### Test areas

-   Unit tests
-   Integration tests
-   API tests
-   WebSocket tests
-   Database tests
-   Tool tests
-   Machine-agent tests
-   Agent-integration tests
-   Failure/retry tests
-   Approval tests
-   Cancellation tests
-   Recovery tests
-   Security tests
-   Long-running task tests

### Completion Criteria

AEGIS behaves predictably under both normal and failure conditions.

------------------------------------------------------------------------

## Stage 30 --- Production Readiness

**Status:** UNCOMPLETED

### Objective

Prepare AEGIS for dependable daily use.

### Areas

-   Configuration review
-   Secrets review
-   Logging
-   Monitoring
-   Backup/recovery
-   Database backup strategy
-   Update strategy
-   Health checks
-   Operational documentation
-   Disaster recovery
-   Security review
-   Performance review

### Completion Criteria

AEGIS can be operated as a dependable personal command center.

------------------------------------------------------------------------

# 26. Stage Execution Rules

The development agent must follow these rules.

## Rule 1 --- One Stage at a Time

Do not implement multiple roadmap stages simultaneously unless
explicitly instructed.

------------------------------------------------------------------------

## Rule 2 --- Do Not Jump Ahead

Do not implement future functionality simply because it appears useful.

For example:

-   Stage 05 should not implement autonomous planning.
-   Stage 06 should not implement AI reasoning.
-   Stage 15 should not implement full autonomous execution.
-   Stage 21 should not be started during early tool development.

------------------------------------------------------------------------

## Rule 3 --- Preserve Existing Architecture

Do not rewrite working baseline components without a concrete
architectural reason.

Prefer incremental changes.

------------------------------------------------------------------------

## Rule 4 --- Keep Future Boundaries Clean

Even when implementing one stage, avoid designs that make later stages
difficult.

The current implementation should leave clean extension points.

------------------------------------------------------------------------

## Rule 5 --- Do Not Hardcode Workflows

Avoid code such as:

``` text
if request == "restart server":
    restartServer()
```

AEGIS should eventually reason over capabilities.

Hardcoded orchestration is acceptable only for infrastructure concerns
where deterministic behavior is required.

------------------------------------------------------------------------

## Rule 6 --- Security Is Mandatory

Every new capability must define:

-   Who can use it
-   What resources it can access
-   What inputs are accepted
-   What risks exist
-   What should be audited
-   Whether approval is required

------------------------------------------------------------------------

## Rule 7 --- Verify Before Declaring Completion

A stage is not complete because the code compiles.

The agent must:

1.  Implement the stage.
2.  Run relevant tests.
3.  Run the application where applicable.
4.  Verify expected behavior.
5.  Review changed files.
6.  Document important decisions.
7.  Update the stage status.

------------------------------------------------------------------------

# 27. Definition of Done for Every Stage

Every stage must finish with:

### Implementation

Required functionality is implemented.

### Validation

Relevant tests and manual checks pass.

### Architecture

The implementation fits the AEGIS architecture.

### Security

Security implications have been considered.

### Documentation

Important decisions and usage are documented.

### Status

The stage status is updated.

### No Scope Leakage

Future-stage functionality has not been unnecessarily implemented.

------------------------------------------------------------------------

# 28. Current Development State

The baseline application exists.

The next development target is:

> **Stage 01 --- Architecture & Foundation Review**

No autonomous AI behavior should be implemented until the appropriate
roadmap stages are reached.

The roadmap itself is the source of truth for implementation sequencing.

------------------------------------------------------------------------

# 29. Final Vision

The completed AEGIS system should allow the user to say things such as:

> "Check why the application is down."

> "Find out why this server is running out of disk space."

> "Deploy the latest version of this project."

> "Look at the database and tell me why this query is slow."

> "Fix the bug in the employee module."

> "Research the latest solution to this error and apply it."

> "Monitor this server and tell me if something goes wrong."

AEGIS should be capable of turning those objectives into appropriate
actions instead of requiring the user to manually specify every command.

The final system should combine:

``` text
Natural Language
       ↓
Intent Understanding
       ↓
Context
       ↓
Planning
       ↓
Capability Selection
       ↓
Tool / Agent Execution
       ↓
Observation
       ↓
Verification
       ↓
Recovery / Re-planning
       ↓
Result
       ↓
User
```

The ultimate objective is not merely to make AEGIS capable of executing
commands.

The objective is to create a **safe, observable, extensible personal AI
operations system that can understand objectives and coordinate the
user's computing environment on their behalf.**

------------------------------------------------------------------------

# 30. Self-Upgrading / Self-Modifying Capability

An ultimate objective for AEGIS is the ability to recursively expand its own capabilities. 

If the user gives AEGIS a task for which it currently lacks the appropriate tool or capability, AEGIS should not simply fail. Instead, it should:

1. **Identify the Gap**: Recognize that it does not have the necessary built-in capability to achieve the objective.
2. **Formulate an Upgrade Plan**: Determine what new tool, API integration, or script is required.
3. **Delegate to the Coding Agent**: Pass the requirements to the external agentic IDE (Google Antigravity) to write the code for the new tool and integrate it into AEGIS's own codebase.
4. **Test and Verify**: Have the coding agent write tests and verify that the new capability compiles and functions securely.
5. **Hot-Reload / Deploy**: Automatically deploy or hot-reload the updated AEGIS instance with the newly acquired capability.
6. **Resume the Original Task**: Finally, use the newly minted tool to successfully complete the user's original request.

This enables AEGIS to be a truly unbounded, self-improving operational system.
