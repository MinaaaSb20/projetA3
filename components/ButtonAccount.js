/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { Popover, Transition } from "@headlessui/react";
import { useSession, signOut } from "next-auth/react";
import apiClient from "@/libs/api";

// A button to show user some account actions
//  1. Billing: open a Stripe Customer Portal to manage their billing (cancel subscription, update payment method, etc.).
//     You have to manually activate the Customer Portal in your Stripe Dashboard (https://dashboard.stripe.com/test/settings/billing/portal)
//     This is only available if the customer has a customerId (they made a purchase previously)
//  2. Logout: sign out and go back to homepage
// See more at https://shipfa.st/docs/components/buttonAccount
const ButtonAccount = () => {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };
  const handleBilling = async () => {
    setIsLoading(true);

    try {
      const { url } = await apiClient.post("/stripe/create-portal", {
        returnUrl: window.location.href,
      });

      window.location.href = url;
    } catch (e) {
      console.error(e);
    }

    setIsLoading(false);
  };

  // Don't show anything if not authenticated (we don't have any info about the user)
  if (status === "unauthenticated") return null;

  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 backdrop-blur-sm rounded-xl border border-gray-700/50 hover:border-purple-500/30 transition-all duration-200 text-sm font-medium">
            {session?.user?.image ? (
              <img
                src={session?.user?.image}
                alt={session?.user?.name || "Account"}
                className="w-8 h-8 rounded-full shrink-0 ring-2 ring-purple-500/20"
                referrerPolicy="no-referrer"
                width={24}
                height={24}
              />
            ) : (
              <span className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-500 flex justify-center items-center rounded-full shrink-0 text-white">
                {session?.user?.name?.charAt(0) ||
                  session?.user?.email?.charAt(0)}
              </span>
            )}

            {session?.user?.name || "Account"}

            {isLoading ? (
              <span className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></span>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`w-5 h-5 duration-200 opacity-50 ${
                  open ? "transform rotate-180 " : ""
                }`}
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </Popover.Button>
          <Transition
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Popover.Panel className="absolute right-0 mt-3 w-screen max-w-[16rem] transform">
              <div className="overflow-hidden rounded-xl shadow-xl bg-gray-800/90 backdrop-blur-lg border border-gray-700/50 p-2">
                <div className="space-y-1 text-sm">
                  <button
                    className="flex items-center gap-2 w-full p-3 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-purple-500/10 transition-all duration-200"
                    onClick={handleBilling}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5 text-purple-400"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.5 4A1.5 1.5 0 001 5.5V6h18v-.5A1.5 1.5 0 0017.5 4h-15zM19 8.5H1v6A1.5 1.5 0 002.5 16h15a1.5 1.5 0 001.5-1.5v-6zM3 13.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zm4.75-.75a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Billing
                  </button>
                  <button
                    className="flex items-center gap-2 w-full p-3 rounded-lg font-medium text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                    onClick={handleSignOut}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5 text-red-400"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z"
                        clipRule="evenodd"
                      />
                      <path
                        fillRule="evenodd"
                        d="M6 10a.75.75 0 01.75-.75h9.546l-1.048-.943a.75.75 0 111.004-1.114l2.5 2.25a.75.75 0 010 1.114l-2.5 2.25a.75.75 0 11-1.004-1.114l1.048-.943H6.75A.75.75 0 016 10z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Logout
                  </button>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent my-1"></div>
                  <div className="px-3 py-2">
                    <div className="text-xs text-gray-400">Signed in as</div>
                    <div className="text-sm text-gray-200 font-medium truncate">
                      {session?.user?.email}
                    </div>
                  </div>
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
};

export default ButtonAccount;
