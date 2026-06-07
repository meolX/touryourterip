import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel — visual */}
      <div className="hidden lg:flex flex-col justify-between relative overflow-hidden bg-gray-950 p-12">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/30 to-gray-950/80" />

        <Link href="/" className="relative flex items-center gap-2 z-10">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">T</span>
          </div>
          <span className="text-white font-bold text-xl">TourYourTrip</span>
        </Link>

        <div className="relative z-10">
          <blockquote className="text-white/90 text-xl font-medium leading-relaxed mb-4">
            &ldquo;From a quick weekend escape to a month-long retreat — we&apos;ve got
            the perfect place waiting for you.&rdquo;
          </blockquote>
          <p className="text-white/50 text-sm">
            Over 1,200 verified properties across India
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-col items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="lg:hidden flex items-center gap-2 mb-8 justify-center"
          >
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">
              TourYourTrip
            </span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
