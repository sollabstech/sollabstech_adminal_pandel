"use client";

import { useState } from "react";

const reviewsData = [
  { id: 1, name: "Rahul Sharma", city: "Mumbai", type: "software", rating: 5, review: "Excellent work on our e-commerce platform!", status: "published", date: "28 Jul" },
  { id: 2, name: "Priya Mehta", city: "Bangalore", type: "software", rating: 5, review: "Flutter app got 10k downloads in first month.", status: "published", date: "25 Jul" },
  { id: 3, name: "Arun Kumar", city: "Chennai", type: "laptop", rating: 5, review: "Dell XPS in perfect condition. Fast delivery!", status: "pending", date: "22 Jul" },
  { id: 4, name: "Sneha Patel", city: "Ahmedabad", type: "laptop", rating: 4, review: "Great gaming PC at good price.", status: "published", date: "20 Jul" },
  { id: 5, name: "Vikash Singh", city: "Delhi", type: "software", rating: 5, review: "CRM automated 70% of our manual work.", status: "pending", date: "18 Jul" },
];

export default function ReviewsPage() {
  const [reviews, setReviews] = useState(reviewsData);

  const toggleStatus = (id: number) => {
    setReviews((prev) => prev.map((r) =>
      r.id === id ? { ...r, status: r.status === "published" ? "pending" : "published" } : r
    ));
  };

  const deleteReview = (id: number) => {
    if (confirm("Delete this review?")) setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div style={{ padding: "32px 28px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "white" }}>Reviews</h1>
        <p style={{ fontSize: 13, color: "#475569" }}>
          {reviews.filter((r) => r.status === "published").length} published · {reviews.filter((r) => r.status === "pending").length} pending
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {reviews.map((review) => (
          <div key={review.id} className="card" style={{ padding: "18px 20px", display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "linear-gradient(135deg, #0066FF, #00AAFF)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 14, color: "white", flexShrink: 0,
            }}>{review.name.split(" ").map((n) => n[0]).join("")}</div>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "white" }}>{review.name}</span>
                  <span style={{ fontSize: 12, color: "#334155", marginLeft: 8 }}>{review.city} · {review.date}</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <span className={`badge ${review.type === "software" ? "badge-blue" : "badge-green"}`}>{review.type}</span>
                  <span className={`badge ${review.status === "published" ? "badge-green" : "badge-yellow"}`}>{review.status}</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 1, marginBottom: 6 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} style={{ color: i < review.rating ? "#FFC107" : "#1E293B", fontSize: 13 }}>★</span>
                ))}
              </div>

              <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>&ldquo;{review.review}&rdquo;</p>

              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className={`btn-sm ${review.status === "published" ? "btn-red" : "btn-green"}`}
                  onClick={() => toggleStatus(review.id)}>
                  {review.status === "published" ? "Unpublish" : "Publish"}
                </button>
                <button className="btn-sm btn-red" onClick={() => deleteReview(review.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
