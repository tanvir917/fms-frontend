# Frontend Backend Integration Guide

This frontend supports both Django and .NET Core backend APIs. You can switch between them using environment variables.

## Backend Configuration

### Using Django Backend (Default)

Create `.env.local` with:

```
REACT_APP_USE_DOTNET_APIS=false
```

### Using .NET Core Backend

Create `.env.local` with:

```
REACT_APP_USE_DOTNET_APIS=true
REACT_APP_DOTNET_AUTH_API_URL=http://localhost:5001
REACT_APP_DOTNET_STAFF_API_URL=http://localhost:5002
```

## Available Services

### Authentication Service

- **Django**: Handles login, registration, profile updates, logout
- **.NET**: Handles login, registration (profile updates not yet implemented)

### Staff Service

- **Django**: Full CRUD operations, availability, leave management, statistics
- **.NET**: Get staff, get staff by ID, create staff, statistics (update/delete not yet implemented)

## Testing the Integration

1. Start your chosen backend (Django or .NET microservices)
2. Set the appropriate environment variables in `.env.local`
3. Start the frontend: `npm start`
4. Navigate to `/test` to see the backend integration test page
5. The test page will show which backend is being used and test basic API calls

## Backend Status Indicator

The AuthContext now includes a `backendType` property that indicates which backend is currently being used:

- "Django" for Django backend
- ".NET Core" for .NET microservices

## File Structure

- `src/services/api.ts` - Centralized API configuration with backend switching
- `src/services/dotnetApiService.ts` - .NET API service adapters and type converters
- `src/contexts/AuthContext.tsx` - Updated to support dual backends
- `src/services/staffService.ts` - Updated to support dual backends
- `src/pages/BackendTestPage.tsx` - Test page for verifying integration

## Type Conversion

The system automatically converts between Django and .NET data formats:

- Django uses snake_case (e.g., `first_name`, `user_id`)
- .NET uses PascalCase (e.g., `FirstName`, `UserId`)
- Frontend uses Django format consistently for UI components

## Error Handling

Each service gracefully handles cases where certain endpoints are not implemented in the .NET backend yet, providing appropriate error messages to users.
