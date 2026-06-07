"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { propertyApi } from "@/lib/propertyApi";
import PropertyCard from "@/components/property/PropertyCard";
import { PropertyCardSkeleton } from "@/components/ui/Skeleton";

export default function FeaturedProperties() {
  const { data, isLoading } = useQuery({
    queryKey: ["featured-properties"],
    queryFn: () =>
      propertyApi.getAll({ limit: 6, page: 1 }).then((r) => r.data.data),
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-surface-muted rounded-3xl">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            Featured stays
          </h2>
          <p className="text-gray-500">Hand-picked properties just for you</p>
        </div>
        <Link
          href="/search"
          className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
        >
          View all
          <ArrowRight size={15} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))
          : data?.properties?.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
      </div>

      <div className="sm:hidden text-center mt-6">
        <Link
          href="/search"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600"
        >
          View all properties <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
