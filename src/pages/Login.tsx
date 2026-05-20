import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const { session, loading, signIn, createAccount } = useAuth();
  const [mode, setMode] = useState<"sign-in" | "create-account">("sign-in");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (session) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    if (mode === "create-account" && password !== confirmPassword) {
      setError("Passwords do not match.");
      setSubmitting(false);
      return;
    }

    try {
      if (mode === "sign-in") {
        await signIn(username, password);
      } else {
        await createAccount(username, password);
        setMessage("Account created locally in this browser.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }

    setSubmitting(false);
  };

  const switchMode = () => {
    setMode((current) => (current === "sign-in" ? "create-account" : "sign-in"));
    setError(null);
    setMessage(null);
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Cycle Thrive</CardTitle>
          <CardDescription className="text-center">
            {mode === "sign-in" ? "Sign in to continue" : "Create an account to start tracking"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="username">{mode === "sign-in" ? "Username or email" : "Username"}</Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {mode === "create-account" && (
              <div className="space-y-1">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {message && <p className="text-sm text-eco">{message}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting
                ? mode === "sign-in"
                  ? "Signing in..."
                  : "Creating account..."
                : mode === "sign-in"
                ? "Sign in"
                : "Create account"}
            </Button>
          </form>
          <div className="mt-5 border-t border-border pt-4 text-center">
            <p className="text-sm text-muted-foreground">
              {mode === "sign-in" ? "Need an account?" : "Already have an account?"}
            </p>
            <Button type="button" variant="link" className="h-auto p-0" onClick={switchMode}>
              {mode === "sign-in" ? "Create account" : "Sign in instead"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
