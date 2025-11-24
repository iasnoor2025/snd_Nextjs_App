# System Patterns: Flutter App Architecture

## Architecture Overview
**Pattern:** Clean Architecture with MVVM
**State Management:** Provider/Riverpod
**Navigation:** GoRouter for declarative routing
**API:** Dio with interceptors for HTTP communication

## Core Architecture Layers

### 1. Presentation Layer
```
lib/presentation/
├── pages/           # Screen widgets
├── widgets/          # Reusable UI components
├── providers/        # State management providers
└── themes/          # App theming and styling
```

### 2. Domain Layer
```
lib/domain/
├── entities/         # Business entities
├── repositories/     # Repository interfaces
└── usecases/        # Business logic use cases
```

### 3. Data Layer
```
lib/data/
├── models/          # Data models with JSON serialization
├── repositories/    # Repository implementations
├── datasources/     # API and local data sources
└── services/        # External services (API, storage)
```

### 4. Core Layer
```
lib/core/
├── constants/       # App constants
├── errors/          # Error handling
├── network/         # Network configuration
└── utils/           # Utility functions
```

## Key Design Patterns

### 1. Repository Pattern
- Abstracts data sources (API, local database)
- Provides consistent interface for data access
- Handles offline/online data synchronization

### 2. Provider Pattern
- Manages application state
- Handles business logic
- Provides reactive UI updates

### 3. Service Locator Pattern
- Dependency injection for services
- Centralized service management
- Easy testing and mocking

### 4. Observer Pattern
- Reactive programming with streams
- Real-time data updates
- Event-driven architecture

## Data Flow Architecture
1. **UI Events** → Provider → Use Case
2. **Use Case** → Repository → Data Source
3. **Data Source** → API/Local DB → Repository
4. **Repository** → Use Case → Provider
5. **Provider** → UI → State Update

## Component Relationships
- **Pages** depend on **Providers** for state
- **Providers** use **Use Cases** for business logic
- **Use Cases** depend on **Repositories** for data
- **Repositories** use **Data Sources** for actual data access
- **Services** provide external integrations (API, storage)

## Security Patterns
- **Token-based Authentication** with secure storage
- **Request/Response Interceptors** for automatic token handling
- **Biometric Authentication** for sensitive operations
- **Data Encryption** for local storage
- **Certificate Pinning** for API security
