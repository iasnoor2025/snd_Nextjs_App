import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-6xl font-bold text-gray-400">404</CardTitle>
          <CardDescription className="text-xl font-semibold text-gray-600">
            Page Not Found
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-500">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="space-x-4">
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
