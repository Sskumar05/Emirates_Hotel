import { createFileRoute } from "@tanstack/react-router";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";

export const Route = createFileRoute("/gallery")({
  head: () => ({ meta: [{ title: "Gallery — Emirates Inn" }] }),
  component: Gallery,
});

const PHOTOS = [
  "1566073771259-6a8506099945","1582719508461-905c673771fd","1631049307264-da0ec9d70304",
  "1551882547-ff40c63fe5fa","1611892440504-42a792e24d32","1590490360182-c33d57733427",
  "1564013799919-ab600027ffc6","1571003123894-1f0594d2b5d9","1578683010236-d716f9a3f461",
  "1582719478250-c89cae4dc85b","1551776235-dde6d482980b","1584132967334-10e028bd69f7",
];

function Gallery() {
  return (
    <WebsiteLayout>
      <div className="container-luxe pt-32 pb-20">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold uppercase tracking-wider text-gold">Moments</span>
          <h1 className="font-bold text-5xl md:text-7xl mt-4 text-foreground tracking-tight">Gallery</h1>
        </div>
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {PHOTOS.map((id, i) => (
            <img key={id} src={`https://images.unsplash.com/photo-${id}?w=800&q=80`} alt=""
              loading="lazy" className={`w-full object-cover break-inside-avoid rounded-lg shadow-sm hover:shadow-md transition-shadow ${i % 3 === 0 ? "aspect-[3/4]" : i % 3 === 1 ? "aspect-square" : "aspect-[4/5]"}`} />
          ))}
        </div>
      </div>
    </WebsiteLayout>
  );
}
