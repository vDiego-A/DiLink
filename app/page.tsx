import { ContactSection } from "@/components/marketing/contact-section";
import { Customization } from "@/components/marketing/customization";
import { EditorShowcase } from "@/components/marketing/editor-showcase";
import { Features } from "@/components/marketing/features";
import { FinalCta } from "@/components/marketing/final-cta";
import { Footer } from "@/components/marketing/footer";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Navbar } from "@/components/marketing/navbar";
import { Pricing } from "@/components/marketing/pricing";
import { ThemeGallery } from "@/components/marketing/theme-gallery";

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-clip bg-[var(--background)] text-[var(--foreground)]">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <EditorShowcase />
        <ThemeGallery />
        <Customization />
        <Pricing />
        <FinalCta />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
