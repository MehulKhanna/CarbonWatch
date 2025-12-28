"use client";

import { useEffect, useState } from "react";
import Spline from "@splinetool/react-spline";
import Link from "next/link";
import { useRouter } from "next/navigation";

const features = [
  {
    title: "Import Bank Statements",
    description:
      "Upload your bank statements (CSV/PDF) and we'll automatically categorize transactions and calculate their carbon footprint.",
    icon: "📊",
  },
  {
    title: "Smart Categorization",
    description:
      "Our AI automatically detects and categorizes your spending into Travel, Food, Shopping, Electricity, Gas, Water, and Home.",
    icon: "🤖",
  },
  {
    title: "Visual Insights",
    description:
      "Beautiful charts show your carbon trends over time. See weekly breakdowns and category distributions at a glance.",
    icon: "📈",
  },
  {
    title: "Personalized Tips",
    description:
      "Get tailored recommendations based on your spending patterns—from local markets to energy-efficient alternatives.",
    icon: "💡",
  },
  {
    title: "Earn Achievements",
    description:
      "Level up and unlock badges as you make greener choices. Track streaks, earn XP, and celebrate your progress.",
    icon: "🏆",
  },
  {
    title: "Track Your Progress",
    description:
      "Set monthly goals and watch your emissions drop. Our gamified system makes sustainability fun and rewarding.",
    icon: "🎯",
  },
];

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("accessToken");
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1a14] text-[#f0f7f4]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f1a14]/80 backdrop-blur-md border-b border-[#243328]">
        <div className="container mx-auto px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <span className="text-xl font-semibold text-[#4ade80]">
              Carbon Watch
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="bg-[#4ade80] hover:bg-[#22c55e] text-[#0f1a14] font-medium px-6 py-2 rounded-full transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-[#8ba898] hover:text-[#f0f7f4] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-[#4ade80] hover:bg-[#22c55e] text-[#0f1a14] font-medium px-6 py-2 rounded-full transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section with Spline */}
      <section className="relative h-screen">
        <div className="absolute inset-0">
          <Spline scene="https://prod.spline.design/RQEdfAzmEQYLDalX/scene.splinecode" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-[#162118]">
        <div className="container mx-auto px-8">
          <div className="text-center mb-16">
            <p className="text-[#4ade80] text-sm font-medium mb-2 tracking-wide">
              WHAT WE OFFER
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-[#f0f7f4]">
              Everything You Need to Go Green
            </h2>
            <p className="text-[#8ba898] max-w-2xl mx-auto">
              Powerful tools to track, analyze, and reduce your carbon
              footprint—made simple and rewarding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl bg-[#1a2b20] border border-[#2d3f33] hover:border-[#4ade80]/30 transition-all duration-300"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-medium mb-2 text-[#f0f7f4]">
                  {feature.title}
                </h3>
                <p className="text-[#8ba898] text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-[#0f1a14]">
        <div className="container mx-auto px-8">
          <div className="text-center mb-16">
            <p className="text-[#4ade80] text-sm font-medium mb-2 tracking-wide">
              HOW IT WORKS
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-[#f0f7f4]">
              Three Simple Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#4ade80]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#4ade80]/30">
                <span className="text-2xl font-bold text-[#4ade80]">1</span>
              </div>
              <h3 className="text-lg font-medium mb-2 text-[#f0f7f4]">
                Upload Your Data
              </h3>
              <p className="text-[#8ba898] text-sm">
                Import bank statements or manually add transactions. We handle
                the rest.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#4ade80]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#4ade80]/30">
                <span className="text-2xl font-bold text-[#4ade80]">2</span>
              </div>
              <h3 className="text-lg font-medium mb-2 text-[#f0f7f4]">
                See Your Impact
              </h3>
              <p className="text-[#8ba898] text-sm">
                Interactive charts reveal your carbon footprint by category and
                over time.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#4ade80]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#4ade80]/30">
                <span className="text-2xl font-bold text-[#4ade80]">3</span>
              </div>
              <h3 className="text-lg font-medium mb-2 text-[#f0f7f4]">
                Level Up
              </h3>
              <p className="text-[#8ba898] text-sm">
                Follow personalized tips, earn achievements, and watch your
                green score grow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-[#162118] border-y border-[#243328]">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-[#4ade80]">7</p>
              <p className="text-[#8ba898] text-sm mt-1">Categories Tracked</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-[#4ade80]">
                15+
              </p>
              <p className="text-[#8ba898] text-sm mt-1">Achievement Badges</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-[#4ade80]">∞</p>
              <p className="text-[#8ba898] text-sm mt-1">
                Transactions Analyzed
              </p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-[#4ade80]">
                100%
              </p>
              <p className="text-[#8ba898] text-sm mt-1">Free to Use</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#0f1a14]">
        <div className="container mx-auto px-8 text-center">
          <div className="max-w-2xl mx-auto">
            <p className="text-4xl mb-4">🌍</p>
            <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-[#f0f7f4]">
              Every Step Counts
            </h2>
            <p className="text-[#8ba898] mb-8">
              Join a community of mindful individuals making greener choices
              every day. Your journey toward sustainability starts with a single
              step.
            </p>
            <button
              onClick={handleGetStarted}
              className="inline-block bg-[#4ade80] hover:bg-[#22c55e] text-[#0f1a14] font-medium px-8 py-3 rounded-full transition-colors cursor-pointer"
            >
              {isAuthenticated ? "Go to Dashboard" : "Begin Your Journey"}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#162118] border-t border-[#243328]">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-1">
              <h3 className="text-xl font-semibold text-[#4ade80] mb-3 flex items-center gap-2">
                <span>🌱</span> Carbon Watch
              </h3>
              <p className="text-[#8ba898] text-sm">
                Helping you make mindful choices for a healthier planet.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4 text-[#f0f7f4]">Product</h4>
              <ul className="space-y-2 text-[#8ba898] text-sm">
                <li>
                  <Link
                    href="/dashboard"
                    className="hover:text-[#4ade80] transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/transactions"
                    className="hover:text-[#4ade80] transition-colors"
                  >
                    Transactions
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/insights"
                    className="hover:text-[#4ade80] transition-colors"
                  >
                    Insights
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/progress"
                    className="hover:text-[#4ade80] transition-colors"
                  >
                    Progress
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4 text-[#f0f7f4]">Company</h4>
              <ul className="space-y-2 text-[#8ba898] text-sm">
                <li>
                  <a
                    href="#"
                    className="hover:text-[#4ade80] transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#4ade80] transition-colors"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#4ade80] transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#4ade80] transition-colors"
                  >
                    Press
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4 text-[#f0f7f4]">Legal</h4>
              <ul className="space-y-2 text-[#8ba898] text-sm">
                <li>
                  <a
                    href="#"
                    className="hover:text-[#4ade80] transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#4ade80] transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#4ade80] transition-colors"
                  >
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-[#243328] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[#8ba898]/60 text-sm">
              © 2025 Carbon Watch. Made with 💚 for the planet.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
