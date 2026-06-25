import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/audit-logs")({ component: AuditLogs });

function AuditLogs() {
  const { data: logs = [] } = useQuery({
    queryKey: ["audit"], queryFn: async () => (await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200)).data ?? [],
  });
  return (
    <div className="bg-card border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-surface text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <tr>{["Timestamp", "Actor", "Action", "Entity", "Previous", "New", "Notes"].map((h) => <th key={h} className="text-left py-4 px-4 font-normal">{h}</th>)}</tr>
        </thead>
        <tbody>
          {logs.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">No audit entries yet</td></tr>}
          {logs.map((l: any) => (
            <tr key={l.id} className="border-t border-border">
              <td className="py-3 px-4 text-muted-foreground text-xs">{new Date(l.created_at).toLocaleString()}</td>
              <td className="py-3 px-4">{l.actor_email ?? "system"}</td>
              <td className="py-3 px-4 text-gold">{l.action}</td>
              <td className="py-3 px-4">{l.entity_type}</td>
              <td className="py-3 px-4 text-xs text-muted-foreground font-mono">{JSON.stringify(l.previous_value)?.slice(0, 60)}</td>
              <td className="py-3 px-4 text-xs text-muted-foreground font-mono">{JSON.stringify(l.new_value)?.slice(0, 60)}</td>
              <td className="py-3 px-4 text-xs text-muted-foreground">{l.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
