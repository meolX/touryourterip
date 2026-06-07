"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import Button from "@/components/ui/Button";

export default function WishlistPage() {
  return (
    <div className="space-y-4 animate-fade-up">
      <h1 className="text-xl font-bold text-gray-900">Wishlist</h1>
      <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
        <Heart size={36} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500 font-medium">Your wishlist is empty</p>
        <p className="text-sm text-gray-400 mt-1 mb-4">
          Save properties you love and come back to them later
        </p>
        <Link href="/search">
          <Button>Browse properties</Button>
        </Link>
      </div>
    </div>
  );
}
