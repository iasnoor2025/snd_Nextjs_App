# SND Rental Management Mobile App

A cross-platform Flutter application for the SND Rental Management System, providing mobile access to rental management, employee management, and project tracking features.

## Features

- **Cross-Platform**: Works on iOS, Android, Web, and Desktop
- **Google Authentication**: Secure login with Google Sign-In
- **Employee Management**: Complete HR system with skills, training, and performance reviews
- **Project Management**: Project lifecycle management and resource allocation
- **Equipment Management**: Inventory tracking and maintenance scheduling
- **Rental Management**: Rental agreements and equipment tracking
- **Timesheet Management**: Time tracking with approval workflows
- **Offline Support**: Works without internet connection
- **Real-time Notifications**: Push notifications for important events

## Technology Stack

- **Framework**: Flutter 3.x
- **State Management**: Provider/Riverpod
- **HTTP Client**: Dio with interceptors
- **Authentication**: Firebase Auth + Google Sign-In
- **Local Storage**: SQLite (Sqflite)
- **UI**: Material Design 3
- **Code Generation**: JSON Serializable, Retrofit

## Project Structure

```
lib/
├── app/                    # App configuration and initialization
├── core/                   # Core utilities and constants
│   ├── constants/          # App constants
│   ├── errors/             # Error handling
│   ├── network/            # API client configuration
│   └── utils/              # Utility functions
├── data/                   # Data layer
│   ├── datasources/        # API and local data sources
│   ├── models/             # Data models with JSON serialization
│   └── repositories/        # Repository implementations
├── domain/                 # Domain layer
│   ├── entities/           # Business entities
│   ├── repositories/       # Repository interfaces
│   └── usecases/           # Business logic use cases
├── presentation/           # Presentation layer
│   ├── pages/              # Screen widgets
│   ├── widgets/            # Reusable UI components
│   └── providers/          # State management providers
└── services/               # External services
```

## Getting Started

### Prerequisites

- Flutter SDK 3.4.4 or higher
- Dart SDK 3.4.4 or higher
- Android Studio / VS Code
- Firebase project setup
- Google Cloud Console project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd snd_rental_mobile_app
   ```

2. **Install dependencies**
   ```bash
   flutter pub get
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Configure Firebase**
   - Add `google-services.json` (Android) to `android/app/`
   - Add `GoogleService-Info.plist` (iOS) to `ios/Runner/`

5. **Run code generation**
   ```bash
   flutter packages pub run build_runner build
   ```

6. **Run the app**
   ```bash
   flutter run
   ```

### Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication
   - Configure Google Sign-In provider

2. **Configure OAuth Consent Screen**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Configure authorized redirect URIs

3. **Download Configuration Files**
   - Download `google-services.json` for Android
   - Download `GoogleService-Info.plist` for iOS
   - Place them in the appropriate directories

### API Integration

The app connects to the Next.js backend API. Make sure your backend is running and accessible at the configured API base URL.

**API Endpoints:**
- Authentication: `/api/auth/*`
- Employees: `/api/employees/*`
- Projects: `/api/projects/*`
- Equipment: `/api/equipment/*`
- Rentals: `/api/rentals/*`
- Timesheets: `/api/timesheets/*`

## Development

### Code Generation

Run code generation after making changes to models:
```bash
flutter packages pub run build_runner build --delete-conflicting-outputs
```

### Testing

Run tests:
```bash
flutter test
```

### Building

**Android APK:**
```bash
flutter build apk --release
```

**iOS:**
```bash
flutter build ios --release
```

**Web:**
```bash
flutter build web --release
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and code generation
5. Submit a pull request

## License

This project is proprietary software. All rights reserved.

## Support

For support and questions, please contact the development team.