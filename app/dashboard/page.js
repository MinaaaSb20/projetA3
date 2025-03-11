import ButtonAccount from "@/components/ButtonAccount";
import ButtonCheckout from "@/components/ButtonCheckout";
import config from "@/config";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  // Get the session
  const session = await getServerSession(authOptions);
  
  // Redirect to login if no session
  if (!session) {
    redirect("/api/auth/signin");
  }

  try {
    // Connect to MongoDB
    await connectMongo();
    
    // Find user by email instead of ID since we're using OAuth
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      throw new Error("User not found");
    }

    return (
      <main className="min-h-screen p-8 pb-24">
        <section className="max-w-xl mx-auto space-y-8">
          <ButtonAccount />

          <h1 className="text-3xl md:text-4xl font-extrabold">
            Subscribe to get access:
          </h1>

          <ButtonCheckout
            mode="subscription"
            priceId={config.stripe.plans[0].priceId}
          />
          
          <div className="bg-gray-800 rounded-lg p-6">
            <p className="text-xl font-semibold mb-2">
              Welcome {user.name} 👋
            </p>
            <p className="text-gray-400">
              Email: {user.email}
            </p>
            {user.hasAccess ? (
              <p className="text-green-500 mt-2">✓ Premium Access</p>
            ) : (
              <p className="text-yellow-500 mt-2"></p>
            )}
          </div>

        </section>
      </main>
    );
  } catch (error) {
    console.error("Dashboard Error:", error);
    return (
      <main className="min-h-screen p-8 pb-24">
        <section className="max-w-xl mx-auto">
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-6">
            <h2 className="text-red-500 font-semibold">Error loading dashboard</h2>
            <p className="text-gray-400 mt-2">Please try refreshing the page</p>
          </div>
        </section>
      </main>
    );
  }
}
