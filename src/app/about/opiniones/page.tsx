import BackButton from "@/components/BackButton/BackButton";
import { reviews_list } from "@/helpers/SEO/reviews";
import { Metadata } from "next";
import Script from "next/script";
import { IoMdReturnLeft } from "react-icons/io";

/* =========================
   SEO METADATA
========================= */
export const metadata: Metadata = {
  title: "Opiniones de Usuarios | I attend",
  description:
    "Conoce las opiniones reales de quienes han organizado sus eventos con I attend. Experiencias sobre invitaciones digitales, gestión de invitados y confirmaciones.",
};

/* =========================
   PAGE COMPONENT
========================= */
export default function ReviewsPage() {
  const reviewsSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "I attend",
    applicationCategory: "EventManagementApplication",
    operatingSystem: "Web",
    review: reviews_list.map((review) => ({
      "@type": "Review",
      reviewBody: review.review,
      author: {
        "@type": "Person",
        name: review.name,
      },
      reviewRating: review.review
        ? {
          "@type": "Rating",
          ratingValue: review.name,
          bestRating: "5",
        }
        : undefined,
    })),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5",
      reviewCount: reviews_list.length,
    },
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', flexDirection: 'column',
      maxHeight: '100vh', overflow: 'auto', width: '100%'
    }}>
      {/* =========================
          REVIEWS SCHEMA (JSON-LD)
      ========================= */}
      <Script
        id="reviews-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(reviewsSchema),
        }}
      />

      {/* =========================
          REVIEWS CONTENT
      ========================= */}
      <div className="seo_second_container">
        <section className="seo_container" id="invitacion-reviews">

          <div className="action_wrap">
            <BackButton></BackButton>
          </div>
          <h1>Opiniones de quienes ya usan I attend</h1>

          <p>
            Estas son algunas experiencias reales de personas que han organizado
            sus eventos utilizando <strong>I attend</strong>.
          </p>

          {reviews_list.map((review, index) => (
            <article key={index}>
              <blockquote>“{review.review}”</blockquote>
              <p>
                <strong>{review.name}</strong>
              </p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
