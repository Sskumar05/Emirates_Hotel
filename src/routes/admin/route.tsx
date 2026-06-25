import { createFileRoute, Outlet, useRouterState, redirect } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export const Route = createFileRoute("/admin")({
  component: AdminShell,
});

function AdminShell() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { session, isAdmin, loading } = useAuth();

  // Login page is public — render Outlet without layout
  if (path === "/admin/login") return <Outlet />;

  useEffect(() => {
    if (!loading && !session) {
      window.location.href = "/admin/login";
    }
  }, [loading, session]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Loading…</div>;
  if (!session) return null;
  if (!isAdmin) return (
    <div className="min-h-screen flex items-center justify-center bg-background text-center p-6">
      <div>
        <h1 className="font-display text-3xl text-gold mb-3">Access Restricted</h1>
        <p className="text-muted-foreground mb-6">Your account does not have admin privileges.</p>
        <a href="/admin/login" className="border border-gold text-gold px-6 py-2 text-xs uppercase tracking-[0.2em]">Sign in as admin</a>
      </div>
    </div>
  );

  return <AdminLayout />;
}
