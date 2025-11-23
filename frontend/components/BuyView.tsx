import React, { useState } from "react";
import { MOCK_LISTINGS } from "../constants";
import { Card } from "./Card";
import { Button } from "./Button";
import {
  Download,
  Lock,
  FileText,
  Image as ImageIcon,
  Box,
} from "lucide-react";

export const Marketplace: React.FC = () => {
  const [filter, setFilter] = useState<"all" | "dataset" | "model" | "image">(
    "all",
  );

  const filteredListings =
    filter === "all"
      ? MOCK_LISTINGS
      : MOCK_LISTINGS.filter((l) => l.category === filter);

  const getIcon = (cat: string) => {
    switch (cat) {
      case "dataset":
        return <FileText className="w-5 h-5" />;
      case "model":
        return <Box className="w-5 h-5" />;
      case "image":
        return <ImageIcon className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-12">
        <h2 className="font-pixel text-5xl mb-4 text-white">DISCOVER DATA</h2>
        <p className="font-mono text-gray-400">
          Explore verified datasets stored on Walrus.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-12 pb-6 border-b border-white/10">
        {["all", "dataset", "model", "image"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat as any)}
            className={`
              font-mono uppercase text-sm px-4 py-2 border transition-all duration-200
              ${
                filter === cat
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-gray-500 border-gray-700 hover:border-white hover:text-white"
              }
            `}
          >
            {cat === "all" ? "All Categories" : cat + "s"}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredListings.map((listing) => (
          <Card
            key={listing.id}
            hoverEffect
            className="flex flex-col h-full bg-zinc-900/50 backdrop-blur-sm"
          >
            {/* Top Bar */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2 text-walrus-cyan border border-walrus-cyan/20 bg-walrus-cyan/5 px-2 py-1 rounded text-xs font-mono uppercase">
                {getIcon(listing.category)}
                <span>{listing.category}</span>
              </div>
              {listing.encrypted && (
                <div className="text-walrus-green flex items-center gap-1 text-xs font-mono uppercase">
                  <Lock className="w-3 h-3" /> Encrypted
                </div>
              )}
            </div>

            {/* Content */}
            <h3
              className="font-mono text-xl font-bold mb-2 text-white line-clamp-1"
              title={listing.name}
            >
              {listing.name}
            </h3>
            <p className="text-gray-400 text-sm mb-6 line-clamp-3 flex-grow">
              {listing.description}
            </p>

            {/* Meta Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-black/30 rounded border border-white/5 font-mono text-xs">
              <div>
                <div className="text-gray-500 mb-1">SIZE</div>
                <div className="text-white">{listing.size}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">AUTHOR</div>
                <div className="text-white truncate">{listing.author}</div>
              </div>
            </div>

            {/* Footer / Buy */}
            <div className="mt-auto flex items-center justify-between gap-4 pt-4 border-t border-white/10">
              <div className="font-pixel text-2xl text-walrus-purple">
                {listing.price}{" "}
                <span className="text-sm font-mono text-gray-500">SUI</span>
              </div>
              <Button size="sm" className="flex-grow">
                Buy License
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
