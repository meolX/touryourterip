import MainLayout from "@/components/layout/MainLayout";
import HeroSection from "@/components/home/HeroSection";
import FeaturedProperties from "@/components/home/FeaturedProperties";
import CategorySection from "@/components/home/CategorySection";
import WhyUsSection from "@/components/home/WhyUsSection";

export default function HomePage() {
  return (
    <MainLayout>
      <HeroSection />
      <CategorySection />
      <FeaturedProperties />
      <WhyUsSection />
    </MainLayout>
  );
}
