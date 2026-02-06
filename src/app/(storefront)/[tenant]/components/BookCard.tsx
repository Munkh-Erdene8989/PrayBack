"use client";

import Link from "next/link";
import type { Book } from "@/types";

interface BookCardProps {
  book: Book;
  tenant: string;
}

export function BookCard({ book, tenant }: BookCardProps) {
  const formattedPrice = new Intl.NumberFormat("mn-MN").format(book.price);

  return (
    <Link
      href={`/${tenant}/books/${book.id}`}
      className="group bg-white border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 rounded-xl"
    >
      {/* Cover Image */}
      <div className="aspect-[3/4] bg-gray-50 relative overflow-hidden">
        {book.cover_image_url ? (
          <img
            src={book.cover_image_url}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(145deg, color-mix(in srgb, var(--tenant-primary, #4F46E5) 8%, white), color-mix(in srgb, var(--tenant-secondary, #7C3AED) 8%, white))`,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={0.8}
              stroke="currentColor"
              className="w-14 h-14 text-gray-300"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
              />
            </svg>
          </div>
        )}

        {/* Out of stock overlay */}
        {book.stock <= 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Дууссан
            </span>
          </div>
        )}

        {/* Hover add-to-cart hint */}
        {book.stock > 0 && (
          <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
            <div
              className="mx-2 mb-2 py-2 text-center text-xs font-semibold text-white rounded-lg"
              style={{ backgroundColor: "var(--tenant-primary, #4F46E5)" }}
            >
              Дэлгэрэнгүй үзэх
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
          {book.title}
        </h3>
        <p className="text-xs text-gray-400 mt-1 truncate">{book.author}</p>
        <p
          className="font-bold mt-2 text-sm"
          style={{ color: "var(--tenant-primary, #4F46E5)" }}
        >
          {formattedPrice}₮
        </p>
      </div>
    </Link>
  );
}
