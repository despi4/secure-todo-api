# Secure Task Management API

Backend project for **Web Technologies 2 (Backend)**.  
This project implements a secure RESTful API for managing tasks with authentication, authorization, and MongoDB persistence.

---

## 📌 Features

- User authentication (register / login / logout / me)
- Role-based access control (user / admin)
- Task CRUD operations
- Ownership checks (only author or admin can modify/delete)
- Secure password storage (bcrypt)
- Token-based authentication using HttpOnly cookies
- Input validation and sanitization
- Rate limiting on authentication endpoints
- Docker & docker-compose support
- Optional UI (HTML/CSS/JS client)

---

## 🛠 Technology Stack

- **Node.js**
- **Express**
- **MongoDB** (native driver, no Mongoose)
- **bcrypt**
- **JWT**
- **Docker & Docker Compose**


---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017
MONGO_DB=task_api
JWT_SECRET=super_secret_key
CORS_ORIGIN=http://localhost:5173
```

## Running the Project

npm install
node src/server.js

http://localhost:3000
