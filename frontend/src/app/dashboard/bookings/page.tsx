"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, X } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { bookingApi } from "@/lib/bookingApi";
import { formatCurrency, formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { BookingStatus } from "@/types";

const statusVariant: Record<BookingStatus, "success" | "warning" | "danger" | "info" | "default"> = {
  confirmed: "success",
  pending: "warning",
  cancelled: "danger",
  checked_in: "info",
  checked_out: "default",
  no_show: "danger",
};

export default function BookingsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => bookingApi.getAll().then((r) => r.data.data.bookings),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Booking cancelled");
    },
    onError: () => toast.error("Could not cancel booking"),
  });

  const bookings = data ?? [];

  return (
    <div className="space-y-4 animate-fade-up">
      <h1 className="text-xl font-bold text-gray-900">My Bookings</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <CalendarCheck size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No bookings yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">
            Your upcoming stays will appear here
          </p>
          <Link href="/search">
            <Button>Find a stay</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex gap-4">
                  {/* Property thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-brand-100 shrink-0 overflow-hidden">
                    {booking.property?.photos?.[0]?.url ? (
                      <img
                        src={booking.property.photos[0].url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-400 font-bold">
                        {booking.property?.title?.[0] ?? "?"}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <Link
                      href={`/properties/${booking.property_id}`}
                      className="font-semibold text-gray-900 hover:text-brand-600 transition-colors line-clamp-1 text-sm"
                    >
                      {booking.property?.title ?? "Property"}
                    </Link>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {booking.room?.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(booking.check_in)} →{" "}
                      {formatDate(booking.check_out)} · {booking.nights} night
                      {booking.nights > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-base">
                      {formatCurrency(booking.total_amount)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {booking.guests_count} guest{booking.guests_count > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant[booking.status]}>
                      {booking.status.replace("_", " ")}
                    </Badge>
                    {(booking.status === "pending" ||
                      booking.status === "confirmed") && (
                      <button
                        onClick={() => cancelMutation.mutate(booking.id)}
                        disabled={cancelMutation.isPending}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        title="Cancel booking"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
