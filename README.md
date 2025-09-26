A comprehensive, full-stack real estate platform built with modern web technologies, featuring real-time communication, multi-role user management, and advanced property management capabilities.

![Real Estate Platform](https://img.shields.io/badge/Real%20Estate-Platform-blue)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green)
![WebSocket](https://img.shields.io/badge/WebSocket-Real--time-orange)

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Real-time Features](#-real-time-features)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🔐 Authentication & Authorization
- **Multi-role user system** (Buyer, Seller, Renter, Agent, Admin)
- **JWT-based authentication** with secure token management
- **Role-based access control** with protected routes
- **User verification** and profile management
- **Password reset** and account recovery

### 🏘️ Property Management
- **Advanced property listings** with rich media support
- **Multiple listing types** (Sale, Rental, Auction, Pre-construction)
- **Geospatial search** with location-based filtering
- **Property comparison** and wishlist functionality
- **Virtual tours** and 360° property views
- **Price history tracking** and market analytics

### 💬 Real-time Communication
- **WebSocket-based messaging** between users
- **Typing indicators** and read receipts
- **Online status tracking** for all users
- **Real-time notifications** for property updates
- **Message threading** for organized conversations

###  Business Features
- **Appointment scheduling** with calendar integration
- **Open house management** with RSVP tracking
- **Rental application system** with document verification
- **Property viewing scheduler** for buyers
- **Inquiry management** for sellers

### 🎯 Advanced Search & Filtering
- **Multi-criteria search** (price, location, property type, amenities)
- **Geospatial queries** using MongoDB 2dsphere indexing
- **Saved searches** with email alerts
- **Property recommendations** based on user preferences
- **Advanced filtering** with multiple parameters

### 📊 Analytics & Reporting
- **Admin dashboard** with comprehensive analytics
- **Property performance metrics** for sellers
- **User engagement tracking**
- **Platform usage statistics**
- **Revenue and commission tracking**

## 🛠️ Technology Stack

### Frontend
- ** 18.2.0** - Modern UI library with hooks
- **Redux Toolkit** - State management
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.IO Client** - Real-time communication
- ** Hook Form** - Form management and validation
- **Heroicons** - Beautiful SVG icons
- **Framer Motion** - Animation library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - JSON Web Token authentication
- **Multer** - File upload handling
- **Bcrypt** - Password hashing
- **Helmet** - Security middleware

### Development Tools
- **Nodemon** - Development server
- **Jest** - Testing framework
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **PostCSS** - CSS processing
- ### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/real-estate-platform.git
cd real-estate-platform
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

**Start Backend Server:**
```bash
cd backend
npm run dev
```

**Start Frontend Development Server:**
```bash
cd frontend
npm start
```

### Database Configuration
The application uses MongoDB with the following collections:
- `users` - User accounts and profiles
- `properties` - Property listings
- `messages` - Real-time messages
- `appointments` - Scheduled appointments
- `rentalapplications` - Rental applications
- `openhouses` - Open house events

### WebSocket Configuration
Real-time features are powered by Socket.IO with:
- Authentication middleware
- Room-based messaging
- Typing indicators
- Online status tracking

### File Upload Configuration
- Property images stored in `/uploads/property-images/`
- Profile pictures stored in `/uploads/profiles/`
- Support for multiple image formats
- Image optimization and resizing
- User Roles
1. **Buyer** - Browse properties, schedule viewings, save favorites
2. **Seller** - List properties, manage inquiries, track analytics
3. **Renter** - Search rentals, submit applications, manage applications
4. **Agent** - Manage client properties, handle inquiries, track commissions
5. **Admin** - Platform management, user oversight, analytics

### Key Features Usage

#### Property Search
- Use the advanced search filters on the properties page
- Filter by price range, location, property type, and amenities
- Save searches for future reference
- Set up email alerts for new matching properties

#### Real-time Messaging
- Click on any property to start a conversation
- Use typing indicators to see when someone is typing
- Receive real-time notifications for new messages
- Track message read status

#### Property Management (Sellers)
- Use the property listing wizard to create detailed listings
- Upload multiple high-quality images
- Set up open houses and manage RSVPs
- Track property performance and inquiries

## �� API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Property Endpoints
- `GET /api/properties` - Get all properties with filtering
- `GET /api/properties/:id` - Get single property
- `POST /api/properties` - Create new property (authenticated)
- `PUT /api/properties/:id` - Update property (owner only)
- `DELETE /api/properties/:id` - Delete property (owner only)

### Message Endpoints
- `GET /api/messages` - Get user messages
- `POST /api/messages` - Send new message
- `PUT /api/messages/:id/read` - Mark message as read

### Admin Endpoints
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/analytics` - Get platform analytics (admin only)
- `PUT /api/admin/users/:id/status` - Update user status (admin only)

## 🔄 Real-time Features

### WebSocket Events
- `join_message_thread` - Join a message conversation
- `send_message` - Send a real-time message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `mark_message_read` - Mark message as read
- `user_status_change` - User online/offline status

### Real-time Notifications
- New message notifications
- Property inquiry alerts
- Appointment reminders
- System announcements
