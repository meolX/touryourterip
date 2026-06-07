import Link from "next/link";

const categories = [
  {
    type: "hotel",
    label: "Hotels",
    emoji: "🏨",
    description: "Professional stays",
    color: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
  },
  {
    type: "villa",
    label: "Villas",
    emoji: "🏡",
    description: "Private luxury",
    color: "from-green-500 to-emerald-600",
    bg: "bg-green-50",
  },
  {
    type: "resort",
    label: "Resorts",
    emoji: "🌴",
    description: "Ultimate getaways",
    color: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
  },
  {
    type: "pg",
    label: "PGs",
    emoji: "🏠",
    description: "Budget-friendly",
    color: "from-purple-500 to-violet-600",
    bg: "bg-purple-50",
  },
];

export default function CategorySection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Browse by type
        </h2>
        <p className="text-gray-500">Find exactly what suits you</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.type}
            href={`/search?type=${cat.type}`}
            className={`group ${cat.bg} rounded-2xl p-6 flex flex-col items-center gap-3 text-center hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-gray-100`}
          >
            <span className="text-4xl group-hover:scale-110 transition-transform duration-200">
              {cat.emoji}
            </span>
            <div>
              <p className="font-semibold text-gray-900">{cat.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
