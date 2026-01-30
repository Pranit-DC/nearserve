import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BookWorkerButton from "@/components/book-worker-button";
import { adminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { serializeFirestoreData } from "@/lib/firestore-serialization";
import { CustomerDashboardStats } from "@/components/customer-dashboard-stats";
import { getWorkerRating } from "@/lib/reviews";
import {
  Wrench,
  Plug,
  Settings,
  Hammer,
  Paintbrush,
  Sparkles,
  Leaf,
  Car,
  ArrowRight,
  MapPin,
} from "lucide-react";
import { FiStar, FiUser } from "react-icons/fi";

const categories = [
  {
    key: "plumber",
    label: "Plumber",
    icon: Wrench,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950",
  },
  {
    key: "electrician",
    label: "Electrician",
    icon: Plug,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950",
  },
  {
    key: "mechanic",
    label: "Mechanic",
    icon: Settings,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950",
  },
  {
    key: "carpenter",
    label: "Carpenter",
    icon: Hammer,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950",
  },
  {
    key: "painter",
    label: "Painter",
    icon: Paintbrush,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950",
  },
  {
    key: "cleaner",
    label: "Cleaner",
    icon: Sparkles,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950",
  },
  {
    key: "gardener",
    label: "Gardener",
    icon: Leaf,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950",
  },
  {
    key: "driver",
    label: "Driver",
    icon: Car,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950",
  },
];

import DashboardBgEffect from "@/components/DashboardBgEffect";

// Helper to validate if a string is a valid URL
function isValidUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    new URL(url);
    return url.startsWith("http://") || url.startsWith("https://");
  } catch {
    return false;
  }
}

export default async function CustomerDashboardPage() {
  // Fetch workers from Firestore
  const workersSnapshot = await adminDb
    .collection(COLLECTIONS.USERS)
    .where("role", "==", "WORKER")
    .limit(50)
    .get();

  // Fetch worker profiles for all workers
  const workerProfilesRef = adminDb.collection(COLLECTIONS.WORKER_PROFILES);
  const userIds = workersSnapshot.docs.map((doc) => doc.id);

  // Firestore doesn't support 'in' queries with more than 10 items, so we batch
  const workerProfilesMap = new Map();
  for (let i = 0; i < userIds.length; i += 10) {
    const batch = userIds.slice(i, i + 10);
    if (batch.length > 0) {
      const profilesQuery = await workerProfilesRef
        .where("userId", "in", batch)
        .get();
      profilesQuery.docs.forEach((doc) => {
        workerProfilesMap.set(doc.data().userId, {
          id: doc.id,
          ...doc.data(),
        });
      });
    }
  }

  // Sort by createdAt and take first 6 in-memory to avoid composite index
  const workersWithoutRatings = workersSnapshot.docs
    .map((doc) => {
      const data = doc.data();
      const workerProfile = workerProfilesMap.get(doc.id) || null;
      return {
        id: doc.id,
        name: data.name || null,
        workerProfile,
        createdAt: data.createdAt,
      };
    })
    .sort((a, b) => {
      // Sort by createdAt descending
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 6)
    .map(({ createdAt, ...worker }) => worker); // Remove createdAt from final result

  // Fetch ratings for all workers
  const workers = serializeFirestoreData(
    await Promise.all(
      workersWithoutRatings.map(async (worker) => {
        const rating = await getWorkerRating(worker.id);
        return { ...worker, rating };
      }),
    ),
  );

  return (
    <div className="min-h-screen space-y-8 dark:bg-dashboard-dark">
      <DashboardBgEffect />
      {/* Welcome Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
              Welcome back
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Find skilled professionals for your next project
            </p>
          </div>
          <Link href="/customer/search">
            <Button className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white shadow-sm">
              Browse All Workers
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Quick Stats - Real Data */}
        <CustomerDashboardStats />
      </div>

      {/* Categories Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Browse by Category
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Find professionals by their expertise
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map(({ key, label, icon: Icon, color, bgColor }) => (
            <Link
              key={key}
              href={`/customer/search?category=${encodeURIComponent(key)}`}
              aria-label={`Browse ${label}s`}
              className="group block"
            >
              <Card className="p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#181818] hover:shadow-lg hover:shadow-gray-900/5 dark:hover:shadow-black/20 transition-all duration-200 hover:-translate-y-1">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div
                    className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center`}
                  >
                    <Icon className={`h-6 w-6 ${color}`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {label}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Available now
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Workers Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recently Joined
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              New professionals on the platform
            </p>
          </div>
          <Link
            href="/customer/search"
            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 text-sm font-medium"
          >
            View all
          </Link>
        </div>

        {workers.length === 0 ? (
          <Card className="p-8 text-center border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#181818]">
            <div className="text-gray-500 dark:text-gray-400">
              <p className="text-lg font-medium">No workers available</p>
              <p className="text-sm mt-1">
                Check back later for new professionals
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            {workers.map((worker: any) => (
              <Card
                key={worker.id}
                className="p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#181818] hover:shadow-lg hover:shadow-gray-900/5 dark:hover:shadow-black/20 transition-all duration-200"
              >
                <div className="flex items-start gap-4 mb-4">
                  {/* Profile Image */}
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex-shrink-0">
                    {isValidUrl(worker.workerProfile?.profilePic) ? (
                      <Image
                        src={worker.workerProfile.profilePic}
                        alt={worker.name ?? "Worker"}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold">
                        {worker.name?.charAt(0)?.toUpperCase() ?? "W"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {worker.name ?? "Professional"}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {worker.workerProfile?.qualification ||
                        "Skilled Professional"}
                    </p>
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mt-2">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="truncate">
                          {worker.workerProfile?.city ||
                            "Location not specified"}
                        </span>
                      </div>
                      <span>•</span>
                      <span>
                        {worker.workerProfile?.yearsExperience ?? 0}+ years
                      </span>
                      {worker.rating && worker.rating.totalReviews > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <FiStar className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {worker.rating.avgRating.toFixed(1)}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              ({worker.rating.totalReviews})
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link href={`/workers/${worker.id}`} className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      View Profile
                    </Button>
                  </Link>
                  <BookWorkerButton
                    workerId={worker.id}
                    minimumFee={worker.workerProfile?.minimumFee}
                    workerName={worker.name}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
