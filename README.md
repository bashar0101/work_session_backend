# Working Hours Tracker Backend

A RESTful API built with Express.js and MongoDB for tracking employee working hours.

## Features

- User registration and authentication with JWT
- Email verification for new accounts
- Password reset via email
- Start and end work sessions
- Track daily working hours
- Role-based access control (User/Manager)
- MongoDB storage for all data

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. Clone the repository or navigate to the project directory

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory:

```env
PORT=5000
MONGODB_URI= your_connection
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (for email verification and password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
```

**Email Setup:**

- For Gmail: Use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password
- For other email providers, update SMTP_HOST and SMTP_PORT accordingly

4. Make sure MongoDB is running on your system

5. Start the server:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## API Endpoints

### Authentication

#### Register User

- **POST** `/api/auth/register`
- **Body:**

```json
{
  "email": "user@example.com",
  "name": "John",
  "lastname": "Doe",
  "password": "password123"
}
```

#### Login

- **POST** `/api/auth/login`
- **Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

- **Note:** Email must be verified before login

#### Verify Email

- **GET** `/api/auth/verify-email?token=<verification-token>`
- Verifies user's email address using the token sent in registration email
- Automatically logs in the user after verification

#### Resend Verification Email

- **POST** `/api/auth/resend-verification`
- **Body:**

```json
{
  "email": "user@example.com"
}
```

- Resends verification email if user didn't receive it or token expired

#### Forgot Password (Request Reset)

- **POST** `/api/auth/forgot-password`
- **Body:**

```json
{
  "email": "user@example.com"
}
```

- Sends password reset link to user's email

#### Reset Password

- **POST** `/api/auth/reset-password`
- **Body:**

```json
{
  "token": "reset-token-from-email",
  "password": "newpassword123"
}
```

- Resets password using token from email

### Work Tracking

All work endpoints require authentication. **JWT tokens are automatically stored in httpOnly cookies** after login/register, so you don't need to send the token manually. The browser will automatically include the cookie with each request.

#### Start Work

- **POST** `/api/work/start`
- **Note:** No headers needed - cookie is sent automatically

#### End Work

- **POST** `/api/work/end`
- **Note:** No headers needed - cookie is sent automatically

#### Get Current Active Session

- **GET** `/api/work/current`
- **Note:** No headers needed - cookie is sent automatically
- **Query Parameters (optional, Manager only):**
  - `userId`: Get active session for specific user (managers only)

#### Get Daily Working Hours

- **GET** `/api/work/daily`
- **Note:** No headers needed - cookie is sent automatically
- **Query Parameters (optional):**
  - `date`: Filter by specific date (YYYY-MM-DD format)
  - `userId`: Get hours for specific user (managers only)

#### Get All Users (Manager only)

- **GET** `/api/work/users`
- **Note:** Requires manager role
- Returns list of all users

#### Get All Work Sessions (Manager only)

- **GET** `/api/work/all-sessions`
- **Note:** Requires manager role
- **Query Parameters (optional):**
  - `date`: Filter by specific date (YYYY-MM-DD format)
  - `userId`: Filter by specific user
- Returns all work sessions grouped by user

#### Logout

- **POST** `/api/auth/logout`
- Clears the authentication cookie

#### Get Current User Info

- **GET** `/api/auth/me`
- Returns current authenticated user information including role

### User Management (Manager only)

#### Update User Role

- **PUT** `/api/users/role`
- **Body:**

```json
{
  "email": "user@example.com",
  "role": "manager"
}
```

- **Note:** Requires manager role
- Valid roles: `"user"` or `"manager"`
- Updates user role by email address (easier than using user ID)

## Example Usage

### 1. Register a new user

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "john@example.com",
    "name": "John",
    "lastname": "Doe",
    "password": "password123"
  }'
```

**Note:** The `-c cookies.txt` flag saves the cookie to a file. The token is automatically stored in a cookie.

### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Note:** The `-c cookies.txt` flag saves the cookie to a file. The token is automatically stored in a cookie.

### 3. Start work session

```bash
curl -X POST http://localhost:5000/api/work/start \
  -b cookies.txt
