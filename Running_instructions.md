# Instructions for Running the Application

## Prerequisites
- Docker and Docker Compose installed on your machine.
- Database reader for checking the PostgreSQL database (e.g., pgAdmin, DBeaver, or psql CLI).
- Optional: Node.js and npm for running the backend and frontend locally without Docker.

## Prepare Environment Variables

Create a `.env` file in the root directory of the project with the following content:

```env
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=tododb
REACT_APP_API_URL="http://localhost:8081"
```

## Running with Docker Compose
1. Open a terminal and navigate to the root directory of the project.
2. Run the following command to build and start the application:

```bash
docker-compose up --build
```

3. Open your browser and navigate to `http://localhost:3001` to access the frontend application.

- If the frontend does not load or appear the death screen, check the terminal for any errors and ensure that the backend is running properly.

- If any error occurs, check the logs of the backend and database services:

```bash
docker-compose logs backend
docker-compose logs postgres
```

- Otherwise, compose down the docker containers:

```bash
docker-compose down -v && docker-compose up --build
```
