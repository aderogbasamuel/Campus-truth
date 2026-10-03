import { createFileRoute } from "@tanstack/react-router";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Problem from "@/components/landing/Problem";
import Features from "@/components/landing/Features";
import HowWeVerify from "@/components/landing/HowWeVerify";
import Offers from "@/components/landing/Offers";
import Faq from "@/components/landing/Faq";
import CallToAction from "@/components/landing/CallToAction";
import Footer from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CampusTruth — Your campus, decoded" },
      {
        name: "description",
        content:
          "Verified University of Lagos updates, student answers and an AI campus assistant grounded in trusted sources.",
      },
      { property: "og:title", content: "CampusTruth — Your campus, decoded" },
      {
        property: "og:description",
        content:
          "Verified UNILAG updates, real student answers and a campus assistant that never guesses.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-bg-2">
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Features />
        <HowWeVerify />
        <Offers />
        <Faq />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}