```

**Note:** The `-b cookies.txt` flag sends the saved cookie. No token needed in headers!

### 4. End work session

```bash
curl -X POST http://localhost:5000/api/work/end \
  -b cookies.txt
```

**Note:** The `-b cookies.txt` flag sends the saved cookie. No token needed in headers!

### 5. Get daily hours

```bash
curl -X GET http://localhost:5000/api/work/daily \
  -b cookies.txt
```

### 6. Verify Email

After registration, check your email and click the verification link, or use the token:

```bash
curl -X GET "http://localhost:5000/api/auth/verify-email?token=YOUR_VERIFICATION_TOKEN" \
  -c cookies.txt
```

### 7. Resend Verification Email

```bash
curl -X POST http://localhost:5000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### 8. Request Password Reset

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### 9. Reset Password

```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset-token-from-email",
    "password": "newpassword123"
  }'
```

### 10. Logout

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -b cookies.txt \
  -c cookies.txt
```

**Note:** Using cookies means you don't need to manually handle tokens. The browser (or curl with `-b` flag) automatically sends the cookie with each request.

### Using JavaScript/Fetch

When using fetch in a browser, make sure to include `credentials: 'include'`:

```javascript
// Login
fetch("http://localhost:5000/api/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include", // Important: allows cookies to be sent
  body: JSON.stringify({
    email: "john@example.com",
    password: "password123",
  }),
})
  .then((res) => res.json())
  .then((data) => console.log(data));

// Start work (no token needed!)
fetch("http://localhost:5000/api/work/start", {
  method: "POST",
  credentials: "include", // Cookie is sent automatically
})
  .then((res) => res.json())
  .then((data) => console.log(data));
```

## Project Structure

```
working-hours-tracker/
├── models/
│   ├── User.js          # User model (with role field)
│   └── WorkSession.js   # Work session model
├── routes/
│   ├── auth.js          # Authentication routes
│   ├── work.js          # Work tracking routes
│   └── users.js         # User management routes (manager only)
├── middleware/
│   ├── auth.js          # JWT authentication middleware
│   └── manager.js       # Manager role verification middleware
├── server.js            # Express server setup
├── package.json
├── .env                 # Environment variables (create this)
└── README.md
```

## Role-Based Access Control

The application supports two roles:

- **User** (default): Can only view and manage their own work sessions
- **Manager**: Can view all users' data and manage user roles

### Creating a Manager

To create the first manager, you can:

1. Register a user normally (defaults to "user" role)
2. Manually update the role in MongoDB:
   ```javascript
   db.users.updateOne(
     { email: "manager@example.com" },
     { $set: { role: "manager" } }
   );
   ```
3. Or use the API endpoint (if you already have a manager):
   ```bash
   PUT /api/users/role
   Body: { "email": "user@example.com", "role": "manager" }
   ```

### Manager Capabilities

- View all users list (`GET /api/work/users`)
- View all work sessions from all users (`GET /api/work/all-sessions`)
- View specific user's work sessions by passing `userId` query parameter
- Update user roles by email (`PUT /api/users/role`)

## Email Verification & Password Reset

### Email Verification Flow

1. User registers → Verification email is sent automatically
2. User clicks link in email → Email is verified and user is logged in
3. User can resend verification email if needed

### Password Reset Flow

1. User requests password reset → Reset email is sent
2. User clicks link in email → Redirects to reset password page
3. User enters new password → Password is updated

### Email Configuration

The application uses nodemailer for sending emails. Configure your SMTP settings in `.env`:

- **Gmail**: Use an App Password (not your regular password)
- **Other providers**: Update `SMTP_HOST` and `SMTP_PORT` accordingly

Common SMTP settings:

- Gmail: `smtp.gmail.com:587`
- Outlook: `smtp-mail.outlook.com:587`
- Yahoo: `smtp.mail.yahoo.com:587`

## Security Notes

- Passwords are hashed using bcryptjs
- JWT tokens expire after 7 days
- Email verification tokens expire after 24 hours
- Password reset tokens expire after 1 hour
- Change the JWT_SECRET in production
- Use HTTPS in production
- Implement rate limiting for production use
- Manager endpoints are protected by role-based middleware
- Email verification is required before login (can be disabled in code)
