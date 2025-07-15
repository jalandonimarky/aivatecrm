import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({
          title: "Logged in successfully",
          description: "Welcome back!",
        });
      } else {
        // Removed: Client-side email domain validation
        // if (!email.endsWith('@aivate.net')) {
        //   toast({
        //     title: "Registration Error",
        //     description: "Registration is restricted to @aivate.net email addresses.",
        //     variant: "destructive",
        //   });
        //   setLoading(false);
        //   return;
        // }

        // Call the Edge Function for signup
        const { data, error: invokeError } = await supabase.functions.invoke('signup-validation', {
          body: { email, password, first_name: firstName, last_name: lastName },
        });

        if (invokeError) {
          // Attempt to get the specific error message from the Edge Function's response
          const errorMessage = (invokeError as any).data?.error || invokeError.message;
          throw new Error(errorMessage);
        }

        if (data.error) {
          throw new Error(data.error);
        }

        toast({
          title: "Signed up successfully",
          description: data.message || "Please check your email to confirm your account.",
        });
        setIsLogin(true); // Switch to login view after successful signup
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-gradient-card border-border/50 shadow-medium">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {isLogin ? "AIVate CRM" : "Join AIVate CRM"}
          </CardTitle>
          <p className="text-muted-foreground">
            {isLogin ? "Sign in to your account" : "Create your account"}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground shadow-glow" disabled={loading}>
              {loading ? (isLogin ? "Signing In..." : "Signing Up...") : (isLogin ? "Sign In" : "Sign Up")}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {isLogin ? (
              <>
                Don't have an account?{" "}
                <Button variant="link" onClick={() => setIsLogin(false)} className="p-0 h-auto text-primary">
                  Sign Up
                </Button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Button variant="link" onClick={() => setIsLogin(true)} className="p-0 h-auto text-primary">
                  Sign In
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}