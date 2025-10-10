# User Management Microservice

A robust Node.js/Express microservice for user management, supporting all user lifecycle actions (signup, login, password reset, account termination, admin actions, etc.).

---

## Features
- User registration, login, and profile management
- Password reset (OTP/email-based)
- Admin actions: block/unblock, delete, role change, etc.
- JWT-based authentication
- Session management (with Redis)
- File upload support
- Input validation and security best practices
- Centralized error and response handling
- API documentation (Swagger/OpenAPI)
- Health check endpoint
- Logging (Winston)
- Rate limiting, CORS, and secure HTTP headers
- Ready for containerization and production

---

## Getting Started

### 1. **Clone the repository**
```sh
git clone <your-repo-url>
cd userManagementBackend
```

### 2. **Install dependencies**
```sh
npm install
```

### 3. **Environment Variables**
- Copy `.env.example` to `.env` and fill in your values:

```
PORT=3000
DB_URI=mongodb://localhost:27017/userdb
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
LOG_LEVEL=info
```

### 4. **Run the service**
```sh
npm start
```

### 5. **API Documentation**
- Visit [http://localhost:3000/docs](http://localhost:3000/docs) for interactive Swagger docs after starting the server.

### 6. **Health Check**
- [http://localhost:3000/health](http://localhost:3000/health)

---

## Scripts
- `npm start` — Start the server
- `npm test` — Run tests (Jest)
- `npm run lint` — Lint code (ESLint)
- `npm run format` — Format code (Prettier)

---

## Project Structure
```
userManagementBackend/
├── index.js                # Main entry point
├── src/
│   ├── auth/               # Auth logic
│   ├── controllers/        # Route controllers
│   ├── db/                 # Database connection
│   ├── helpers/            # Utility helpers
│   ├── middlewares/        # Custom middlewares (logger, error, security, etc.)
│   ├── models/             # Mongoose models
│   ├── routes/             # Express routes
│   └── redis.js            # Redis integration
├── public/                 # File uploads
├── tests/                  # Jest/Supertest tests
├── .env.example            # Example environment variables
├── .eslintrc.json          # ESLint config
├── .prettierrc             # Prettier config
├── package.json            # Project metadata
└── readme.md               # This file
```

---

## Best Practices Followed
- **Security:** Helmet, CORS, rate limiting, environment variables
- **Validation:** All input validated with express-validator
- **Error Handling:** Centralized error handler
- **Logging:** Winston logger with log levels
- **Testing:** Jest and Supertest setup
- **Documentation:** Swagger UI at `/docs`
- **Health Check:** `/health` endpoint for orchestration

---

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## License
[MIT](LICENSE)
