import { AuthContext } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useContext } from "react";
import type { ReactElement } from "react";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => ReactElement;
}) {
  // Use the auth context directly with safe fallbacks
  const authContext = useContext(AuthContext);
  
  // Show loading if context isn't ready or explicitly loading
  if (!authContext || authContext.isLoading) {
    return (
      <Route path={path}>
        {() => (
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-border" />
          </div>
        )}
      </Route>
    );
  }

  // Redirect to auth if no user
  if (!authContext.user) {
    return (
      <Route path={path}>
        {() => <Redirect to="/auth" />}
      </Route>
    );
  }

  // If everything is ok, render the component
  return <Route path={path} component={Component} />;
}
