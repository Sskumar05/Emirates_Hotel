import { createFileRoute } from "@tanstack/react-router";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { Crown } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — Emirates Inn" }, { name: "description", content: "Our story, our standards." }] }),
  component: About,
});

function About() {
  return (
    <WebsiteLayout>
      <div className="container-luxe pt-32 pb-20 max-w-4xl">
        <div className="text-center mb-16">
          <Crown className="h-8 w-8 text-gold mx-auto mb-4" />
          <span className="text-xs uppercase tracking-[0.4em] text-gold">Our Story</span>
          <h1 className="font-display text-5xl md:text-7xl mt-4">Hospitality, refined.</h1>
        </div>
        <div className="prose-luxe space-y-6 text-muted-foreground leading-relaxed text-lg">
          <p>Emirates Inn began as a single boutique property — a vision to craft stays that feel intimate, unhurried, and quietly opulent. Today, the collection includes the original Emirates Inn and the flagship Emirates Grand Inn, each a love letter to thoughtful design and instinctive service.</p>
          <p>Every detail is deliberate. From the lighting in the lobby to the texture of the linens, we obsess so our guests don't have to. Our team is trained not to interrupt your moment — only to enhance it.</p>
          <p>Whether you arrive for a single night or a season, you are part of a story we've been writing for decades.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          {[{ n: "2", l: "Distinct Properties" }, { n: "120+", l: "Curated Rooms" }, { n: "5★", l: "Guest Standard" }].map((s) => (
            <div key={s.l} className="text-center bg-card border border-border p-8">
              <div className="font-display text-5xl text-gold">{s.n}</div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-2">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </WebsiteLayout>
  );
}
