import Link from "next/link";
import { MapPin, Mail } from "lucide-react";

const footerLinks = {
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
    { label: "Blog", href: "/blog" },
  ],
  Support: [
    { label: "Help Centre", href: "/help" },
    { label: "Safety", href: "/safety" },
    { label: "Cancellation", href: "/cancellation" },
    { label: "Contact Us", href: "/contact" },
  ],
  Explore: [
    { label: "Hotels", href: "/search?type=hotel" },
    { label: "Villas", href: "/search?type=villa" },
    { label: "Resorts", href: "/search?type=resort" },
    { label: "PGs", href: "/search?type=pg" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="text-white font-bold text-lg">TourYourTrip</span>
            </Link>
            <p className="text-sm leading-relaxed mb-5 max-w-xs">
              Discover the best hotels, villas, PGs and resorts across India.
              Book your perfect stay in seconds.
            </p>
            <div className="flex items-center gap-2 text-sm mb-3">
              <MapPin size={14} className="text-brand-500 shrink-0" />
              <span>Goa, India</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail size={14} className="text-brand-500 shrink-0" />
              <span>hello@touryourtrip.in</span>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-white text-sm font-semibold mb-4">
                {heading}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs">
            © {new Date().getFullYear()} TourYourTrip. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {["𝕏", "📸", "in"].map((label, i) => (
              <a
                key={i}
                href="#"
                className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors text-gray-400 text-xs font-medium"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
