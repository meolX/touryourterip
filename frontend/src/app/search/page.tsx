"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import SearchBar from "@/components/search/SearchBar";
import PropertyCard from "@/components/property/PropertyCard";
import { PropertyCardSkeleton } from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import { searchApi } from "@/lib/searchApi";
import { Property } from "@/types";
import { cn } from "@/lib/utils";

const TYPES = ["hotel", "villa", "resort", "pg"] as const;
const SORT_OPTIONS = [
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const city = searchParams.get("city") || "";
  const type = searchParams.get("type") || "";
  const checkIn = searchParams.get("check_in") || "";
  const checkOut = searchParams.get("check_out") || "";
  const guests = searchParams.get("guests") || "";
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50000);
  const [selectedType, setSelectedType] = useState(type);
  const [sort, setSort] = useState("price_asc");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["search", city, selectedType, checkIn, checkOut, guests, minPrice, maxPrice, page],
    queryFn: () =>
      searchApi
        .properties({
          city,
          type: selectedType || undefined,
          check_in: checkIn || undefined,
          check_out: checkOut || undefined,
          guests: guests ? Number(guests) : undefined,
          min_price: minPrice || undefined,
          max_price: maxPrice < 50000 ? maxPrice : undefined,
          page,
          limit: 12,
        })
        .then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  const properties: Property[] = data?.properties ?? [];
  const total: number = data?.total ?? 0;

  const setTypeFilter = (t: string) => {
    setSelectedType((prev) => (prev === t ? "" : t));
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top search bar */}
      <div className="mb-6">
        <SearchBar compact />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all",
              selectedType === t
                ? "bg-brand-500 text-white border-brand-500"
                : "bg-white text-gray-600 border-gray-200 hover:border-brand-400"
            )}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersOpen(true)}
            className="gap-1.5"
          >
            <SlidersHorizontal size={14} />
            Filters
          </Button>
        </div>
      </div>

      {/* Results info */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {isLoading ? (
            "Searching..."
          ) : (
            <>
              <span className="font-semibold text-gray-900">{total}</span>{" "}
              {total === 1 ? "property" : "properties"} found
              {city && ` in ${city}`}
            </>
          )}
        </p>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">🏝️</p>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            No properties found
          </h3>
          <p className="text-gray-500 text-sm">
            Try adjusting your filters or search a different city.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 12 && (
        <div className="flex justify-center gap-2 mt-10">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="px-3 py-2 text-sm text-gray-600">
            Page {page} of {Math.ceil(total / 12)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= Math.ceil(total / 12)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Filters sidebar */}
      {filtersOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-80 bg-white z-50 shadow-2xl p-6 overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              <button
                onClick={() => setFiltersOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Min price / night: ₹{minPrice.toLocaleString("en-IN")}
                </label>
                <input
                  type="range"
                  min={0}
                  max={50000}
                  step={500}
                  value={minPrice}
                  onChange={(e) => setMinPrice(Number(e.target.value))}
                  className="w-full accent-brand-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Max price / night: ₹{maxPrice.toLocaleString("en-IN")}
                </label>
                <input
                  type="range"
                  min={0}
                  max={50000}
                  step={500}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-brand-500"
                />
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  setPage(1);
                  setFiltersOpen(false);
                }}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <MainLayout>
      <div className="pt-16">
        <Suspense fallback={<div className="p-10 text-center text-gray-400">Loading...</div>}>
          <SearchResults />
        </Suspense>
      </div>
    </MainLayout>
  );
}
