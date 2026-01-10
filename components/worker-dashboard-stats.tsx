"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { CheckCircle, Briefcase } from "lucide-react";
import { FaRupeeSign } from "react-icons/fa";

interface WorkerDashboardStats {
  activeJobs: number;
  completedJobs: number;
  totalEarnings: number;
  pendingJobs: number;
}

export function WorkerDashboardStats() {
  const [stats, setStats] = useState<WorkerDashboardStats>({
    activeJobs: 0,
    completedJobs: 0,
    totalEarnings: 0,
    pendingJobs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/worker/dashboard-stats", {
          cache: "no-store",
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card
            key={i}
            className="p-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#181818] animate-pulse"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="ml-3 space-y-2 flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="p-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#181818]">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Active Jobs
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {stats.activeJobs}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#181818]">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Completed Jobs
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {stats.completedJobs}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#181818]">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <FaRupeeSign className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Earnings
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              ₹{stats.totalEarnings.toFixed(0)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
