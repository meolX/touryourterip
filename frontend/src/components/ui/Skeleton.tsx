import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("rounded-lg shimmer", className)}
      style={{ minHeight: "1rem" }}
    />
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white">
      <div className="h-52 w-full shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 shimmer rounded-lg" />
        <div className="h-3 w-1/2 shimmer rounded-lg" />
        <div className="h-3 w-1/4 shimmer rounded-lg" />
      </div>
    </div>
  );
}
