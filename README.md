# Bring-Back

A community-driven delivery app that connects users going to stores with neighbors who need items delivered.

## Project Structure

- `/mobile` - React Native mobile application
- `/backend` - Backend services and API (Supabase integration)
- `/shared` - Shared types and utilities
- `/.kiro` - Kiro IDE specifications and configuration

## Features

- Location-based check-ins and trip announcements
- Community delivery requests and matching
- Real-time messaging and status tracking
- Integrated payment processing
- User ratings and reviews

## Getting Started

### Prerequisites

- Node.js 18+
- React Native development environment
- Supabase account

### Installation

```bash
# Install dependencies for mobile app
cd mobile
npm install

# Install backend dependencies
cd ../backend
npm install
```

## Development

This project follows the spec-driven development approach with detailed requirements, design, and implementation tasks defined in `.kiro/specs/community-delivery/`.

## Tech Stack

- **Frontend**: React Native, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: Redux Toolkit / Zustand
- **Navigation**: React Navigation
- **Maps**: React Native Maps
- **Payments**: Stripe