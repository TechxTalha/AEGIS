# Implementation Plan for Stage 26: iPhone / Mobile Experience

## Overview
Stage 26 involves building the responsive Web App (PWA) using the existing Vite + React frontend foundation in `c:\AEGIS\frontend`. The goal is to provide a seamless mobile experience (primarily targeting iPhone) to interact with the AEGIS orchestrator.

## Scope Requirements
- **Responsive Interface:** Tailwind CSS and Ant Design configurations optimized for mobile views.
- **Mobile Authentication:** JWT login page targeting `/api/auth/login`.
- **Operational Dashboard:** Overview of agent status, recent tasks, and system health.
- **Task Lifecycle UI:** Create tasks, view history, observe task status and execution progress in real-time.
- **Real-time Events:** Connect to STOMP/WebSocket to stream progress updates and notifications.
- **Approvals:** UI to approve or deny high-risk tool execution requests.
- **Machine/Agent Status:** A screen to view connected machine agents and their capabilities.

## Implementation Steps

### Step 1: PWA & Core Layout Configuration
- Set up React Router with a mobile-first Layout (Bottom Tab Bar or Hamburger Menu depending on best fit for iPhone).
- Configure `manifest.json` and meta tags for iOS PWA support (standalone mode, theme color).
- Create the Auth context and JWT interceptor for Axios to handle API requests securely.

### Step 2: Authentication & Dashboard
- Implement `Login.jsx` to interface with the backend JWT auth endpoint.
- Implement `Dashboard.jsx` to display a summary (active tasks, online agents, pending approvals).

### Step 3: Tasks and Progress Tracking
- Implement `TaskList.jsx` to fetch and display the history of tasks.
- Implement `TaskDetail.jsx` with real-time WebSocket connection to stream execution events and progress.
- Implement `TaskCreate.jsx` with a form to submit new natural language objectives.

### Step 4: Approvals & Notifications
- Implement `ApprovalQueue.jsx` to list pending `WAITING_FOR_APPROVAL` tasks and provide Accept/Deny buttons.
- Integrate notification toasts for real-time alerts.

### Step 5: Agent Management
- Implement `AgentList.jsx` to view registered machine agents and their capabilities.

### Step 6: Testing & Verification
- Run `npm run dev` and test responsiveness using Chrome DevTools (iPhone SE / 14 Pro view).
- Verify API calls route correctly to the backend and WebSockets receive task events.
