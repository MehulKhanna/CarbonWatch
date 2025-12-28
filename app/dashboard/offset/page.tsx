"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, Heart, Leaf } from "lucide-react";

const ngos = [
  {
    name: "Sankalptaru",
    url: "https://sankalptaru.org",
    description:
      "Plants native trees across India with GPS tracking and farmer partnerships.",
  },
  {
    name: "Grow-Trees",
    url: "https://www.grow-trees.com",
    description:
      "Enables tree plantation across India with verified environmental impact.",
  },
  {
    name: "Gold Standard",
    url: "https://www.goldstandard.org",
    description:
      "Certifies high-quality carbon offset projects worldwide with rigorous standards.",
  },
  {
    name: "Atmosfair",
    url: "https://www.atmosfair.de/en",
    description:
      "German non-profit focused on offsetting travel emissions through clean energy projects.",
  },
  {
    name: "The Nature Conservancy - India",
    url: "https://www.nature.org/en-us/about-us/where-we-work/asia-pacific/india/",
    description:
      "Works on forest conservation and sustainable land management across India.",
  },
];

export default function OffsetPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Climate Action Resources
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Organizations working on carbon mitigation
          </p>
        </div>
      </div>

      {/* Important Note */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4">
        <div className="flex gap-3">
          <Leaf className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-medium mb-1">Reduction comes first</p>
            <p className="text-amber-700 dark:text-amber-300">
              The most effective way to address your carbon footprint is to
              reduce emissions at the source. Offsetting can complement — but
              never replace — meaningful lifestyle changes.
            </p>
          </div>
        </div>
      </div>

      {/* What is Carbon Offsetting */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          What is carbon offsetting?
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
          Carbon offsetting involves funding projects that reduce or remove
          greenhouse gases from the atmosphere — such as reforestation,
          renewable energy, or methane capture — to balance out emissions you
          can&apos;t eliminate. While not a perfect solution, verified offset
          programs can contribute to global climate action when combined with
          personal emission reductions.
        </p>
      </section>

      {/* NGO List */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Credible organizations
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          These NGOs work on verified climate and reforestation projects. We
          encourage you to research before donating.
        </p>

        <div className="space-y-3">
          {ngos.map((ngo) => (
            <a
              key={ngo.name}
              href={ngo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors group"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {ngo.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {ngo.description}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 shrink-0 mt-1 transition-colors" />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <div className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          <strong className="text-gray-600 dark:text-gray-300">
            Disclaimer:
          </strong>{" "}
          Carbon Watch does not process donations or receive any funds. All
          links direct you to external websites managed by the respective
          organizations. We are not affiliated with these NGOs and cannot
          guarantee how donations are used. Please do your own research before
          contributing.
        </p>
      </div>

      {/* Subtle footer */}
      <div className="text-center pt-4">
        <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1">
          <Heart className="w-3 h-3" />
          Every action counts
        </p>
      </div>
    </div>
  );
}
