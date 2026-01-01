import * as React from "react";

interface ReviewStatus {
  status: "reviewed" | "flagged" | "skipped";
  reviewedAt: Date;
}

type ReviewMap = Record<number, ReviewStatus>;

interface UseConversationReviewsReturn {
  reviews: ReviewMap;
  isLoading: boolean;
  markAsReviewed: (
    conversationId: number,
    status?: ReviewStatus["status"],
  ) => Promise<void>;
  resetReview: (conversationId: number) => Promise<void>;
  isReviewed: (conversationId: number) => boolean;
  getReviewStatus: (conversationId: number) => ReviewStatus | undefined;
}

export function useConversationReviews(
  conversationIds: number[],
): UseConversationReviewsReturn {
  const [reviews, setReviews] = React.useState<ReviewMap>({});
  const [isLoading, setIsLoading] = React.useState(false);
  const fetchedRef = React.useRef<Set<number>>(new Set());

  // 批量获取审核状态
  React.useEffect(() => {
    const idsToFetch = conversationIds.filter(
      (id) => !fetchedRef.current.has(id),
    );

    if (idsToFetch.length === 0) return;

    const fetchReviews = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/conversations/reviews?ids=${idsToFetch.join(",")}`,
        );
        if (res.ok) {
          const data = (await res.json()) as ReviewMap;
          setReviews((prev) => ({ ...prev, ...data }));
          idsToFetch.forEach((id) => {
            fetchedRef.current.add(id);
          });
        }
      } catch (error) {
        console.error("Failed to fetch review statuses:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [conversationIds]);

  const markAsReviewed = React.useCallback(
    async (
      conversationId: number,
      status: ReviewStatus["status"] = "reviewed",
    ) => {
      try {
        const res = await fetch("/api/conversations/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, status }),
        });

        if (res.ok) {
          setReviews((prev) => ({
            ...prev,
            [conversationId]: {
              status,
              reviewedAt: new Date(),
            },
          }));
        }
      } catch (error) {
        console.error("Failed to mark as reviewed:", error);
      }
    },
    [],
  );

  const resetReview = React.useCallback(async (conversationId: number) => {
    try {
      const res = await fetch(
        `/api/conversations/reviews?conversationId=${conversationId}`,
        { method: "DELETE" },
      );

      if (res.ok) {
        setReviews((prev) => {
          const next = { ...prev };
          delete next[conversationId];
          return next;
        });
        fetchedRef.current.delete(conversationId);
      }
    } catch (error) {
      console.error("Failed to reset review:", error);
    }
  }, []);

  const isReviewed = React.useCallback(
    (conversationId: number) => {
      return !!reviews[conversationId];
    },
    [reviews],
  );

  const getReviewStatus = React.useCallback(
    (conversationId: number) => {
      return reviews[conversationId];
    },
    [reviews],
  );

  return {
    reviews,
    isLoading,
    markAsReviewed,
    resetReview,
    isReviewed,
    getReviewStatus,
  };
}
