"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Leaf } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1a14] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#22c55e]/30 border-t-[#22c55e] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1a14] text-[#f0f7f4] flex flex-col">
      {/* Simple Header */}
      <header className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#22c55e] rounded-lg flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-[#f0f7f4]">
            Carbon Watch
          </span>
        </div>
      </header>

      {/* Hero - Single Focus */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-xl">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-full mb-6">
              <Leaf className="w-4 h-4 text-[#22c55e]" />
              <span className="text-[#22c55e] text-sm font-medium">
                Track Your Impact
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Upload Bank Statement.
              <br />
              <span className="text-[#22c55e]">See Carbon Impact.</span>
            </h1>

            <p className="text-[#8ba898] text-lg max-w-md mx-auto">
              Automatically calculate your carbon footprint from everyday
              spending. Simple. Instant. Actionable.
            </p>
          </div>

          <button
            onClick={handleGetStarted}
            className="inline-flex items-center gap-2 bg-[#22c55e] hover:bg-[#16a34a] text-[#0f1a14] font-semibold px-8 py-4 rounded-full transition-colors text-lg"
          >
            {isAuthenticated ? "Go to Dashboard" : "Get Started"}
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>

          {!isAuthenticated && (
            <p className="mt-4 text-[#8ba898] text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-[#22c55e] hover:underline">
                Sign in
              </Link>
            </p>
          )}

          {/* Simple 3-step visual */}
          <div className="mt-16 flex items-center justify-center gap-4 text-sm text-[#8ba898]">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-[#22c55e]/20 text-[#22c55e] rounded-full flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span>Upload</span>
            </div>
            <div className="w-8 h-px bg-[#2a3f30]" />
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-[#22c55e]/20 text-[#22c55e] rounded-full flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>Analyze</span>
            </div>
            <div className="w-8 h-px bg-[#2a3f30]" />
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-[#22c55e]/20 text-[#22c55e] rounded-full flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>Improve</span>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="p-6 text-center text-[#8ba898]/60 text-sm">
        © 2025 Carbon Watch
      </footer>
    </div>
  );
}
