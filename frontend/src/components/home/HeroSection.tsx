import SearchBar from "@/components/search/SearchBar";

const destinations = ["Goa", "Manali", "Jaipur", "Kerala", "Mumbai", "Coorg"];

export default function HeroSection() {
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/60 via-gray-900/40 to-gray-900/70" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center pt-16">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-white/90 text-sm mb-6">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          1,200+ properties across India
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 leading-tight tracking-tight">
          Find your perfect
          <br />
          <span className="text-brand-400">stay in India</span>
        </h1>

        <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto leading-relaxed">
          Hotels, villas, resorts, PGs — book instantly with no hidden fees.
          Best prices, guaranteed.
        </p>

        {/* Search bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <SearchBar />
        </div>

        {/* Popular destinations */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-white/60 text-sm">Popular:</span>
          {destinations.map((d) => (
            <a
              key={d}
              href={`/search?city=${d}`}
              className="px-3.5 py-1 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white/90 text-sm rounded-full transition-colors"
            >
              {d}
            </a>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/40">
        <div className="w-5 h-8 border-2 border-white/30 rounded-full flex items-start justify-center p-1">
          <div className="w-1 h-2 bg-white/60 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
