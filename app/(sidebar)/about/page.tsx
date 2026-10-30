import { Metadata } from "next";
import Timeline from "@/components/visualizations/Timeline";
import { personJsonLd } from "@/config/person";
import { serializeJsonLd } from "@/utils/jsonLd";
import { timelineEvents } from "./events";
import { pageMetadata } from "@/utils/pageMetadata";

export const metadata: Metadata = pageMetadata({
  title: "about",
  description: "my life made up of small, meaningful moments",
  path: "/about",
});

export const dynamic = "force-static";

const ChronologyPage = () => (
  <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(personJsonLd) }}
    />
    <div className="min-h-screen font-serif">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8 pb-4">
          <h1 className="text-base text-accent">
            my life made up of small, meaningful moments
          </h1>
        </div>
        <Timeline events={timelineEvents} />
      </div>
    </div>
  </>
);

export default ChronologyPage;
