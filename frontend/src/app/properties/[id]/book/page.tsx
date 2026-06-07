"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ArrowLeft, MapPin, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import MainLayout from "@/components/layout/MainLayout";
import Button from "@/components/ui/Button";
import { propertyApi } from "@/lib/propertyApi";
import { bookingApi } from "@/lib/bookingApi";
import { formatCurrency, formatDate, nightsBetween } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const schema = z.object({
  guests_count: z.number().min(1),
});

type FormData = z.infer<typeof schema>;

function BookingForm() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const roomId = searchParams.get("roomId") || "";
  const checkIn = searchParams.get("check_in") || "";
  const checkOut = searchParams.get("check_out") || "";
  const guestsParam = Number(searchParams.get("guests") || "1");

  const { data: property } = useQuery({
    queryKey: ["property", id],
    queryFn: () => propertyApi.getById(id).then((r) => r.data.data.property),
    enabled: !!id,
  });

  const { data: roomsData } = useQuery({
    queryKey: ["rooms", id],
    queryFn: () => propertyApi.getRooms(id).then((r) => r.data.data.rooms),
    enabled: !!id,
  });

  const room = roomsData?.find((r) => r.id === roomId);

  const nights =
    checkIn && checkOut
      ? nightsBetween(new Date(checkIn), new Date(checkOut))
      : 0;

  const roomPrice = room?.price_per_night ?? 0;
  const subtotal = roomPrice * Math.max(nights, 1);
  const taxes = Math.round(subtotal * 0.12);
  const total = subtotal + taxes;

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { guests_count: guestsParam },
  });

  const onSubmit = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to book");
      router.push("/login");
      return;
    }
    if (!room || !checkIn || !checkOut) {
      toast.error("Please fill in all booking details");
      return;
    }
    try {
      const res = await bookingApi.create({
        property_id: id,
        room_id: roomId,
        check_in: checkIn,
        check_out: checkOut,
        guests_count: guestsParam,
      });
      toast.success("Booking confirmed!");
      router.push(`/dashboard/bookings/${res.data.data.booking.id}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Booking failed. Please try again.";
      toast.error(msg);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft size={15} /> Back
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Confirm your booking
      </h1>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Form */}
        <div className="lg:col-span-3 space-y-6">
          {/* Guest Info */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Your details</h2>
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Name</span>
                  <span className="font-medium text-gray-800">{user.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium text-gray-800">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Phone</span>
                    <span className="font-medium text-gray-800">{user.phone}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Please{" "}
                <a href="/login" className="text-brand-600 font-medium">
                  sign in
                </a>{" "}
                to continue.
              </p>
            )}
          </div>

          {/* Trip Details */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Trip details</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Check-in</span>
                <span className="font-medium">
                  {checkIn ? formatDate(checkIn) : "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Check-out</span>
                <span className="font-medium">
                  {checkOut ? formatDate(checkOut) : "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Duration</span>
                <span className="font-medium">
                  {nights > 0 ? `${nights} night${nights > 1 ? "s" : ""}` : "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Guests</span>
                <span className="font-medium">{guestsParam}</span>
              </div>
            </div>
          </div>

          {/* Policies */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-3">
            <Shield size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">
                Free cancellation
              </p>
              <p className="text-xs text-blue-700 leading-relaxed">
                Cancel before check-in and get a full refund. Cancellations
                after check-in date are non-refundable.
              </p>
            </div>
          </div>
        </div>

        {/* Summary card */}
        <div className="lg:col-span-2">
          <div className="sticky top-20 bg-white border border-gray-200 rounded-2xl p-5 shadow-card">
            {property && (
              <div className="flex gap-3 pb-4 mb-4 border-b border-gray-100">
                <div className="w-16 h-16 rounded-xl bg-brand-100 shrink-0 overflow-hidden relative">
                  {property.photos?.[0]?.url ? (
                    <img
                      src={property.photos[0].url}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brand-500 font-bold text-lg">
                      {property.title[0]}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm leading-snug line-clamp-2">
                    {property.title}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <MapPin size={10} />
                    {property.city}, {property.state}
                  </div>
                  {room && (
                    <p className="text-xs text-brand-600 mt-1 font-medium">
                      {room.name}
                    </p>
                  )}
                </div>
              </div>
            )}

            <h3 className="font-semibold text-gray-900 mb-3">Price breakdown</h3>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-gray-600">
                <span>
                  {formatCurrency(roomPrice)} × {Math.max(nights, 1)} night{nights > 1 ? "s" : ""}
                </span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Taxes & fees (12%)</span>
                <span>{formatCurrency(taxes)}</span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900 text-base">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={isSubmitting}
                disabled={!isAuthenticated || !room}
              >
                Confirm & pay {formatCurrency(total)}
              </Button>
            </form>

            <p className="text-xs text-center text-gray-400 mt-2">
              Secure payment powered by Razorpay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <MainLayout>
      <div className="pt-16">
        <Suspense fallback={<div className="p-10 text-center text-gray-400">Loading...</div>}>
          <BookingForm />
        </Suspense>
      </div>
    </MainLayout>
  );
}
