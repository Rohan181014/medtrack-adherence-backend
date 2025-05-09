
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, MailIcon } from "lucide-react";

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      let result;
      if (isSignUp) {
        result = await signUp(email, password);
        if (!result.error) {
          toast({
            title: "Account created",
            description: "Please check your email to verify your account before logging in.",
          });
          setIsSignUp(false);
          setShowEmailConfirmation(true);
        } else {
          toast({
            title: "Error",
            description: result.error.message,
            variant: "destructive"
          });
        }
      } else {
        result = await signIn(email, password);
        if (!result.error) {
          toast({
            title: "Welcome back",
            description: "You have successfully logged in.",
          });
          navigate('/dashboard');
        } else {
          // Check if the error is related to email confirmation
          if (result.error.message.includes("Email not confirmed")) {
            setShowEmailConfirmation(true);
            toast({
              title: "Email not confirmed",
              description: "Please check your inbox and confirm your email before logging in.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Error",
              description: result.error.message,
              variant: "destructive"
            });
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout requireAuth={false}>
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-blue-600">MedTrack</h1>
            <h2 className="mt-2 text-xl font-semibold text-gray-700">
              {isSignUp ? 'Create an account' : 'Sign in to your account'}
            </h2>
          </div>

          {showEmailConfirmation && (
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <InfoIcon className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-600">Email confirmation required</AlertTitle>
              <AlertDescription className="text-blue-700">
                Please check your inbox for a confirmation email and click the link to verify your account.
                <div className="mt-2 flex items-center">
                  <MailIcon className="h-4 w-4 mr-2 text-blue-600" />
                  <span className="font-medium">{email}</span>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full flex justify-center py-2"
                disabled={loading}
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : isSignUp ? (
                  'Sign Up'
                ) : (
                  'Sign In'
                )}
              </Button>
            </div>
          </form>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
