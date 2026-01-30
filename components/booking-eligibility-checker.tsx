/**
 * Worker Booking Eligibility Checker Component
 * Used during booking flow to validate worker eligibility
 */

"use client";

import React from "react";
import { AlertCircle, Check } from "lucide-react";

interface BookingEligibilityProps {
  workerId: string;
  reputation: number;
  isBookable: boolean;
  bookingRestrictionReason?: string;
  onProceed?: () => void;
}

export function BookingEligibilityChecker({
  workerId,
  reputation,
  isBookable,
  bookingRestrictionReason,
  onProceed,
}: BookingEligibilityProps) {
  if (isBookable) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-900">Worker Available</h3>
            <p className="text-sm text-green-800 mt-1">This worker is available for booking with a reputation score of {reputation}.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900">Worker Not Available</h3>
          <p className="text-sm text-red-800 mt-1">{bookingRestrictionReason}</p>
          <p className="text-xs text-red-700 mt-2">
            Current reputation: <strong>{reputation} points</strong>
          </p>

          <div className="mt-3 p-3 bg-red-100 rounded text-xs text-red-900">
            <p className="font-semibold mb-1">Why might a worker have low reputation?</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Multiple no-shows or cancellations</li>
              <li>Poor service quality</li>
              <li>Customer complaints</li>
            </ul>
            <p className="mt-2">
              Workers can improve their reputation by completing jobs successfully and providing excellent service.
            </p>
          </div>

          <button
            onClick={onProceed}
            className="mt-3 w-full px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 transition-colors"
          >
            View Similar Workers
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Alternative Workers Suggester - Recommends similar workers
 */
interface AlternativeWorkersSuggesterProps {
  skill: string;
  currentWorkerInfo?: {
    reputation: number;
    id: string;
  };
  onSelect?: (workerId: string) => void;
}

export function AlternativeWorkersSuggester({
  skill,
  currentWorkerInfo,
  onSelect,
}: AlternativeWorkersSuggesterProps) {
  const [alternatives, setAlternatives] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAlternatives = async () => {
      try {
        const response = await fetch(
          `/api/workers/search?skills=${encodeURIComponent(skill)}&hideIneligible=true&limit=5`
        );
        const data = await response.json();
        setAlternatives(data.workers || []);
      } catch (err) {
        console.error("Error fetching alternatives:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlternatives();
  }, [skill]);

  if (loading) {
    return <div className="text-center py-4 text-gray-500">Loading alternatives...</div>;
  }

  if (alternatives.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-900">No alternative workers available at the moment. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-900">Available Similar Workers</h4>
      {alternatives.map((worker) => (
        <div key={worker.id} className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-semibold text-gray-900">{worker.name}</p>
              <p className="text-sm text-gray-600">{worker.profile?.city}</p>
            </div>
            <span className="text-lg font-bold text-gray-900">{worker.reputation.score}</span>
          </div>

          <div className="flex gap-2 mb-2">
            <span className={`px-2 py-1 text-xs rounded-full font-semibold ${worker.reputation.categoryDisplay.color}`}>
              {worker.reputation.categoryDisplay.label}
            </span>
          </div>

          <button
            onClick={() => onSelect?.(worker.id)}
            className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded font-medium hover:bg-blue-700 transition-colors"
          >
            Select This Worker
          </button>
        </div>
      ))}
    </div>
  );
}
