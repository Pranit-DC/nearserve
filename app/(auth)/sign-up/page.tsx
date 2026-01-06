"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiPhone } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await signUp(formData.email, formData.password, formData.name);
      toast.success("Account created successfully!");
      router.push("/onboarding");
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success("Signed up with Google successfully!");
      router.push("/onboarding");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Card className="w-full shadow-xl border-none bg-white/90 dark:bg-black/90 rounded-2xl">
        <CardHeader className="space-y-2 pb-0">
          <CardTitle className="text-3xl font-bold text-center tracking-tight">Create Account</CardTitle>
          <CardDescription className="text-center text-base text-gray-500 dark:text-gray-400">
            Join NearServe today
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-0">
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
            onClick={handleGoogleSignUp}
            disabled={loading}
            aria-label="Sign up with Google"
          >
            <FcGoogle className="h-5 w-5" />
            <span className="font-medium">Continue with Google</span>
          </Button>

          <div className="flex items-center gap-2 my-2">
            <span className="flex-grow h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">or</span>
            <span className="flex-grow h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</Label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="pl-10 py-2 rounded-lg focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-800"
                  autoComplete="name"
                  aria-label="Full Name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</Label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="pl-10 py-2 rounded-lg focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-800"
                  autoComplete="email"
                  aria-label="Email address"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</Label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+91 1234567890"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="pl-10 py-2 rounded-lg focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-800"
                  autoComplete="tel"
                  aria-label="Phone number"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Password</Label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="pl-10 pr-10 py-2 rounded-lg focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-800"
                  autoComplete="new-password"
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  tabIndex={0}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</Label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="pl-10 pr-10 py-2 rounded-lg focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-800"
                  autoComplete="new-password"
                  aria-label="Confirm password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  tabIndex={0}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full py-2 rounded-lg font-semibold text-base bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition" disabled={loading} aria-label="Create account">
              {loading ? (
                <div className="flex items-center gap-2 justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating account...
                </div>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="text-center text-sm pt-2">
            <span className="text-gray-600 dark:text-gray-400">Already have an account? </span>
            <Link
              href="/sign-in"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold transition"
            >
              Sign in
            </Link>
          </div>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400 pt-2">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-gray-700 dark:hover:text-gray-300">Terms of Service</Link>{' '}and{' '}
            <Link href="/privacy" className="underline hover:text-gray-700 dark:hover:text-gray-300">Privacy Policy</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
