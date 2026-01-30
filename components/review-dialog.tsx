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
import { FiStar, FiCheck, FiClock, FiX } from "react-icons/fi";
import { toast } from "sonner";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  jobId: string | null;
  onSubmitted: () => void;
  jobDescription?: string;
}

export function ReviewDialog({
  open,
  onOpenChange,
  jobId,
  onSubmitted,
  jobDescription,
}: ReviewDialogProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [reputationAssessment, setReputationAssessment] = useState<"ON_TIME" | "LATE" | "NO_SHOW" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const stars = [1, 2, 3, 4, 5];

  const getReputationPoints = (assessment: "ON_TIME" | "LATE" | "NO_SHOW" | null): number => {
    if (!assessment) return 0;
    return assessment === "ON_TIME" ? 1 : assessment === "LATE" ? 0 : -1;
  };

  const getReputationLabel = (assessment: "ON_TIME" | "LATE" | "NO_SHOW" | null): string => {
    if (!assessment) return "Not selected";
    return assessment === "ON_TIME" ? "Came on time (+1)" : assessment === "LATE" ? "Came late (0)" : "Didn't come (-1)";
  };

  const submit = async () => {
    if (!jobId || rating < 1 || !reputationAssessment) {
      toast.error("Please complete all required fields");
      return;
    }
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
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to submit review");
        setSubmitting(false);
        return;
      }

      // Submit reputation assessment separately
      const repRes = await fetch("/api/reputation/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          assessmentType: reputationAssessment,
        }),
      });

      if (repRes.ok) {
        toast.success("Review and reputation assessment submitted!");
        onOpenChange(false);
        setRating(0);
        setComment("");
        setReputationAssessment(null);
        onSubmitted();
      } else {
        const data = await repRes.json();
        toast.error(data.error || "Failed to submit reputation assessment");
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("An error occurred while submitting");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onOpenChange(false);
      setRating(0);
      setComment("");
      setReputationAssessment(null);
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
          {/* Service Category Display */}
          {jobDescription && (
            <div className="p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
              <p className="text-xs font-medium text-gray-400 mb-1">Service Category</p>
              <p className="text-sm font-semibold text-blue-400">{jobDescription}</p>
            </div>
          )}

          {/* Rating Section */}
          <div>
            <label className="text-sm font-medium text-white flex items-center gap-1 mb-3">
              Quality Rating
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

          {/* Reputation Assessment Section */}
          <div className="space-y-3 p-4 bg-[#1f2937] rounded-xl border border-[#374151]">
            <div>
              <label className="text-sm font-medium text-white flex items-center gap-2 mb-1">
                Worker Attendance
                <span className="text-red-500">*</span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                  Reputation Score
                </span>
              </label>
              <p className="text-xs text-gray-400 mb-3">
                Did the worker arrive as scheduled?
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "ON_TIME" as const, label: "Came on time", icon: FiCheck, color: "green", points: "+1" },
                { value: "LATE" as const, label: "Came late", icon: FiClock, color: "amber", points: "0" },
                { value: "NO_SHOW" as const, label: "Didn't come", icon: FiX, color: "red", points: "-1" },
              ].map(({ value, label, icon: Icon, color, points }) => (
                <motion.button
                  key={value}
                  type="button"
                  onClick={() => setReputationAssessment(value)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-1 ${
                    reputationAssessment === value
                      ? color === "green"
                        ? "bg-green-500/10 border-green-500 text-green-400"
                        : color === "amber"
                        ? "bg-amber-500/10 border-amber-500 text-amber-400"
                        : "bg-red-500/10 border-red-500 text-red-400"
                      : "bg-[#111827] border-[#374151] text-gray-400 hover:border-gray-500"
                  }`}
                  title={`${label} (${points})`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-semibold">{label}</span>
                  <span className={`text-xs font-bold ${
                    color === "green" ? "text-green-400" : color === "amber" ? "text-amber-400" : "text-red-400"
                  }`}>
                    {points}
                  </span>
                </motion.button>
              ))}
            </div>

            {reputationAssessment && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-gray-300 mt-2 p-2 bg-[#111827] rounded border border-[#374151]"
              >
                <strong>Assessment:</strong> {getReputationLabel(reputationAssessment)}
              </motion.div>
            )}
            {!reputationAssessment && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-400 mt-2"
              >
                Please select worker attendance
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
              rows={3}
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
            disabled={submitting || rating < 1 || !reputationAssessment}
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
