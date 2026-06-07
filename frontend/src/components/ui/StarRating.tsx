import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: "sm" | "md";
  showValue?: boolean;
  className?: string;
}

export default function StarRating({
  rating,
  max = 5,
  size = "sm",
  showValue = true,
  className,
}: StarRatingProps) {
  const starSize = size === "sm" ? 12 : 16;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }).map((_, i) => (
          <Star
            key={i}
            size={starSize}
            className={
              i < Math.floor(rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-gray-200 text-gray-200"
            }
          />
        ))}
      </div>
      {showValue && (
        <span className="text-xs font-medium text-gray-600">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
