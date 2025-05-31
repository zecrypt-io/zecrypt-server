# Zecrypt Server

A modern, secure, and scalable application built with FastAPI and Next.js. This monorepo contains both the backend server and frontend web application.

## 🚀 Features

- **Backend (FastAPI)**
  - RESTful API with OpenAPI documentation
  - MongoDB database integration
  - JWT authentication
  - Rate limiting
  - CORS support
  - Internationalization (i18n)
  - Structured logging
  - Redis caching
  - TOTP (Time-based One-Time Password) support

- **Frontend (Next.js)**
  - Modern React with TypeScript
  - Responsive UI with Tailwind CSS
  - Internationalization support
  - Dark/Light theme
  - Redux state management
  - Form handling with React Hook Form
  - Beautiful UI components with Radix UI
  - Toast notifications
  - Data visualization with Recharts

## 📋 Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB
- Redis
- Docker (optional)

## 🛠️ Installation

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd packages/backend-server
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file with the following variables:
   ```env
   MONGO_DB_URL=your_mongodb_url
   JWT_SECRET=your_jwt_secret
   JWT_ALGORITHM=HS512
   ENV=development
   DB_NAME=your_db_name
   STACK_AUTH_PROJECT_ID=your_project_id
   STACK_AUTH_CLIENT_ID=your_client_id
   STACK_AUTH_CLIENT_SECRET=your_client_secret
   TOTP_SECRET=your_totp_secret
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd packages/frontend-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with necessary environment variables (if required)

## 🚀 Running the Application

### Backend

1. Start the backend server:
   ```bash
   cd packages/backend-server
   uvicorn app.main:app --reload
   ```

   The server will start at `http://localhost:8000`

   - API Documentation: `http://localhost:8000/docs` (Swagger UI)
   - Alternative Documentation: `http://localhost:8000/redoc` (ReDoc)

### Frontend

1. Start the frontend development server:
   ```bash
   cd packages/frontend-web
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## 🐳 Docker Deployment

### Backend

1. Build the Docker image:
   ```bash
   cd packages/backend-server
   docker build -t zecrypt-backend .
   ```

2. Run the container:
   ```bash
   docker run -p 8080:8080 zecrypt-backend
   ```

### Frontend

1. Build the Docker image:
   ```bash
   cd packages/frontend-web
   docker build -t zecrypt-frontend .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 zecrypt-frontend
   ```

## 📚 API Documentation

When running in development mode, the API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI Schema: `http://localhost:8000/openapi.json`

Note: API documentation is disabled in production environment for security reasons.

## 🔒 Security

- JWT-based authentication
- Rate limiting to prevent abuse
- CORS protection
- Environment-based configuration
- Secure password hashing
- TOTP for two-factor authentication

## 🌐 Internationalization

The application supports multiple languages through:
- Backend: Custom i18n implementation
- Frontend: next-intl for translations

## 📝 License

This project is licensed under the terms of the license included in the repository.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support, please open an issue in the repository or contact the maintainer [@anandude](https://github.com/anandude) [itsmeakhil](https://github.com/itsmeakhil). 
 