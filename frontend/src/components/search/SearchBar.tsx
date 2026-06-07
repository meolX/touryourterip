"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, Users, Search } from "lucide-react";
import Button from "@/components/ui/Button";

export default function SearchBar({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (checkIn) params.set("check_in", checkIn);
    if (checkOut) params.set("check_out", checkOut);
    if (guests > 1) params.set("guests", String(guests));
    router.push(`/search?${params.toString()}`);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
        <Search size={16} className="text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search destinations..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1 text-sm outline-none text-gray-700 placeholder:text-gray-400 min-w-0"
        />
        <Button size="sm" onClick={handleSearch}>
          Search
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-glass border border-white/40 p-2 flex flex-col md:flex-row gap-1">
      {/* Destination */}
      <div className="flex items-center gap-2.5 flex-1 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors cursor-text">
        <MapPin size={18} className="text-brand-500 shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
            Where
          </span>
          <input
            type="text"
            placeholder="Destination, city..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="bg-transparent text-sm font-medium text-gray-800 placeholder:text-gray-400 outline-none w-full"
          />
        </div>
      </div>

      <div className="hidden md:block w-px bg-gray-200 my-2" />

      {/* Check In */}
      <div className="flex items-center gap-2.5 flex-1 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors cursor-text">
        <Calendar size={18} className="text-brand-500 shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
            Check in
          </span>
          <input
            type="date"
            value={checkIn}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setCheckIn(e.target.value)}
            className="bg-transparent text-sm font-medium text-gray-800 outline-none w-full"
          />
        </div>
      </div>

      <div className="hidden md:block w-px bg-gray-200 my-2" />

      {/* Check Out */}
      <div className="flex items-center gap-2.5 flex-1 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors cursor-text">
        <Calendar size={18} className="text-brand-500 shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
            Check out
          </span>
          <input
            type="date"
            value={checkOut}
            min={checkIn || new Date().toISOString().split("T")[0]}
            onChange={(e) => setCheckOut(e.target.value)}
            className="bg-transparent text-sm font-medium text-gray-800 outline-none w-full"
          />
        </div>
      </div>

      <div className="hidden md:block w-px bg-gray-200 my-2" />

      {/* Guests */}
      <div className="flex items-center gap-2.5 flex-1 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors">
        <Users size={18} className="text-brand-500 shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
            Guests
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGuests((g) => Math.max(1, g - 1))}
              className="w-5 h-5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center text-xs font-bold"
            >
              −
            </button>
            <span className="text-sm font-medium text-gray-800 w-4 text-center">
              {guests}
            </span>
            <button
              onClick={() => setGuests((g) => g + 1)}
              className="w-5 h-5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center text-xs font-bold"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Search button */}
      <Button
        onClick={handleSearch}
        size="lg"
        className="md:self-center md:m-1 rounded-xl px-6 gap-2"
      >
        <Search size={16} />
        Search
      </Button>
    </div>
  );
}
