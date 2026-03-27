import { LoginForm } from '@/components/auth/login-form';

interface LoginPageProps {
  searchParams: Promise<{
    next?: string | string[];
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextValue = params.next;
  const nextUrl = typeof nextValue === 'string' ? nextValue : undefined;

  return <LoginForm nextUrl={nextUrl} />;
}
