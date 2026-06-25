import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/profile")({ component: Profile });

function Profile() {
  const { user } = useAuth();
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState("");

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw !== pw2) return toast.error("Passwords don't match");
    if (pw.length < 6) return toast.error("Min 6 characters");
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) toast.error(error.message); else { toast.success("Password updated"); setPw(""); setPw2(""); }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div className="bg-card border border-border p-8">
        <h3 className="font-display text-xl mb-6">Account Details</h3>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">Email</dt><dd>{user?.email}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">User ID</dt><dd className="font-mono text-xs">{user?.id}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Member Since</dt><dd>{user?.created_at && new Date(user.created_at).toLocaleDateString()}</dd></div>
        </dl>
      </div>
      <form onSubmit={changePassword} className="bg-card border border-border p-8 space-y-4">
        <h3 className="font-display text-xl mb-2">Change Password</h3>
        <input type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" className="w-full bg-background border border-border px-4 py-3 focus:border-gold focus:outline-none" />
        <input type="password" required minLength={6} value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Confirm new password" className="w-full bg-background border border-border px-4 py-3 focus:border-gold focus:outline-none" />
        <button className="gradient-gold text-primary-foreground px-6 py-2.5 text-xs uppercase tracking-[0.3em]">Update Password</button>
      </form>
    </div>
  );
}
