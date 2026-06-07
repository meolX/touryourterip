"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  User,
  X,
  LayoutDashboard,
  Heart,
  CalendarCheck,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { notificationApi } from "@/lib/notificationApi";
import { authApi } from "@/lib/authApi";
import { cn, getInitials } from "@/lib/utils";
import toast from "react-hot-toast";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const isHomePage = pathname === "/";

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    notificationApi
      .getUnreadCount()
      .then((res) => setUnreadCount(res.data.data.count))
      .catch(() => {});
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      logout();
      router.push("/");
      toast.success("Logged out successfully");
    }
  };

  const navLinks = [
    { href: "/search", label: "Explore" },
    { href: "/search?type=hotel", label: "Hotels" },
    { href: "/search?type=villa", label: "Villas" },
    { href: "/search?type=pg", label: "PGs" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled || !isHomePage
          ? "bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm"
          : "bg-transparent"
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span
            className={cn(
              "font-bold text-lg tracking-tight transition-colors",
              scrolled || !isHomePage ? "text-gray-900" : "text-white"
            )}
          >
            TourYourTrip
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3.5 py-2 rounded-lg text-sm font-medium transition-colors",
                scrolled || !isHomePage
                  ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  : "text-white/90 hover:text-white hover:bg-white/10"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <>
              {/* Notifications */}
              <Link
                href="/dashboard/notifications"
                className={cn(
                  "relative p-2 rounded-lg transition-colors",
                  scrolled || !isHomePage
                    ? "text-gray-600 hover:bg-gray-100"
                    : "text-white/80 hover:bg-white/10"
                )}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((p) => !p)}
                  className={cn(
                    "flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl transition-colors border",
                    scrolled || !isHomePage
                      ? "border-gray-200 hover:border-gray-300 bg-white text-gray-700"
                      : "border-white/20 hover:border-white/40 bg-white/10 text-white"
                  )}
                >
                  <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                    {getInitials(user.name)}
                  </div>
                  <span className="text-sm font-medium hidden sm:block">
                    {user.name.split(" ")[0]}
                  </span>
                  <ChevronDown
                    size={14}
                    className={cn(
                      "transition-transform",
                      profileOpen && "rotate-180"
                    )}
                  />
                </button>

                {profileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setProfileOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-gray-100 shadow-card-hover z-20 py-1.5 animate-fade-up">
                      <div className="px-3.5 py-2.5 border-b border-gray-50">
                        <p className="text-sm font-semibold text-gray-900">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      {[
                        {
                          href: "/dashboard",
                          icon: LayoutDashboard,
                          label: "Dashboard",
                        },
                        {
                          href: "/dashboard/bookings",
                          icon: CalendarCheck,
                          label: "My Bookings",
                        },
                        {
                          href: "/dashboard/wishlist",
                          icon: Heart,
                          label: "Wishlist",
                        },
                        {
                          href: "/dashboard/profile",
                          icon: User,
                          label: "Profile",
                        },
                      ].map(({ href, icon: Icon, label }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Icon size={15} className="text-gray-400" />
                          {label}
                        </Link>
                      ))}
                      <div className="border-t border-gray-50 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={15} />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                  scrolled || !isHomePage
                    ? "text-gray-700 hover:bg-gray-100"
                    : "text-white/90 hover:bg-white/10"
                )}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-xl text-sm font-medium bg-brand-500 text-white hover:bg-brand-600 transition-colors shadow-sm"
              >
                Get started
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            className={cn(
              "md:hidden p-2 rounded-lg transition-colors",
              scrolled || !isHomePage
                ? "text-gray-600 hover:bg-gray-100"
                : "text-white hover:bg-white/10"
            )}
            onClick={() => setMobileOpen((p) => !p)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1 animate-fade-up">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 font-medium"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
