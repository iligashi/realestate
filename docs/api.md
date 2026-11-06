# Real Estate Backend API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication Endpoints

### User Registration
- **POST** `/auth/register`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePass123",
    "firstName": "John",
    "lastName": "Doe",
    "userType": "buyer",
    "phone": "+1234567890"
  }
  ```
- **Response:** User data + JWT token

### User Login
- **POST** `/auth/login`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePass123"
  }
  ```
- **Response:** User data + JWT token

### Get Profile
- **GET** `/auth/profile`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** Current user profile

### Update Profile
- **PUT** `/auth/profile`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** Fields to update
- **Response:** Updated user profile

### Change Password
- **PUT** `/auth/change-password`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "currentPassword": "OldPass123",
    "newPassword": "NewPass123"
  }
  ```

### Logout
- **POST** `/auth/logout`
- **Headers:** `Authorization: Bearer <token>`

## Property Endpoints

### Get All Properties
- **GET** `/properties`
- **Query Parameters:**
  - `page` (default: 1)
  - `limit` (default: 10)
  - `propertyType` (house, apartment, condo, etc.)
  - `listingType` (sale, rent, auction, pre-construction)
  - `minPrice`, `maxPrice`
  - `city`, `state`, `country`
  - `bedrooms`, `bathrooms`

### Get Single Property
- **GET** `/properties/:id`

### Create Property
- **POST** `/properties`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** Property data

### Update Property
- **PUT** `/properties/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** Property data to update

### Delete Property
- **DELETE** `/properties/:id`
- **Headers:** `Authorization: Bearer <token>`

### Get User's Properties
- **GET** `/properties/user/my-properties`
- **Headers:** `Authorization: Bearer <token>`

## User Management Endpoints

### Get All Users (Admin Only)
- **GET** `/users`
- **Headers:** `Authorization: Bearer <token>`
- **Required Role:** admin

### Get User by ID
- **GET** `/users/:id`
- **Headers:** `Authorization: Bearer <token>`

### Update User
- **PUT** `/users/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Note:** Users can only update themselves, admins can update anyone

### Delete User (Admin Only)
- **DELETE** `/users/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Required Role:** admin

### Toggle User Block (Admin Only)
- **PATCH** `/users/:id/toggle-block`
- **Headers:** `Authorization: Bearer <token>`
- **Required Role:** admin

### Get User Statistics (Admin Only)
- **GET** `/users/stats`
- **Headers:** `Authorization: Bearer <token>`
- **Required Role:** admin

## Health Check
- **GET** `/health`
- **Response:** Server status

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Error Responses
All errors follow this format:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Validation Errors
Validation errors include detailed field information:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```
