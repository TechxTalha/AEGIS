# AEGIS Boilerplate

A modern, scalable, and secure full-stack boilerplate for the upcoming AEGIS project.

## Technology Stack

- **Backend**: Java 25, Spring Boot 3.5.16
- **Frontend**: React 19, Vite, Tailwind CSS, Ant Design
- **Database**: MySQL 8.0, Flyway
- **Security**: Stateless JWT (HttpOnly cookie for Refresh Token, memory for Access Token)

## Project Structure

- `/backend` - Spring Boot REST API
- `/frontend` - React SPA
- `.env.example` - Template for required environment variables

## Prerequisites

- JDK 25
- Node.js 20+
- MySQL 8.0 server running locally
- Maven 3.9+

## Running Locally

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

## Architecture Principles

- **Modular Monolith**: Organized by feature (`com.aegis.core.auth`, `com.aegis.core.user`).
- **Secure Authentication**: XSS-resistant architecture using `HttpOnly` cookies.
- **Migration First**: No Hibernate auto-DDL. All schema changes are explicitly versioned in `backend/src/main/resources/db/migration`.
