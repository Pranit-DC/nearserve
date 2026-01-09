"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FiCalendar,
  FiMapPin,
  FiFileText,
  FiCheck,
} from "react-icons/fi";
import ToolbarExpandable from "@/components/ui/toolbar-expandable";
import { FaRupeeSign } from "react-icons/fa";
import SmartDateTimePicker from "@/components/ui/smart-date-time-picker";
import OpenStreetMapInput from "@/components/ui/openstreetmap-input";
import { X as XIcon, AlertCircle as AlertCircleIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ClickSpark from "@/components/ClickSpark";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Props = {
  workerId: string;
  className?: string;
  minimumFee?: number | null;
  workerName?: string | null;
};

export default function BookWorkerButton({
  workerId,
  className,
  minimumFee,
  workerName,
}: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string>("job-details");

  // Single source of truth for all form data
  const [booking, setBooking] = useState({
    description: "",
    details: "",
    datetime: "",
    location: "",
    locationLat: "",
    locationLng: "",
    charge: "",
  });

  // Track which steps are completed
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Effect to cleanup body scroll on unmount
  React.useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Geolocation badge component
  function GeoBadge() {
    const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
      "idle"
    );
    const [label, setLabel] = useState("Use current location");

    const handleGeolocate = async () => {
      if (!navigator.geolocation) {
        setStatus("error");
        setLabel("Geolocation unavailable");
        return;
      }

      setStatus("loading");
      setLabel("Locating…");

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          let locationText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

          try {
            const resp = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
            );
            if (resp.ok) {
              const data = await resp.json();
              if (data.display_name) {
                locationText = data.display_name;
                setLabel(data.display_name.split(",").slice(0, 2).join(", "));
              }
            }
          } catch (e) {
            console.warn("Reverse geocoding failed", e);
          }

          setBooking((prev) => ({
            ...prev,
            location: locationText,
            locationLat: String(lat),
            locationLng: String(lng),
          }));
          setStatus("done");
        },
        (err) => {
          setStatus("error");
          setLabel("Permission denied");
          console.error("Geolocation error", err);
        },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    };

    return (
      <button
        type="button"
        onClick={handleGeolocate}
        disabled={status === "loading"}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
          status === "done"
            ? "bg-green-50 border-green-300 text-green-700"
            : "bg-white border-gray-300 hover:border-blue-400 text-gray-700 hover:text-blue-600"
        } ${status === "loading" ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <FiMapPin className="w-4 h-4" />
        <span className="text-sm font-medium">{label}</span>
      </button>
    );
  }

  // Validation for current step
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case "job-details":
        if (!booking.description || booking.description.trim().length < 3) {
          setError("Please enter a job title (at least 3 characters)");
          return false;
        }
        break;
      case "schedule":
        if (!booking.datetime) {
          setError("Please select date and time");
          return false;
        }
        const dt = new Date(booking.datetime);
        if (isNaN(dt.getTime())) {
          setError("Invalid date/time selected");
          return false;
        }
        if (dt.getTime() <= Date.now()) {
          setError("Please choose a future date and time");
          return false;
        }
        break;
      case "location":
        if (!booking.location || booking.location.trim().length === 0) {
          setError("Please enter or select a location");
          return false;
        }
        break;
      case "pricing":
        const charge = Number(booking.charge);
        if (!booking.charge || charge <= 0) {
          setError("Please enter a valid price greater than 0");
          return false;
        }
        // Check if charge is less than worker's minimum fee
        if (minimumFee && charge < minimumFee) {
          const workerDisplayName = workerName || "This worker";
          toast.error(`Budget too low!`, {
            description: `${workerDisplayName} has a minimum job fee of ₹${minimumFee}. Please enter at least ₹${minimumFee}.`,
            duration: 5000,
          });
          setError(`Minimum job fee: ₹${minimumFee}`);
          return false;
        }
        break;
    }
    setError(null);
    return true;
  };

  // Validate all required fields are complete
  const validateAllFields = (): boolean => {
    if (!booking.description || booking.description.trim().length < 3) {
      setError("Please enter a job title");
      setCurrentStep("job-details");
      return false;
    }
    if (!booking.datetime) {
      setError("Please select date and time");
      setCurrentStep("schedule");
      return false;
    }
    if (!booking.location || booking.location.trim().length === 0) {
      setError("Please select a location");
      setCurrentStep("location");
      return false;
    }
    const charge = Number(booking.charge);
    if (!booking.charge || charge <= 0) {
      setError("Please enter a valid price");
      setCurrentStep("pricing");
      return false;
    }
    return true;
  };

  // Check if user can navigate to a step (must complete previous steps)
  const canNavigateToStep = (targetStepId: string): boolean => {
    const stepOrder = ["job-details", "schedule", "location", "pricing"];
    const targetIndex = stepOrder.indexOf(targetStepId);
    
    // Can always go to first step
    if (targetIndex === 0) return true;
    
    // Check all previous steps are completed
    for (let i = 0; i < targetIndex; i++) {
      if (!completedSteps.has(stepOrder[i])) {
        setError(`Please complete ${stepOrder[i].replace('-', ' ')} first`);
        return false;
      }
    }
    return true;
  };

  // Navigate to next step
  const handleNext = () => {
    if (!validateCurrentStep()) return;

    // Mark current step as completed
    setCompletedSteps((prev) => new Set([...prev, currentStep]));

    const stepOrder = ["job-details", "schedule", "location", "pricing"];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
      setError(null);
    }
  };

  // Navigate to previous step
  const handlePrevious = () => {
    const stepOrder = ["job-details", "schedule", "location", "pricing"];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
      setError(null);
    }
  };

  // Submit booking
  const handleSubmit = async () => {
    // Validate current step first
    if (!validateCurrentStep()) return;
    
    // Then validate ALL fields are complete
    if (!validateAllFields()) return;

    setLoading(true);
    setError(null);

    try {
      console.log("Creating booking:", { workerId, ...booking });

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId,
          description: booking.description,
          details: booking.details,
          datetime: booking.datetime,
          location: booking.location,
          charge: Number(booking.charge),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle usage limit exceeded (403)
        if (res.status === 403) {
          const isLimitError =
            data.error?.toLowerCase().includes("limit") ||
            data.error?.toLowerCase().includes("exceeded") ||
            data.details?.toLowerCase().includes("limit") ||
            data.details?.toLowerCase().includes("exceeded");

          if (isLimitError) {
            // Close dialog first
            closeDialog();
            resetForm();

            // Show toast notification
            toast.error("Monthly booking limit reached!", {
              description:
                "Upgrade to continue booking workers. Redirecting to pricing...",
              duration: 4000,
            });

            // Redirect to pricing page after a brief delay
            setTimeout(() => {
              router.push("/pricing");
            }, 2000);

            return; // Exit early to avoid further error handling
          }
        }

        const errorMsg = data.details
          ? `${data.error}: ${data.details}`
          : data.error || `Failed to create booking (status ${res.status})`;
        throw new Error(errorMsg);
      }

      console.log("Booking created successfully:", data);

      // Success! Show success toast and navigate to bookings page
      toast.success("Booking request sent!", {
        description: "The worker will confirm your booking soon.",
      });

      closeDialog();
      resetForm();
      window.location.href = "/customer/bookings";
    } catch (err: unknown) {
      console.error("Booking error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setBooking({
      description: "",
      details: "",
      datetime: "",
      location: "",
      locationLat: "",
      locationLng: "",
      charge: "",
    });
    setCurrentStep("job-details");
    setCompletedSteps(new Set());
    setError(null);
  };

  // Open dialog and prevent body scroll
  const openDialog = () => {
    if (!user) {
      window.location.href = "/sign-in";
      return;
    }
    resetForm();
    setOpen(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  };

  // Close dialog and restore body scroll
  const closeDialog = () => {
    setOpen(false);
    document.body.style.overflow = 'unset';
  };

  // Effect to cleanup body scroll on unmount
  React.useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <>
      <ClickSpark sparkColor="#60a5fa" sparkCount={10} sparkRadius={20}>
        <Button
          onClick={openDialog}
          className={`${
            className ?? ""
          } bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all`}
        >
          Book
        </Button>
      </ClickSpark>

      {/* Portal for full-screen modal */}
      {open && typeof window !== 'undefined' && createPortal(
        <>
          {/* Overlay backdrop - full screen blur */}
          <div
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
            onClick={closeDialog}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          />

          {/* ToolbarExpandable as main popup - prevent body scroll */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none animate-in fade-in zoom-in-95 duration-200" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            <div
              className="pointer-events-auto w-full max-w-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Error Display - floating above */}
              {error && (
                <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2 shadow-lg animate-in slide-in-from-top-2 duration-200">
                  <AlertCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                    {error}
                  </p>
                </div>
              )}

              <ToolbarExpandable
                steps={[
                  {
                    id: "job-details",
                    title: "Job Details",
                    description: "What work needs to be done",
                    icon: FiFileText,
                    content: (
                      <div className="space-y-4 sm:space-y-6">
                        <div>
                          <label
                            htmlFor="description"
                            className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5 sm:mb-2"
                          >
                            Job Title <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="description"
                            value={booking.description}
                            onChange={(e) =>
                              setBooking({ ...booking, description: e.target.value })
                            }
                            placeholder="e.g., Fix leaking kitchen sink"
                            className="text-sm sm:text-base py-3 sm:py-4 md:py-6"
                            autoFocus={currentStep === "job-details"}
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 sm:mt-1.5">
                            Briefly describe the work you need done
                          </p>
                        </div>

                        <div>
                          <label
                            htmlFor="details"
                            className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5 sm:mb-2"
                          >
                            Additional Details (Optional)
                          </label>
                          <Textarea
                            id="details"
                            value={booking.details}
                            onChange={(e) =>
                              setBooking({ ...booking, details: e.target.value })
                            }
                            placeholder="Add any specific requirements, materials needed, or other context..."
                            rows={4}
                            className="resize-none text-sm"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 sm:mt-1.5">
                            Provide more context to help the worker prepare
                          </p>
                        </div>

                        {/* Step Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                          <Button
                            type="button"
                            onClick={closeDialog}
                            variant="ghost"
                            size="sm"
                            disabled={loading}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            onClick={handleNext}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Next: Schedule
                          </Button>
                        </div>
                      </div>
                    ),
                  },
                  {
                    id: "schedule",
                    title: "Schedule",
                    description: "When you need it",
                    icon: FiCalendar,
                    content: (
                      <div className="space-y-4 sm:space-y-6">
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5 sm:mb-2">
                            When do you need this done?{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <SmartDateTimePicker
                            value={
                              booking.datetime
                                ? new Date(booking.datetime)
                                : undefined
                            }
                            onChange={(date: Date) =>
                              setBooking({ ...booking, datetime: date.toISOString() })
                            }
                            className="w-full"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Type naturally (e.g., &ldquo;tomorrow at 2pm&rdquo;) or
                            use the calendar picker
                          </p>
                        </div>

                        <div className="p-3 sm:p-4 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/50 rounded-lg">
                          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                            <strong>💡 Tip:</strong> The worker will confirm
                            availability. Flexible timing increases chances of
                            acceptance.
                          </p>
                        </div>

                        {/* Step Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              onClick={handlePrevious}
                              variant="outline"
                              size="sm"
                              disabled={loading}
                            >
                              Previous
                            </Button>
                            <Button
                              type="button"
                              onClick={closeDialog}
                              variant="ghost"
                              size="sm"
                              disabled={loading}
                            >
                              Cancel
                            </Button>
                          </div>
                          <Button
                            type="button"
                            onClick={handleNext}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Next: Location
                          </Button>
                        </div>
                      </div>
                    ),
                  },
                  {
                    id: "location",
                    title: "Location",
                    description: "Where the work is",
                    icon: FiMapPin,
                    content: (
                      <div className="space-y-4 sm:space-y-6">
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5 sm:mb-2">
                            Work Location <span className="text-red-500">*</span>
                          </label>
                          <OpenStreetMapInput
                            onSelect={(sel) => {
                              const display = sel?.displayName || "";
                              const lat = sel?.coords?.lat || "";
                              const lng = sel?.coords?.lng || "";
                              setBooking({
                                ...booking,
                                location: display,
                                locationLat: String(lat),
                                locationLng: String(lng),
                              });
                            }}
                            inputClassName="text-base py-6"
                          />
                          {booking.location && (
                            <div className="mt-2 p-3 bg-green-50/50 dark:bg-green-950/30 border border-green-200/50 dark:border-green-800/50 rounded-md">
                              <p className="text-sm text-green-800 dark:text-green-200">
                                {booking.location}
                              </p>
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-3">
                            Or use your current location:
                          </p>
                          <GeoBadge />
                        </div>

                        {/* Step Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              onClick={handlePrevious}
                              variant="outline"
                              size="sm"
                              disabled={loading}
                            >
                              Previous
                            </Button>
                            <Button
                              type="button"
                              onClick={closeDialog}
                              variant="ghost"
                              size="sm"
                              disabled={loading}
                            >
                              Cancel
                            </Button>
                          </div>
                          <Button
                            type="button"
                            onClick={handleNext}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Next: Pricing
                          </Button>
                        </div>
                      </div>
                    ),
                  },
                  {
                    id: "pricing",
                    title: "Pricing",
                    description: "Your proposed budget",
                    icon: FaRupeeSign,
                    content: (
                      <div className="space-y-4 sm:space-y-6">
                        <div>
                          <label
                            htmlFor="charge"
                            className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5 sm:mb-2"
                          >
                            Your Proposed Budget (₹){" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
                              ₹
                            </span>
                            <Input
                              id="charge"
                              type="number"
                              step="0.01"
                              min="0"
                              value={booking.charge}
                              onChange={(e) =>
                                setBooking({ ...booking, charge: e.target.value })
                              }
                              placeholder="500"
                              className="pl-10 py-6 text-lg"
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                            You can negotiate the final price with the worker
                          </p>
                        </div>

                        {/* Review Summary */}
                        <div className="mt-4 sm:mt-6 md:mt-8 p-4 sm:p-6 bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-gray-800 rounded-lg">
                          <h4 className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 sm:mb-4">
                            Booking Summary
                          </h4>
                          <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Job:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {booking.description || "Not set"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">When:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {booking.datetime
                                  ? new Date(booking.datetime).toLocaleString()
                                  : "Not set"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Location:</span>
                              <span className="font-medium text-gray-900 dark:text-white text-right max-w-xs truncate">
                                {booking.location || "Not set"}
                              </span>
                            </div>
                            <div className="flex justify-between pt-2 sm:pt-3 border-t border-gray-300">
                              <span className="text-gray-600 font-semibold text-xs sm:text-sm">
                                Proposed Price:
                              </span>
                              <span className="font-bold text-blue-600 text-base sm:text-lg">
                                ₹{booking.charge || "0"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Step Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              onClick={handlePrevious}
                              variant="outline"
                              size="sm"
                              disabled={loading}
                            >
                              Previous
                            </Button>
                            <Button
                              type="button"
                              onClick={closeDialog}
                              variant="ghost"
                              size="sm"
                              disabled={loading}
                            >
                              Cancel
                            </Button>
                          </div>
                          <ClickSpark
                            sparkColor="#22c55e"
                            sparkCount={12}
                            sparkRadius={25}
                          >
                            <Button
                              type="button"
                              onClick={handleSubmit}
                              disabled={loading}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md"
                            >
                              {loading ? "Creating..." : "Confirm & Book"}
                            </Button>
                          </ClickSpark>
                        </div>
                      </div>
                    ),
                  },
                ]}
                activeStep={currentStep}
                onActiveStepChange={(stepId) => {
                  if (stepId && canNavigateToStep(stepId)) {
                    setCurrentStep(stepId);
                    setError(null);
                  }
                }}
                expanded={true}
                className="max-w-full"
              />
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
