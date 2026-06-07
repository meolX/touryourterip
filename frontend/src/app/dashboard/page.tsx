"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, Heart, Bell, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { bookingApi } from "@/lib/bookingApi";
import { notificationApi } from "@/lib/notificationApi";
import { formatCurrency, formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";

const statusVariant: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
  confirmed: "success",
  pending: "warning",
  cancelled: "danger",
  checked_in: "info",
  checked_out: "default",
  no_show: "danger",
};

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => bookingApi.getAll().then((r) => r.data.data.bookings),
  });

  const { data: notifData } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: () => notificationApi.getUnreadCount().then((r) => r.data.data.count),
  });

  const bookings = bookingsData ?? [];
  const totalSpent = bookings
    .filter((b) => b.status === "confirmed" || b.status === "checked_out")
    .reduce((s, b) => s + b.total_amount, 0);

  const stats = [
    {
      icon: CalendarCheck,
      label: "Total bookings",
      value: bookings.length,
      color: "text-blue-600 bg-blue-50",
      href: "/dashboard/bookings",
    },
    {
      icon: TrendingUp,
      label: "Total spent",
      value: formatCurrency(totalSpent),
      color: "text-green-600 bg-green-50",
      href: "/dashboard/bookings",
    },
    {
      icon: Bell,
      label: "Unread notifications",
      value: notifData ?? 0,
      color: "text-brand-600 bg-brand-50",
      href: "/dashboard/notifications",
    },
    {
      icon: Heart,
      label: "Wishlist",
      value: "—",
      color: "text-red-500 bg-red-50",
      href: "/dashboard/wishlist",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Hey, {user?.name.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Here&apos;s what&apos;s happening with your account
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ icon: Icon, label, value, color, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-card-hover transition-all group"
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}
            >
              <Icon size={17} />
            </div>
            <p className="text-xl font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
              {value}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Recent bookings</h2>
          <Link
            href="/dashboard/bookings"
            className="text-sm text-brand-600 hover:text-brand-700"
          >
            View all
          </Link>
        </div>

        {bookingsLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            <CalendarCheck size={28} className="mx-auto mb-2 opacity-40" />
            No bookings yet.{" "}
            <Link href="/search" className="text-brand-600 font-medium">
              Start exploring →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {bookings.slice(0, 5).map((booking) => (
              <Link
                key={booking.id}
                href={`/dashboard/bookings/${booking.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {booking.property?.title ?? "Property"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(booking.check_in)} – {formatDate(booking.check_out)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-sm font-semibold text-gray-800 hidden sm:block">
                    {formatCurrency(booking.total_amount)}
                  </span>
                  <Badge variant={statusVariant[booking.status] ?? "default"}>
                    {booking.status.replace("_", " ")}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
