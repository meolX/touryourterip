"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { notificationApi } from "@/lib/notificationApi";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      notificationApi.getAll().then((r) => r.data.data.notifications),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All marked as read");
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => notificationApi.clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notifications cleared");
    },
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const notifications = data ?? [];
  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          {unread > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              {unread} unread
            </p>
          )}
        </div>
        {notifications.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllMutation.mutate()}
              loading={markAllMutation.isPending}
              className="gap-1.5"
            >
              <CheckCheck size={13} />
              Mark all read
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearMutation.mutate()}
              loading={clearMutation.isPending}
              className="gap-1.5 text-gray-400"
            >
              <Trash2 size={13} />
              Clear
            </Button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <Bell size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">All caught up!</p>
            <p className="text-sm text-gray-400 mt-1">
              No notifications yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors",
                  !n.is_read && "bg-brand-50/50"
                )}
                onClick={() => !n.is_read && markOneMutation.mutate(n.id)}
              >
                <div
                  className={cn(
                    "w-2.5 h-2.5 rounded-full mt-1.5 shrink-0",
                    n.is_read ? "bg-gray-200" : "bg-brand-500"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm leading-snug",
                      n.is_read
                        ? "text-gray-600 font-normal"
                        : "text-gray-900 font-medium"
                    )}
                  >
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                    {n.message}
                  </p>
                </div>
                {!n.is_read && (
                  <button className="shrink-0 p-1.5 rounded-lg hover:bg-brand-100 text-brand-500 transition-colors">
                    <Check size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
