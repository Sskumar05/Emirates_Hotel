import { createFileRoute } from "@tanstack/react-router";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { Building } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — Emirates Inn" }, { name: "description", content: "Our story, our standards." }] }),
  component: About,
});

function About() {
  return (
    <WebsiteLayout>
      <div className="container-luxe pt-32 pb-20 max-w-4xl">
        <div className="text-center mb-16">
          {/* <div className="h-16 w-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building className="h-8 w-8 text-primary" />
          </div> */}
          <span className="text-sm font-semibold uppercase tracking-wider text-gold">Our Story</span>
          <h1 className="font-bold text-4xl sm:text-5xl md:text-7xl mt-4 text-foreground tracking-tight">Hospitality, refined.</h1>
        </div>
        <div className="space-y-6 text-muted-foreground leading-relaxed text-lg font-medium">
          <p>Emirates Inn began as a single boutique property — a vision to craft stays that feel intimate, unhurried, and quietly opulent. Today, the collection includes the original Emirates Inn and the flagship Emirates Grand Inn, each a love letter to thoughtful design and instinctive service.</p>
          <p>Every detail is deliberate. From the lighting in the lobby to the texture of the linens, we obsess so our guests don't have to. Our team is trained not to interrupt your moment — only to enhance it.</p>
          <p>Whether you arrive for a single night or a season, you are part of a story we've been writing for decades.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-16">
          {[{ n: "2", l: "Distinct Properties" }, { n: "120+", l: "Curated Rooms" }, { n: "5★", l: "Guest Standard" }].map((s) => (
            <div key={s.l} className="text-center bg-card rounded-lg shadow-card border border-border p-8">
              <div className="font-bold text-5xl text-primary">{s.n}</div>
              <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mt-4">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </WebsiteLayout>
  );
}
