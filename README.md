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

---

## Production Deployment & CI/CD Pipeline

AEGIS features an enterprise-grade automated CI/CD pipeline powered by GitHub Actions ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)). On push to `main`, the pipeline runs tests, compiles the Spring Boot executable JAR, builds the Vite production PWA bundle, transfers release packages to the Ubuntu server via SCP, and atomically activates the release with health checks and automatic rollback capabilities.

### Required GitHub Repository Secrets

Configure these secrets in **GitHub → Repository Settings → Secrets and variables → Actions**:

#### 1. Server & SSH Access (Mandatory)
| Secret Name | Required | Default | Description | Example |
| :--- | :---: | :---: | :--- | :--- |
| `SERVER_HOST` | **Yes** | — | Public IP address or domain of the Ubuntu server | `192.0.2.1` or `aegis.example.com` |
| `SERVER_USER` | **Yes** | — | SSH deployment username on the server (with sudo access) | `ubuntu` or `root` |
| `SERVER_SSH_KEY` | **Yes** | — | OpenSSH private key matching server's `~/.ssh/authorized_keys` | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SERVER_PORT` | No | `22` | SSH port on remote server | `22` |

#### 2. Database Configuration (Mandatory)
| Secret Name | Required | Default | Description | Example |
| :--- | :---: | :---: | :--- | :--- |
| `SPRING_DATASOURCE_URL` | **Yes** | — | JDBC connection string to the production MySQL database | `jdbc:mysql://localhost:3306/aegis?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true` |
| `SPRING_DATASOURCE_USERNAME` | **Yes** | — | MySQL database username | `aegis_user` |
| `SPRING_DATASOURCE_PASSWORD` | **Yes** | — | MySQL database user password | `your_secure_db_password` |

#### 3. Security & Cryptographic Keys (Mandatory)
| Secret Name | Required | Default | Description | Example |
| :--- | :---: | :---: | :--- | :--- |
| `JWT_SECRET` | **Yes** | — | 256-bit+ secret key for HMAC-SHA256 JWT tokens (min 32 chars) | `32+_character_random_jwt_secret_key` |
| `AEGIS_SECRET_KEY` | **Yes** | — | 256-bit master encryption key for sensitive data (min 32 chars) | `32+_character_master_encryption_key` |
| `CORS_ALLOWED_ORIGINS` | No | `http://${SERVER_HOST},http://localhost` | Comma-separated CORS allowed origins | `http://192.0.2.1,https://aegis.example.com` |

#### 4. Multi-Model Gateway & AI Fallback Cascade
The Model Gateway supports automatic fallback across multiple providers. If the primary model hits a rate limit (HTTP 429) or provider outage, it immediately cascades to fallback tiers:

| Secret Name | Required | Default | Description | Example |
| :--- | :---: | :---: | :--- | :--- |
| `AEGIS_MODEL_PRIMARY_API_KEY` | Recommended | — | Primary model provider API key (*alias: `AEGIS_MODEL_API_KEY`*) | `sk-...` (OpenAI or Groq) |
| `AEGIS_MODEL_PRIMARY_PROVIDER` | No | `openai` | Primary provider type (`openai`, `groq`, `gemini`, etc.) | `openai` |
| `AEGIS_MODEL_PRIMARY_ENDPOINT` | No | `https://api.openai.com/v1` | OpenAI-compatible endpoint URL | `https://api.openai.com/v1` |
| `AEGIS_MODEL_PRIMARY_NAME` | No | `gpt-4o` | Model identifier | `gpt-4o` |
| `AEGIS_MODEL_FALLBACK1_API_KEY` | No | — | Free-tier Fallback 1 API key (Groq fast inference) | `gsk_...` |
| `AEGIS_MODEL_FALLBACK1_PROVIDER` | No | `groq` | Fallback 1 provider | `groq` |
| `AEGIS_MODEL_FALLBACK1_ENDPOINT` | No | `https://api.groq.com/openai/v1` | Fallback 1 API endpoint | `https://api.groq.com/openai/v1` |
| `AEGIS_MODEL_FALLBACK1_NAME` | No | `llama-3.3-70b-versatile` | Fallback 1 model identifier | `llama-3.3-70b-versatile` |
| `AEGIS_MODEL_FALLBACK2_API_KEY` | No | — | Free-tier Fallback 2 API key (Google Gemini AI Studio) | `AIzaSy...` |
| `AEGIS_MODEL_FALLBACK2_PROVIDER` | No | `gemini` | Fallback 2 provider | `gemini` |
| `AEGIS_MODEL_FALLBACK2_ENDPOINT` | No | `https://generativelanguage.googleapis.com/v1beta/openai/` | Fallback 2 API endpoint | Google OpenAI endpoint |
| `AEGIS_MODEL_FALLBACK2_NAME` | No | `gemini-1.5-flash` | Fallback 2 model identifier | `gemini-1.5-flash` |
| `AEGIS_MODEL_FALLBACK3_API_KEY` | No | — | Free-tier Fallback 3 API key (OpenRouter / DeepSeek / Mistral) | `sk-or-v1-...` |
| `AEGIS_MODEL_FALLBACK3_PROVIDER` | No | `openrouter` | Fallback 3 provider | `openrouter` |
| `AEGIS_MODEL_FALLBACK3_ENDPOINT` | No | `https://openrouter.ai/api/v1` | Fallback 3 API endpoint | `https://openrouter.ai/api/v1` |
| `AEGIS_MODEL_FALLBACK3_NAME` | No | `meta-llama/llama-3.1-8b-instruct:free` | Fallback 3 model identifier | `meta-llama/llama-3.1-8b-instruct:free` |

For complete server setup, Nginx reverse proxy configuration, systemd daemon management, and disaster recovery procedures, refer to the [Operations Runbook](runbooks/operations.md).
