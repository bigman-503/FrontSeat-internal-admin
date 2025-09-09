import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Eye, EyeOff, CheckCircle, ArrowRight, AlertCircle, XCircle, Mail, Lock, User, Building2, Sparkles } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [signInSuccess, setSignInSuccess] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { signIn, signUp, user, advertiser } = useAuth();

  // Enhanced error message parsing
  const getErrorMessage = (error: string) => {
    const errorMap: { [key: string]: { message: string; hint: string; icon: React.ReactNode } } = {
      'auth/email-already-in-use': {
        message: 'This email is already registered',
        hint: 'Try signing in instead, or use a different email address',
        icon: <Mail className="h-4 w-4" />
      },
      'auth/weak-password': {
        message: 'Password is too weak',
        hint: 'Use at least 6 characters with a mix of letters and numbers',
        icon: <Lock className="h-4 w-4" />
      },
      'auth/invalid-email': {
        message: 'Invalid email address',
        hint: 'Please enter a valid email address',
        icon: <Mail className="h-4 w-4" />
      },
      'auth/user-not-found': {
        message: 'No account found with this email',
        hint: 'Check your email or create a new account',
        icon: <User className="h-4 w-4" />
      },
      'auth/wrong-password': {
        message: 'Incorrect password',
        hint: 'Check your password or reset it if forgotten',
        icon: <Lock className="h-4 w-4" />
      },
      'auth/too-many-requests': {
        message: 'Too many attempts',
        hint: 'Please wait a moment before trying again',
        icon: <AlertCircle className="h-4 w-4" />
      },
      'auth/network-request-failed': {
        message: 'Network error',
        hint: 'Check your internet connection and try again',
        icon: <AlertCircle className="h-4 w-4" />
      }
    };

    // Extract error code from Firebase error message
    const errorCode = error.match(/\(([^)]+)\)/)?.[1] || error;
    return errorMap[errorCode] || {
      message: error,
      hint: 'Please try again or contact support if the problem persists',
      icon: <XCircle className="h-4 w-4" />
    };
  };


  // Navigate to dashboard when user is authenticated
  useEffect(() => {
    if (user && advertiser) {
      setIsRedirecting(true);
      // Add a delay to show the success animation
      setTimeout(() => {
        navigate('/');
      }, 1500);
    }
  }, [user, advertiser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSignUpSuccess(false);

    try {
      if (isSignIn) {
        await signIn(email, password);
        setSignInSuccess(true);
        // Navigation will be handled by the useEffect above
      } else {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        await signUp(email, password, displayName);
        
        // Show success message for sign-up
        setSignUpSuccess(true);
        setSuccessMessage(`Welcome to FrontSeat Ad Hub, ${displayName}! Your account has been created successfully.`);
        
        // Clear form
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setDisplayName('');
        
        // Switch to sign-in tab after a delay
        setTimeout(() => {
          setIsSignIn(true);
          setSignUpSuccess(false);
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setError('');
  };

  const switchMode = () => {
    setIsSignIn(!isSignIn);
    resetForm();
    setSignUpSuccess(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4 relative">
      {/* Loading Overlay */}
      {isRedirecting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center border border-white/20 shadow-2xl">
            <div className="mb-4 relative">
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto animate-pulse" />
              <Sparkles className="h-6 w-6 text-yellow-400 absolute -top-1 -right-1 animate-ping" />
              <Sparkles className="h-4 w-4 text-blue-400 absolute -bottom-1 -left-1 animate-ping delay-300" />
            </div>
            <h3 className="text-white text-xl font-semibold mb-2">Welcome to FrontSeat!</h3>
            <p className="text-blue-200 mb-4">Setting up your dashboard...</p>
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                <span className="text-blue-300 text-sm">Loading your workspace</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-400 to-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className={`w-full max-w-md transition-all duration-500 ${isRedirecting ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary via-blue-500 to-primary rounded-xl flex items-center justify-center shadow-2xl">
              <span className="text-white font-bold text-xl">FS</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">FrontSeat</h1>
              <p className="text-blue-200 text-sm">Advertiser Portal</p>
            </div>
          </div>
        </div>

        <Card className={`backdrop-blur-sm bg-white/10 border-white/20 shadow-2xl transition-all duration-500 ${signInSuccess ? 'border-green-400/30 bg-green-500/5' : ''}`}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">
              {isSignIn ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-blue-200">
              {isSignIn 
                ? 'Sign in to your advertiser account' 
                : 'Join FrontSeat and start advertising to riders'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={isSignIn ? 'signin' : 'signup'} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/10">
                <TabsTrigger 
                  value="signin" 
                  onClick={() => setIsSignIn(true)}
                  className="data-[state=active]:bg-white/20 data-[state=active]:text-white"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  onClick={() => setIsSignIn(false)}
                  className="data-[state=active]:bg-white/20 data-[state=active]:text-white"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value={isSignIn ? 'signin' : 'signup'} className="mt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isSignIn && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="displayName" className="text-white flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Full Name
                        </Label>
                        <div className="relative">
                          <Input
                            id="displayName"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="John Doe"
                            required={!isSignIn}
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 pl-10 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                          />
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@company.com"
                        required
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 pl-10 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 pl-10 pr-10 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                      />
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-white/5 transition-colors duration-200"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-300 hover:text-white" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-300 hover:text-white" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {!isSignIn && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-white flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          required={!isSignIn}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 pl-10 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                        />
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  )}


                  {error && (
                    <Alert className="bg-red-900/40 border-red-500/60 backdrop-blur-sm animate-in slide-in-from-top-2 duration-300 shadow-lg">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="text-red-400">
                            {getErrorMessage(error).icon}
                          </div>
                        </div>
                        <div className="flex-1 space-y-2">
                          <AlertDescription className="text-white font-semibold text-base">
                            {getErrorMessage(error).message}
                          </AlertDescription>
                          <p className="text-red-100 text-sm leading-relaxed">
                            {getErrorMessage(error).hint}
                          </p>
                          {error.includes('email-already-in-use') && !isSignIn && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsSignIn(true);
                                setError('');
                              }}
                              className="bg-red-600/30 border-red-400 text-white hover:bg-red-600/50 hover:border-red-300 transition-all duration-200 font-medium"
                            >
                              Switch to Sign In
                            </Button>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setError('')}
                          className="flex-shrink-0 p-1 h-6 w-6 text-red-300 hover:text-white hover:bg-red-500/30 rounded-full transition-all duration-200"
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </Alert>
                  )}

                  {signUpSuccess && (
                    <Alert className="bg-green-900/40 border-green-500/60 backdrop-blur-sm animate-in slide-in-from-top-2 duration-300 shadow-lg">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <AlertDescription className="text-white font-semibold text-base">
                            {successMessage}
                          </AlertDescription>
                          <div className="flex items-center gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsSignIn(true);
                                setSignUpSuccess(false);
                              }}
                              className="bg-green-600/30 border-green-400 text-white hover:bg-green-600/50 hover:border-green-300 transition-all duration-200 font-medium"
                            >
                              Continue to Sign In
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                            <span className="text-green-100 text-sm">Auto-redirecting in 3s...</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSignUpSuccess(false)}
                          className="flex-shrink-0 p-1 h-6 w-6 text-green-300 hover:text-white hover:bg-green-500/30 rounded-full transition-all duration-200"
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </Alert>
                  )}

                  {signInSuccess && (
                    <Alert className="bg-blue-900/40 border-blue-500/60 backdrop-blur-sm animate-in slide-in-from-top-2 duration-300 shadow-lg">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <CheckCircle className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <AlertDescription className="text-white font-semibold text-base">
                            Welcome back! Sign in successful.
                          </AlertDescription>
                          <p className="text-blue-100 text-sm leading-relaxed">
                            Redirecting to your dashboard...
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                        </div>
                      </div>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-medium py-2.5 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading || signUpSuccess || signInSuccess}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isSignIn ? 'Signing In...' : 'Creating Account...'}
                      </>
                    ) : signUpSuccess ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Account Created!
                      </>
                    ) : signInSuccess ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {isRedirecting ? 'Redirecting...' : 'Sign In Successful!'}
                      </>
                    ) : (
                      isSignIn ? 'Sign In' : 'Create Account'
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-blue-200 text-sm">
                    {isSignIn ? "Don't have an account?" : "Already have an account?"}
                    <Button
                      variant="link"
                      onClick={switchMode}
                      className="text-white hover:text-blue-300 p-0 ml-1 h-auto transition-colors duration-200"
                      disabled={loading || signUpSuccess}
                    >
                      {isSignIn ? 'Sign up' : 'Sign in'}
                    </Button>
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-blue-200/70 text-sm">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

