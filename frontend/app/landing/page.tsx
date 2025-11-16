import { HeroSection } from "@/app/landing/components/hero-section";
import { StatsSection } from "@/app/landing/components/stats-section";
import { FeaturesSection } from "@/app/landing/components/features-section";
import { HowItWorks } from "@/app/landing/components/how-it-works";
import { Testimonials } from "@/app/landing/components/testimonials";
import { FaqSection } from "@/app/landing/components/faq-section";
import { CtaSection } from "@/app/landing/components/cta-section";
import { Footer } from "@/app/landing/components/footer";
import { Navbar } from "@/app/landing/components/navbar";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorks />
      <Testimonials />
      <FaqSection />
      <CtaSection />
      <Footer />
    </main>
  );
}
