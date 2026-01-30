'use client';

import React from 'react';

export interface ReputationBadgeProps {
  reputation: number;
  completedJobs: number;
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
}

function getReputationBadgeEmoji(category: string): string {
  const badges: Record<string, string> = {
    TOP_RATED: '⭐',
    RELIABLE: '✓',
    NEEDS_IMPROVEMENT: '⚠️',
    NEW: '🆕',
  };
  return badges[category] || '📊';
}

const ReputationLevelConfig = {
  TOP_RATED: {
    name: 'Top Rated',
    minReputation: 20,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    description: 'Excellent worker with outstanding service record',
  },
  RELIABLE: {
    name: 'Reliable',
    minReputation: 5,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'Consistently good performance',
  },
  NEEDS_IMPROVEMENT: {
    name: 'Needs Improvement',
    minReputation: 0,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Building experience and reputation',
  },
  LOW: {
    name: 'Low Reputation',
    minReputation: -50,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: 'Limited availability for bookings',
  },
  NEW: {
    name: 'New Worker',
    minReputation: 0,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: 'New worker - building reputation',
  },
};

function getCategoryForReputation(reputation: number, completedJobs: number) {
  if (completedJobs === 0) return 'NEW';
  if (reputation >= 20) return 'TOP_RATED';
  if (reputation >= 5) return 'RELIABLE';
  if (reputation >= 0) return 'NEEDS_IMPROVEMENT';
  return 'LOW';
}

export function ReputationBadge({
  reputation,
  completedJobs,
  showDetails = true,
  size = 'medium',
}: ReputationBadgeProps) {
  const category = getCategoryForReputation(reputation, completedJobs) as keyof typeof ReputationLevelConfig;
  const config = ReputationLevelConfig[category];
  const emoji = getReputationBadgeEmoji(category === 'TOP_RATED' ? 'TOP_RATED' : 
                                       category === 'RELIABLE' ? 'RELIABLE' : 
                                       category === 'NEW' ? 'NEW' : 'NEEDS_IMPROVEMENT');

  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-2 text-sm',
    large: 'px-4 py-3 text-base',
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border ${config.borderColor} ${config.bgColor} ${sizeClasses[size]}`}
      title={`${config.name}: ${config.description}`}
    >
      <span className="text-lg">{emoji}</span>
      <div className="flex flex-col">
        <span className={`font-semibold ${config.color}`}>{config.name}</span>
        {showDetails && (
          <span className="text-xs text-gray-600">
            {reputation} pts • {completedJobs} jobs
          </span>
        )}
      </div>
    </div>
  );
}

export function ReputationIndicator({
  reputation,
  completedJobs,
  showPercent = true,
}: {
  reputation: number;
  completedJobs: number;
  showPercent?: boolean;
}) {
  // Map reputation range to 0-100 percentage
  // Reputation range: -50 to 100, so range is 150 points
  const normalizedReputation = Math.max(0, reputation + 50); // 0-150
  const percentage = (normalizedReputation / 150) * 100;
  const displayPercent = Math.max(0, Math.min(100, percentage));

  const getBarColor = () => {
    if (displayPercent >= 80) return 'bg-green-500';
    if (displayPercent >= 50) return 'bg-yellow-500';
    if (displayPercent >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">Reputation Score</span>
        {showPercent && <span className="text-sm font-medium text-gray-700">{displayPercent.toFixed(0)}%</span>}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getBarColor()}`}
          style={{ width: `${displayPercent}%` }}
        />
      </div>
      <p className="text-xs text-gray-600 mt-1">
        Score: {reputation} • Completed: {completedJobs} jobs
      </p>
    </div>
  );
}

export function ReputationCard({
  workerId,
  reputation,
  completedJobs,
  category,
}: {
  workerId: string;
  reputation: number;
  completedJobs: number;
  category: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Reputation & Reviews</h3>
      
      <div className="space-y-4">
        <ReputationBadge
          reputation={reputation}
          completedJobs={completedJobs}
          size="large"
        />

        <ReputationIndicator
          reputation={reputation}
          completedJobs={completedJobs}
        />

        <div className="text-xs text-gray-600 space-y-1 pt-2 border-t border-gray-100">
          <p>• <strong>Reputation Score:</strong> +1 for each completed job, -1 for no-shows</p>
          <p>• <strong>Max Score:</strong> +100 (Top Rated workers)</p>
          <p>• <strong>Booking Restriction:</strong> Below -5 points</p>
          <p>• <strong>Categories:</strong> New (0 jobs) → Top Rated (20+ points)</p>
        </div>
      </div>
    </div>
  );
}
