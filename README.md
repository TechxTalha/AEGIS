# AEGIS: Personal AI Command Center

![Project Aegis](Project%20Aegis.png)

## Overview

**AEGIS** is an autonomous operations system and personal AI command center. Rather than a standard chatbot or dashboard, AEGIS is designed to act as a supervisor orchestrating a distributed collection of capabilities.

The core idea is simple but powerful: 
> You give AEGIS an objective. AEGIS determines what capabilities are required, creates an execution plan, delegates to appropriate tools and specialized agents (such as **Google Antigravity** for coding), observes the results, verifies progress, handles failures, and reports back to you.

### Core Architectural Principles
- **Capability-Based Orchestration**: AEGIS reasons over controlled capabilities (e.g., execute a command, query a database, read a file, SSH into a server) rather than rigid, predefined business logic.
- **Agentic Delegation**: AEGIS handles planning and high-level decisions, while specialized agents like **Google Antigravity** handle complex, isolated tasks like software development.
- **Model Independence & Layering**: AEGIS uses a multi-model fallback strategy. It leverages layers of free AI models (OpenAI, Anthropic, Google, Local), ensuring that if one provider fails or hits a rate limit, another seamlessly takes its place without interrupting the workflow.
- **Observable & Safe**: Every autonomous action is tracked, and strict safety boundaries prevent destructive operations without explicit approval.

---

## Technical Foundation

Currently, the project is established on a clean, scalable full-stack boilerplate designed to act as a modular, secure blank slate for future autonomous logic.

### Technology Stack
- **Backend**: Java 25, Spring Boot 3.5.16
- **Frontend**: React 19, Vite, Tailwind CSS, Ant Design
- **Database**: MySQL 8.0, Flyway
- **Security**: Stateless JWT (HttpOnly cookie for Refresh Token, memory for Access Token)

### Project Structure
- `/backend` - Spring Boot REST API
- `/frontend` - React SPA
- `.env.example` - Template for required environment variables

---

## Running Locally

### Prerequisites
- JDK 25
- Node.js 20+
- MySQL 8.0 server running locally
- Maven 3.9+

### 1. Environment Variables
Copy `.env.example` to `.env` in the root directory and configure it with your local MySQL credentials:

```bash
cp .env.example .env
```

### 2. Database
Ensure your local MySQL server is running. Create the database specified in your `.env` file (e.g., `aegis`) and ensure the user has the necessary permissions. You do not need to create tables; Flyway will handle schema creation.

### 3. Backend
Navigate to the `backend` directory and run the Spring Boot application. Flyway will automatically run the database migrations on startup.

```bash
cd backend
mvn spring-boot:run
```

The API will be available at `http://localhost:8080`.
API Documentation (Swagger UI) will be available at `http://localhost:8080/swagger-ui.html`.

### 4. Frontend
Navigate to the `frontend` directory, install dependencies, and start the development server.

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`.
