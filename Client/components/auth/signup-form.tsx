'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { MailOpen, ArrowLeft, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HttpClientError } from '@/lib/api/errors';
import { ROUTES } from '@/lib/constants/routes';
import { useAuthStore } from '@/lib/stores/auth-store';
import { type SignupFormValues, signupSchema } from '@/lib/validators/auth';

function getErrorMessage(error: unknown): string {
  if (error instanceof HttpClientError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

export function SignupForm() {
  const router = useRouter();
  const signup = useAuthStore((state) => state.signup);
  const verifySignupOtp = useAuthStore((state) => state.verifySignupOtp);
  const resendSignupOtp = useAuthStore((state) => state.resendSignupOtp);
  const storeLoading = useAuthStore((state) => state.isLoading);

  const [step, setStep] = useState<'signup' | 'otp'>('signup');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Count down resend timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Focus the first OTP input when switching to OTP step
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSignupSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      const response = await signup({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      });

      if (response.status === 'PENDING_VERIFICATION') {
        setSignupEmail(response.email);
        setStep('otp');
        setOtpDigits(['', '', '', '', '', '']);
        setOtpError(null);
        setResendCooldown(60); // 60 seconds cooldown (1 minute)
        toast.success('Verification code sent to your email.');
      } else if (response.status === 'EMAIL_ALREADY_EXISTS') {
        const message = response.message || 'An account with this email already exists';
        setSubmitError(message);
        toast.error(message);
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      setSubmitError(message);
      toast.error(message);
    }
  });

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    const code = otpDigits.join('');

    if (code.length !== 6) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }

    try {
      await verifySignupOtp(signupEmail, code);
      toast.success('Email verified and account created successfully!');
      router.replace(ROUTES.dashboard.root);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      setOtpError(message);
      toast.error(message);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setOtpError(null);

    try {
      await resendSignupOtp(signupEmail);
      setResendCooldown(60); // 60 seconds cooldown for subsequent attempts
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      toast.success('A new verification code has been sent to your email.');
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      setOtpError(message);
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric inputs
    const numericValue = value.replace(/[^0-9]/g, '');
    if (!numericValue && value !== '') return;

    const newDigits = [...otpDigits];
    newDigits[index] = numericValue.substring(numericValue.length - 1);
    setOtpDigits(newDigits);

    // If typing forward, focus the next input
    if (numericValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...otpDigits];
        newDigits[index] = '';
        setOtpDigits(newDigits);
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').trim();
    const cleanDigits = pastedText.replace(/[^0-9]/g, '').substring(0, 6);

    if (cleanDigits.length > 0) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = cleanDigits[i] ?? '';
      }
      setOtpDigits(newDigits);

      // Focus the last filled input or the first empty one
      const focusIndex = Math.min(cleanDigits.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const isSubmitting = form.formState.isSubmitting || storeLoading;

  if (step === 'otp') {
    return (
      <Card className="border border-border shadow-2xl relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
        <CardHeader className="text-center pt-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailOpen className="h-6 w-6 animate-pulse" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Verify your email</CardTitle>
          <CardDescription className="px-4 text-sm mt-2">
            We sent a 6-digit verification code to <span className="font-semibold text-foreground">{signupEmail}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pb-8 px-8">
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="flex justify-center gap-2 md:gap-3 max-w-sm mx-auto my-4">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handleOtpPaste}
                  className="w-12 h-12 md:w-14 md:h-14 text-center text-xl font-bold rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            {otpError && (
              <p className="text-sm text-destructive text-center font-medium animate-shake">
                {otpError}
              </p>
            )}

            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Verifying...
                </span>
              ) : (
                'Verify & Create Account'
              )}
            </Button>
          </form>

          <div className="flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground border-t border-border/50 pt-5">
            <div className="flex items-center gap-1.5">
              <span>Didn't receive the code?</span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || isResending}
                className="font-medium text-primary hover:underline focus:outline-none disabled:opacity-50 disabled:no-underline flex items-center gap-1"
              >
                {isResending && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStep('signup')}
              className="flex items-center gap-1.5 font-medium hover:text-foreground text-xs mt-1 transition-colors focus:outline-none"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Change email address
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border shadow-xl">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Start managing campaigns across channels.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSignupSubmit}>
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" autoComplete="name" {...form.register('fullName')} />
            {form.formState.errors.fullName && (
              <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div style={{ position: 'relative', width: '100%' }}>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                style={{ paddingRight: '40px' }}
                {...form.register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                }}
                className="text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <div style={{ position: 'relative', width: '100%' }}>
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                style={{ paddingRight: '40px' }}
                {...form.register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                }}
                className="text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.formState.errors.confirmPassword && (
              <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Sending verification code...' : 'Create account'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href={ROUTES.auth.login} className="font-medium text-foreground underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
