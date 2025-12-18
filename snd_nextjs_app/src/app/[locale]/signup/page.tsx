'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { useI18n } from '@/hooks/use-i18n';
import { useLoginRedirect } from '@/hooks/use-login-redirect';
import Image from 'next/image';

export default function SignUpPage() {
  const { t } = useI18n();
  const { redirectToLogin } = useLoginRedirect();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [companyName, setCompanyName] = useState(t('auth.app_name'));
  const [companyLogo, setCompanyLogo] = useState('/snd-logo.png');
  const router = useRouter();

  // Load public settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings?public=true');
        const data = await response.json();
        if (data.settings) {
          if (data.settings['company.name']) {
            setCompanyName(data.settings['company.name']);
          }
          if (data.settings['company.logo']) {
            setCompanyLogo(data.settings['company.logo']);
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        // Use defaults if fetch fails
      }
    };
    loadSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signIn('google', {
        callbackUrl: '/',
        redirect: false,
      });

      if (result?.error) {
        toast.error(t('auth.messages.googleSignUpFailed'));
      } else {
        toast.success(t('auth.messages.googleSignUpSuccessful'));
        router.push('/');
      }
    } catch (error) {
      toast.error(t('auth.messages.googleSignUpError'));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      toast.error(t('auth.messages.passwordsDoNotMatch'));
      return;
    }

    if (formData.password.length < 6) {
      toast.error(t('auth.messages.passwordTooShort'));
      return;
    }

    setIsLoading(true);

    try {
      // Make API call to create the user
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('auth.messages.failedToCreateAccount'));
      }
      
      toast.success(t('auth.messages.accountCreatedSuccessfully'));
      
      // Redirect to login page
      redirectToLogin(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('auth.messages.failedToCreateAccountRetry');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        {/* Header */}
        <a href="/" className="flex items-center gap-3 self-center font-medium">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background">
            <Image
              src={companyLogo}
              alt={companyName}
              width={36}
              height={36}
              className="h-8 w-8 object-contain"
              priority
            />
          </div>
          <span className="text-lg font-semibold tracking-tight">{companyName}</span>
        </a>

        {/* Sign Up Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('auth.signup.title')}</CardTitle>
            <CardDescription>
              {t('auth.signup.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Google Sign Up Button */}
            <div className="mb-6">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignUp}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    {t('auth.signup.loading')}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    {t('auth.signin.signInWithGoogle')}
                  </div>
                )}
              </Button>
            </div>

            {/* Separator */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">{t('auth.signin.orContinueWith')}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t('auth.signup.firstName')}</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    placeholder={t('auth.signup.firstNamePlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t('auth.signup.lastName')}</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    placeholder={t('auth.signup.lastNamePlaceholder')}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.signup.email')}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder={t('auth.signup.emailPlaceholder')}
                />
              </div>



              {/* Password Fields */}
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.signup.password')}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder={t('auth.signup.passwordPlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('auth.signup.confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  placeholder={t('auth.signup.confirmPasswordPlaceholder')}
                />
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('auth.signup.loading') : t('auth.signup.submit')}
              </Button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {t('auth.signup.alreadyHaveAccount')}{' '}
                <button
                  onClick={() => redirectToLogin(false)}
                  className="text-primary hover:underline font-medium"
                >
                  {t('auth.signup.signIn')}
                </button>
              </p>
              <p className="text-sm text-muted-foreground">
                {t('auth.signup.forgotPassword')}{' '}
                <button
                  onClick={() => router.push('/forgot-password')}
                  className="text-primary hover:underline font-medium"
                >
                  {t('auth.signup.resetItHere')}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
