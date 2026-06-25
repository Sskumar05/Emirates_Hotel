import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";

export const Route = createFileRoute("/admin/customers")({ component: Customers });

function Customers() {
  const [q, setQ] = useState("");
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"], queryFn: async () => (await supabase.from("customers").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: bookings = [] } = useQuery({
    queryKey: ["all-bookings-for-cust"], queryFn: async () => (await supabase.from("bookings").select("customer_id, check_out_date")).data ?? [],
  });

  const enriched = useMemo(() => customers.map((c: any) => {
    const cb = bookings.filter((b: any) => b.customer_id === c.id);
    return { ...c, total: cb.length, last: cb.map((b: any) => b.check_out_date).sort().pop() };
  }), [customers, bookings]);

  const filtered = enriched.filter((c: any) => !q || c.full_name?.toLowerCase().includes(q.toLowerCase()) || c.mobile?.includes(q) || c.email?.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, mobile, email…" className="w-full bg-card border border-border pl-10 pr-4 py-2.5 text-sm focus:border-gold focus:outline-none" />
      </div>
      <div className="bg-card border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <tr>{["Name", "Mobile", "Email", "Total Bookings", "Last Stay"].map((h) => <th key={h} className="text-left py-4 px-4 font-normal">{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">No customers</td></tr>}
            {filtered.map((c: any) => (
              <tr key={c.id} className="border-t border-border">
                <td className="py-4 px-4">{c.full_name}</td>
                <td className="py-4 px-4 text-muted-foreground">{c.mobile}</td>
                <td className="py-4 px-4 text-muted-foreground">{c.email}</td>
                <td className="py-4 px-4 text-gold">{c.total}</td>
                <td className="py-4 px-4 text-muted-foreground">{c.last ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
