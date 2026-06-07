"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin } from "lucide-react";
import { useState } from "react";
import { Property } from "@/types";
import { formatCurrency } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import StarRating from "@/components/ui/StarRating";

const typeLabel: Record<string, string> = {
  hotel: "Hotel",
  villa: "Villa",
  pg: "PG",
  resort: "Resort",
};

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const [wished, setWished] = useState(false);
  const cover =
    property.photos?.find((p) => p.is_cover)?.url ||
    property.photos?.[0]?.url ||
    null;

  return (
    <Link href={`/properties/${property.id}`} className="group block">
      <article className="rounded-2xl overflow-hidden bg-white border border-gray-100 card-hover">
        {/* Image */}
        <div className="relative h-52 bg-gray-100 overflow-hidden">
          {cover ? (
            <Image
              src={cover}
              alt={property.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200">
              <span className="text-brand-400 text-4xl font-bold">
                {property.title[0]}
              </span>
            </div>
          )}

          {/* Type badge */}
          <div className="absolute top-3 left-3">
            <Badge variant="brand">
              {typeLabel[property.type] ?? property.type}
            </Badge>
          </div>

          {/* Wishlist */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setWished((w) => !w);
            }}
            className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
          >
            <Heart
              size={15}
              className={
                wished ? "fill-red-500 text-red-500" : "text-gray-500"
              }
            />
          </button>
        </div>

        {/* Details */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1 group-hover:text-brand-600 transition-colors">
              {property.title}
            </h3>
            {(property.rating_avg ?? 0) > 0 && (
              <StarRating
                rating={property.rating_avg!}
                showValue
                className="shrink-0"
              />
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
            <MapPin size={11} />
            <span className="truncate">
              {property.city}, {property.state}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-base font-bold text-gray-900">
                {formatCurrency(property.base_price_per_night, property.currency)}
              </span>
              <span className="text-xs text-gray-400"> / night</span>
            </div>
            {property.review_count > 0 && (
              <span className="text-xs text-gray-400">
                {property.review_count} reviews
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
