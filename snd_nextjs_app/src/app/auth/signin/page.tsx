'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export default function SignInPage() {
  const { t } = useTranslation(['auth', 'common']);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: 'test@example.com', // Placeholder email, replace with actual email input
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(t('signin.error'));
      } else {
        toast.success(t('signin.success'));
        router.push('/');
      }
    } catch (error) {
      toast.error(t('messages.error', { ns: 'common' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('signin.title')}</CardTitle>
          <CardDescription>{t('signin.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('signin.email')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Enter your email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('signin.password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="password123"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('signin.loading') : t('signin.submit')}
            </Button>
          </form>

          <div className="mt-4 text-sm text-gray-600">
            <div className="text-center text-sm text-muted-foreground">
              <p>Enter your credentials to sign in</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
