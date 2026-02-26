# Authentication System

## Overview
The BetterMe Drone Delivery Tax Admin Panel now includes a complete authentication system with role-based access control.

## Features

### 1. User Registration
- New users can create accounts via `/register`
- Validates password length (minimum 6 characters)
- Checks for duplicate emails
- New users are assigned 'user' role by default

### 2. User Login
- Users can sign in via `/login`
- Demo credentials provided:
  - **Admin**: admin@betterme.com / admin123
  - **User**: user@example.com / user123

### 3. Profile Management
- View and edit profile information at `/profile`
- Update: name, email, phone, company
- Display role badge (Admin/User)
- Shows member since date

### 4. Admin-Only Features
- Special admin dashboard at `/admin`
- **User Management**: View all users, toggle roles, activate/deactivate users
- **System Settings**: Configure 2FA, email notifications
- **Activity Log**: Recent system activities
- **Admin menu item only visible to admins**

### 5. Protected Routes
- All main routes require authentication
- Redirect to login if not authenticated
- Admin routes require admin role
- Regular users cannot access admin panel

## User Roles

### User (Regular)
- Access to: Dashboard, Orders List, Import CSV, Create Order, Profile
- Can view and manage orders
- Can import CSV data
- Cannot access admin panel

### Admin
- **All user permissions PLUS:**
- Access to Admin Panel (`/admin`)
- User management capabilities
- System settings configuration
- View activity logs

## How It Works

### Frontend Authentication
```typescript
// Uses React Context for global auth state
const { user, isAuthenticated, isAdmin, login, logout } = useAuth();

// Protected routes check authentication
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Admin-only routes check admin role
<ProtectedRoute requireAdmin>
  <AdminPanel />
</ProtectedRoute>
```

### Data Storage
- Currently uses **localStorage** for demo purposes
- Mock user database in `AuthContext.tsx`
- For production: integrate with Python backend or Supabase

## Security Notes

⚠️ **Important**: This is a frontend-only demo implementation for development/testing.

For production, you should:
1. Move authentication to your Python FastAPI backend
2. Use JWT tokens or session-based auth
3. Hash passwords with bcrypt
4. Add HTTPS/TLS encryption
5. Implement rate limiting
6. Add CSRF protection
7. Use secure cookies for tokens

## Navigation Updates

### Sidebar (Desktop)
- Dashboard
- Orders List
- Import CSV
- Create Order
- Profile
- **Admin Panel** (admin only)
- Logout button at bottom

### Bottom Navigation (Mobile)
- Same menu items, responsive grid
- 5 columns for regular users
- 6 columns for admin users

### Header
- Displays logged-in user name and email
- Avatar with first letter of name
- Clickable avatar navigates to profile
- Logout button (desktop only)

## Testing

### Test Accounts
1. **Admin User**
   - Email: admin@betterme.com
   - Password: admin123
   - Can access all features including Admin Panel

2. **Regular User**
   - Email: user@example.com
   - Password: user123
   - Cannot access Admin Panel

### Test Scenarios
- [x] Register new account
- [x] Login with existing account
- [x] Access protected routes when authenticated
- [x] Redirect to login when not authenticated
- [x] Edit profile information
- [x] Admin can access Admin Panel
- [x] Regular user cannot access Admin Panel
- [x] Logout and session cleared

## Future Enhancements

1. **Backend Integration**
   - Connect to Python FastAPI backend
   - Real database storage
   - Secure password hashing

2. **Additional Features**
   - Password reset/forgot password
   - Email verification
   - Two-factor authentication (2FA)
   - Session timeout
   - Remember me functionality
   - OAuth/SSO integration

3. **Admin Features**
   - Bulk user operations
   - Audit logs
   - Permission management
   - Advanced analytics
   - System health monitoring
