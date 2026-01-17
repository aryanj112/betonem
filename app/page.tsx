import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-black">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-6xl md:text-7xl font-bold text-white tracking-tight">
            Bet<span className="text-primary">On</span>Em
          </h1>
          <p className="text-xl text-gray-300">
            Prediction markets with friends
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/signup">
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 pt-16 border-t border-gray-800">
          <div className="space-y-2">
            <h3 className="font-semibold text-white">Private Groups</h3>
            <p className="text-sm text-gray-400">
              Invite-only betting with friends
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-white">Real-Time Odds</h3>
            <p className="text-sm text-gray-400">
              Live market updates
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-white">Debt-Based</h3>
            <p className="text-sm text-gray-400">
              Start at $0, settle later
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
