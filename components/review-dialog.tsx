"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { FiStar } from "react-icons/fi";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  jobId: string | null;
  onSubmitted: () => void;
}

export function ReviewDialog({
  open,
  onOpenChange,
  jobId,
  onSubmitted,
}: ReviewDialogProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const stars = [1, 2, 3, 4, 5];

  const submit = async () => {
    if (!jobId || rating < 1) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          rating,
          comment: comment.trim() || undefined,
        }),
      });
      if (res.ok) {
        onOpenChange(false);
        setRating(0);
        setComment("");
        onSubmitted();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onOpenChange(false);
      setRating(0);
      setComment("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-[#181B20] dark:bg-[#181B20] border border-[#23262F] shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-white">
            Share Your Experience
          </DialogTitle>
          <p className="text-sm text-gray-400 mt-1">
            Help us improve by rating this job
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating Section */}
          <div>
            <label className="text-sm font-medium text-white flex items-center gap-1 mb-3">
              Rating
              <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              {stars.map((s) => (
                <motion.button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`h-11 w-11 rounded-lg flex items-center justify-center transition-all duration-200 border-2 font-semibold ${
                    s <= rating
                      ? "bg-[#23262F] border-blue-500 text-blue-400 shadow-md"
                      : "bg-[#23262F] border-[#23262F] text-gray-500 hover:border-blue-700 hover:text-blue-400"
                  }`}
                  title={`Rate ${s} stars`}
                >
                  <FiStar
                    className={`h-5 w-5 ${s <= rating ? "fill-current" : ""}`}
                  />
                </motion.button>
              ))}
            </div>
            {rating < 1 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500 dark:text-red-400 mt-2"
              >
                Please select at least 1 star
              </motion.div>
            )}
            {rating > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-gray-400 mt-2"
              >
                You rated this job <strong>{rating}</strong> star
                {rating !== 1 ? "s" : ""}
              </motion.div>
            )}
          </div>

          {/* Comment Section */}
          <div>
            <label className="text-sm font-medium text-white block mb-2">
              Comment{" "}
              <span className="text-gray-500 dark:text-gray-400">
                (optional)
              </span>
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your feedback about the work quality, professionalism, and overall experience..."
              className="bg-[#23262F] border-[#23262F] text-white placeholder-gray-500 resize-none focus:ring-blue-500"
              rows={4}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">
              {comment.length}/500 characters
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[#23262F]">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={submitting}
            className="border-[#23262F] text-gray-300 hover:bg-[#23262F]"
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={submitting || rating < 1}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md"
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </div>
            ) : (
              "Submit Review"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
