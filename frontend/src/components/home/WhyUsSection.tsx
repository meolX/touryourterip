import { ShieldCheck, CreditCard, Clock, Headphones } from "lucide-react";

const perks = [
  {
    icon: ShieldCheck,
    title: "Verified properties",
    description: "Every listing is manually reviewed before going live.",
    color: "text-green-600 bg-green-50",
  },
  {
    icon: CreditCard,
    title: "Secure payments",
    description: "Powered by Razorpay — UPI, cards, netbanking all accepted.",
    color: "text-blue-600 bg-blue-50",
  },
  {
    icon: Clock,
    title: "Instant confirmation",
    description: "No waiting. Your booking is confirmed in seconds.",
    color: "text-brand-600 bg-brand-50",
  },
  {
    icon: Headphones,
    title: "24/7 support",
    description: "Our team is always here if something goes wrong.",
    color: "text-purple-600 bg-purple-50",
  },
];

export default function WhyUsSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Why TourYourTrip?
        </h2>
        <p className="text-gray-500 max-w-lg mx-auto">
          We&apos;re obsessed with making travel booking easy, safe and delightful.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {perks.map(({ icon: Icon, title, description, color }) => (
          <div
            key={title}
            className="p-6 rounded-2xl border border-gray-100 bg-white hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${color}`}
            >
              <Icon size={20} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1.5">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
