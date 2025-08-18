'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-primary mb-4">SND Rental Management System</h1>
          <p className="text-muted-foreground text-lg">
            Welcome to the comprehensive rental management system
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/login"
            className="inline-flex items-center px-8 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-lg font-medium"
          >
            Sign In
          </Link>

          <br />

          <Link
            href="/dashboard"
            className="inline-flex items-center px-8 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors text-lg font-medium"
          >
            Go to Dashboard
          </Link>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>Default Admin Credentials:</p>
          <p>Email: admin@ias.com</p>
          <p>Password: password</p>
        </div>
      </div>
    </div>
  );
}
