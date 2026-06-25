import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const redirectUrl = `${window.location.origin}/admin`;
        const { data, error } = await supabase.auth.signUp({
          email, password, options: { emailRedirectTo: redirectUrl },
        });
        if (error) throw error;
        // First user becomes admin automatically (bootstrap)
        if (data.user) {
          const { count } = await supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin");
          if ((count ?? 0) === 0) {
            await supabase.from("user_roles").insert({ user_id: data.user.id, role: "admin" });
          }
        }
        toast.success("Account created. You can now sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        nav({ to: "/admin" });
      }
    } catch (e: any) {
      toast.error(e.message ?? "Authentication failed");
    } finally { setLoading(false); }
  }

  async function forgot() {
    if (!email) { toast.error("Enter your email first"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/admin/login` });
    if (error) toast.error(error.message); else toast.success("Reset email sent");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Crown className="h-10 w-10 text-gold mx-auto mb-4" />
          <h1 className="font-display text-4xl">Admin Portal</h1>
          <p className="text-sm text-muted-foreground mt-2">Emirates Inn & Grand Inn — Management</p>
        </div>
        <form onSubmit={submit} className="glass p-8 space-y-5">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background border border-border px-4 py-3 focus:border-gold focus:outline-none" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block">Password</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background border border-border px-4 py-3 pr-12 focus:border-gold focus:outline-none" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-[var(--color-gold)]" /> Remember me
            </label>
            <button type="button" onClick={forgot} className="text-gold hover:underline">Forgot password?</button>
          </div>
          <button type="submit" disabled={loading} className="w-full gradient-gold text-primary-foreground py-3 text-xs uppercase tracking-[0.3em] disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Sign In" : "Create Account"}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            {mode === "signin" ? "First time setup? " : "Already have an account? "}
            <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-gold hover:underline">
              {mode === "signin" ? "Create admin account" : "Sign in"}
            </button>
          </p>
          {mode === "signup" && (
            <p className="text-[10px] text-muted-foreground text-center">The first account created becomes the admin automatically.</p>
          )}
        </form>
      </div>
    </div>
  );
}
