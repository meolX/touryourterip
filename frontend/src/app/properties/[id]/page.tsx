"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  MapPin,
  Star,
  Wifi,
  Wind,
  Tv,
  Users,
  BedDouble,
  ArrowLeft,
  Heart,
  Share2,
} from "lucide-react";
import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import { propertyApi } from "@/lib/propertyApi";
import { reviewApi } from "@/lib/reviewApi";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Room } from "@/types";

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activePhoto, setActivePhoto] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  const { data: propData, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: () => propertyApi.getById(id).then((r) => r.data.data.property),
    enabled: !!id,
  });

  const { data: reviewData } = useQuery({
    queryKey: ["reviews", id],
    queryFn: () =>
      reviewApi
        .getByProperty(id, { limit: 6 })
        .then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: roomData } = useQuery({
    queryKey: ["rooms", id],
    queryFn: () =>
      propertyApi.getRooms(id).then((r) => r.data.data.rooms),
    enabled: !!id,
  });

  const property = propData;
  const photos = property?.photos ?? [];
  const rooms: Room[] = roomData ?? [];
  const reviews = reviewData?.reviews ?? [];

  const handleBookNow = () => {
    if (!selectedRoom) return;
    const params = new URLSearchParams({
      roomId: selectedRoom.id,
      ...(checkIn && { check_in: checkIn }),
      ...(checkOut && { check_out: checkOut }),
      guests: String(guests),
    });
    router.push(`/properties/${id}/book?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="pt-16 max-w-7xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-[420px] w-full rounded-2xl" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!property) {
    return (
      <MainLayout>
        <div className="pt-16 text-center py-20 text-gray-500">
          Property not found.
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
          >
            <ArrowLeft size={15} /> Back to results
          </button>

          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="brand">{property.type.toUpperCase()}</Badge>
                {(property.rating_avg ?? 0) > 0 && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Star size={13} className="fill-amber-400 text-amber-400" />
                    <span className="font-medium">{property.rating_avg?.toFixed(1)}</span>
                    <span className="text-gray-400">({property.review_count} reviews)</span>
                  </div>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                {property.title}
              </h1>
              <div className="flex items-center gap-1 text-gray-500 text-sm">
                <MapPin size={13} />
                <span>
                  {property.address_line1}, {property.city}, {property.state}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-gray-300 transition-colors">
                <Share2 size={14} /> Share
              </button>
              <button className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-gray-300 transition-colors">
                <Heart size={14} /> Save
              </button>
            </div>
          </div>

          {/* Photo Gallery */}
          <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[380px] sm:h-[420px] rounded-2xl overflow-hidden mb-8">
            {photos.length === 0 ? (
              <div className="col-span-4 row-span-2 bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
                <span className="text-5xl font-bold text-brand-400">
                  {property.title[0]}
                </span>
              </div>
            ) : (
              <>
                <div className="col-span-2 row-span-2 relative">
                  <Image
                    src={photos[0]?.url}
                    alt={property.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                {photos.slice(1, 5).map((photo, i) => (
                  <div key={photo.id} className="relative overflow-hidden">
                    <Image
                      src={photo.url}
                      alt={`${property.title} photo ${i + 2}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                    />
                    {i === 3 && photos.length > 5 && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-semibold text-sm">
                        +{photos.length - 5} more
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              {property.description && (
                <section>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    About this place
                  </h2>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    {property.description}
                  </p>
                </section>
              )}

              {/* Amenities */}
              {property.amenities && Object.keys(property.amenities).length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Amenities
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(property.amenities)
                      .filter(([, v]) => v)
                      .map(([key]) => (
                        <div
                          key={key}
                          className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2"
                        >
                          <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
                          {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </div>
                      ))}
                  </div>
                </section>
              )}

              {/* Rooms */}
              {rooms.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Available rooms
                  </h2>
                  <div className="space-y-3">
                    {rooms.filter((r) => r.is_active).map((room) => (
                      <button
                        key={room.id}
                        onClick={() =>
                          setSelectedRoom((prev) =>
                            prev?.id === room.id ? null : room
                          )
                        }
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          selectedRoom?.id === room.id
                            ? "border-brand-500 bg-brand-50"
                            : "border-gray-100 bg-white hover:border-brand-300"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900 mb-1">
                              {room.name}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <BedDouble size={12} />
                                {room.bed_count} bed{room.bed_count > 1 ? "s" : ""}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users size={12} />
                                Up to {room.max_guests} guests
                              </span>
                              {room.has_wifi && (
                                <span className="flex items-center gap-1">
                                  <Wifi size={12} /> WiFi
                                </span>
                              )}
                              {room.has_ac && (
                                <span className="flex items-center gap-1">
                                  <Wind size={12} /> AC
                                </span>
                              )}
                              {room.has_tv && (
                                <span className="flex items-center gap-1">
                                  <Tv size={12} /> TV
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-gray-900 text-base">
                              {formatCurrency(room.price_per_night)}
                            </p>
                            <p className="text-xs text-gray-400">/ night</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Reviews */}
              {reviews.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Guest reviews
                    <span className="text-sm font-normal text-gray-400 ml-2">
                      {property.review_count} total
                    </span>
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="p-4 bg-gray-50 rounded-xl border border-gray-100"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-brand-200 rounded-full flex items-center justify-center text-brand-700 text-xs font-bold">
                            {review.guest?.name?.[0] ?? "G"}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {review.guest?.name ?? "Guest"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDate(review.created_at)}
                            </p>
                          </div>
                          <div className="ml-auto flex items-center gap-0.5">
                            <Star
                              size={12}
                              className="fill-amber-400 text-amber-400"
                            />
                            <span className="text-xs font-medium text-gray-700">
                              {review.overall_rating}
                            </span>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* House Rules */}
              {property.house_rules && (
                <section>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    House rules
                  </h2>
                  <p className="text-sm text-gray-600 bg-amber-50 border border-amber-100 rounded-xl p-4 leading-relaxed">
                    {property.house_rules}
                  </p>
                </section>
              )}
            </div>

            {/* Sticky Booking Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 bg-white border border-gray-200 rounded-2xl p-5 shadow-card">
                <div className="mb-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(
                      selectedRoom?.price_per_night ??
                        property.base_price_per_night,
                      property.currency
                    )}
                    <span className="text-sm font-normal text-gray-400"> / night</span>
                  </p>
                  {(property.rating_avg ?? 0) > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star
                        size={12}
                        className="fill-amber-400 text-amber-400"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {property.rating_avg?.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-400">
                        · {property.review_count} reviews
                      </span>
                    </div>
                  )}
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
                  <div className="grid grid-cols-2 divide-x divide-gray-200">
                    <div className="p-3">
                      <p className="text-[10px] uppercase font-semibold text-gray-500 mb-1">
                        Check in
                      </p>
                      <input
                        type="date"
                        value={checkIn}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setCheckIn(e.target.value)}
                        className="w-full text-sm font-medium text-gray-800 outline-none bg-transparent"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-[10px] uppercase font-semibold text-gray-500 mb-1">
                        Check out
                      </p>
                      <input
                        type="date"
                        value={checkOut}
                        min={checkIn || new Date().toISOString().split("T")[0]}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="w-full text-sm font-medium text-gray-800 outline-none bg-transparent"
                      />
                    </div>
                  </div>
                  <div className="border-t border-gray-200 p-3">
                    <p className="text-[10px] uppercase font-semibold text-gray-500 mb-1">
                      Guests
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setGuests((g) => Math.max(1, g - 1))}
                        className="w-7 h-7 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center text-sm"
                      >
                        −
                      </button>
                      <span className="text-sm font-medium">{guests} guest{guests > 1 ? "s" : ""}</span>
                      <button
                        onClick={() =>
                          setGuests((g) =>
                            g < (selectedRoom?.max_guests ?? 10) ? g + 1 : g
                          )
                        }
                        className="w-7 h-7 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {!selectedRoom && (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-3">
                    Please select a room to continue
                  </p>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  disabled={!selectedRoom}
                  onClick={handleBookNow}
                >
                  Reserve now
                </Button>

                <p className="text-xs text-center text-gray-400 mt-2">
                  You won&apos;t be charged yet
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
