"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import FaqSection from "@/components/ui/messaging-like-qna";
import {
  HelpCircle,
  UserCheck,
  Shield,
  Phone,
  Mail,
  User,
  FileText,
  Smartphone,
  Wallet,
  AlertCircle,
  Star,
  Target,
} from "lucide-react";
import Link from "next/link";

export default function WorkerHelpPage() {
  const faqs = [
    {
      id: 1,
      question: "What is NearServe for Workers?",
      answer:
        "NearServe helps skilled workers like plumbers, electricians, drivers, cleaners, and other professionals connect directly with customers who need their services. It ensures fair opportunities and consistent job access.",
      icon: User,
    },
    {
      id: 2,
      question: "How can I register as a worker?",
      answer:
        "You can sign up using your mobile number or email, complete your basic profile, and upload your ID proof for verification. Once approved, you'll start receiving job requests from nearby customers.",
      icon: FileText,
    },
    {
      id: 3,
      question: "How do I get job bookings?",
      answer:
        "Once your account is verified, customers can view your profile and hire you for tasks. You'll get job notifications in your dashboard, and you can accept or decline based on your availability.",
      icon: Smartphone,
    },
    {
      id: 4,
      question: "When and how do I receive payments?",
      answer:
        "Payments are made directly to your registered bank account or UPI after successful job completion. NearServe ensures transparent transactions with low service charges.",
      icon: Wallet,
    },
    {
      id: 5,
      question: "What if a customer cancels or doesn't pay?",
      answer:
        "In case of cancellations or payment disputes, raise a complaint from your 'My Jobs' section. Our support team will verify and assist in resolving the issue promptly.",
      icon: AlertCircle,
    },
    {
      id: 6,
      question: "How do I improve my visibility and ratings?",
      answer:
        "Complete your profile, upload genuine work photos, and maintain good ratings from customers. Higher ratings and verified profiles are shown first to potential clients.",
      icon: Star,
    },
    {
      id: 7,
      question: "Is there any subscription or limit for workers?",
      answer:
        "Basic accounts can receive a limited number of job requests per week. For more visibility, unlimited requests, and premium support, you can upgrade to a Pro Worker Plan.",
      icon: Target,
    },
  ];

  return (
    <div className="min-h-screen space-y-8 bg-white dark:bg-[#212121] px-4 sm:px-6 lg:px-8 py-6 pt-30">
      {/* Header Section */}
      <div className="space-y-2 text-center pt-4">
        <div className="flex justify-center mb-2">
          <HelpCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
          Worker Help & Support
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Everything you need to know about using NearServe as a worker — from
          registration to payments and support.
        </p>
      </div>

      {/* FAQs Section */}
      <div className="flex flex-col items-center w-full">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <UserCheck className="h-5 w-5 mr-2 text-emerald-600 dark:text-emerald-400" />
          Common Questions for Workers
        </h2>
        <FaqSection data={faqs} />
      </div>

      {/* Support Contact Section */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 max-w-3xl mx-auto">
        <Card className="p-8 bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#232323] hover:shadow-lg transition-shadow">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-4">
              <Phone className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-3">
              Call Support
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              Call us at
            </p>
            <a
              href="tel:+919876543210"
              className="text-green-600 dark:text-green-400 font-semibold text-lg hover:underline mt-2"
            >
              +91 98765 *****
            </a>
          </div>
        </Card>

        <Card className="p-8 bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#232323] hover:shadow-lg transition-shadow">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-3">
              Email Support
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              Write to us at
            </p>
            <a
              href="mailto:customerservice@example.com"
              className="text-blue-600 dark:text-blue-400 font-semibold text-sm hover:underline mt-2 break-all text-center"
            >
              customerservice@example.com
            </a>
          </div>
        </Card>
      </div>

      {/* Safety Section */}
      <Card className="p-6 bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#232323]">
        <div className="flex items-start gap-3">
          <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Worker Protection & Safety
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              NearServe values worker dignity and safety. We verify all
              customers, ensure secure payments, and provide direct support for
              disputes or emergencies. Your data and work records remain fully
              confidential.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
