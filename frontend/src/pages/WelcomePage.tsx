// src/pages/WelcomePage.tsx
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/redux/hooks";
import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * Welcome / Landing page
 * - Clean hero with CTA (Login)
 * - Subtle brand and SEO-friendly heading/description
 *
 * Replace navigate('/login') with your auth flow (login modal, oauth, etc.)
 */

const WelcomePage: React.FC = () => {
  const data = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  console.log("====================================");
  console.log({ data });
  console.log("====================================");
  return (
    <main className="min-h-screen w-screen bg-gradient-to-br from-[#0f1724] to-[#12263b] text-white flex items-center justify-center">
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Left: Branding + CTA */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#1E90FF] to-[#00BFFF] flex items-center justify-center shadow-lg">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h16v10H6l-2 2V6z" fill="white" opacity="0.95" />
                </svg>
              </div>
              <span className="text-lg font-semibold tracking-wide">
                Mucchatlu
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Welcome to{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#e5e1d7] to-[#F9AB00]">
                Mucchatlu
              </span>
            </h1>

            <p className="text-gray-300 max-w-xl">
              Connect instantly with people around the world. Secure chats,
              smooth UI, and a delightful experience — start a conversation in
              one click.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Button
                onClick={() => navigate("/login")}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-[#1E90FF] to-[#00BFFF] shadow-lg hover:scale-[1.02] transform transition"
                aria-label="Login to Mucchatlu"
              >
                Log in
              </Button>
              <Button
                onClick={() => handleLogout()}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-[#ff741e] to-[#ff2600] shadow-lg hover:scale-[1.02] transform transition"
                aria-label="Login to Mucchatlu"
              >
                Logout
              </Button>

              <Button
                onClick={() => navigate("/app/users")}
                className="px-6 py-3 rounded-full border border-white/20 text-black/90 hover:bg-white/5 transition"
                aria-label="Explore chats"
              >
                Explore users
              </Button>
              <Button
                onClick={() => navigate("/app/chats")}
                className="px-6 py-3 rounded-full border border-white/20 text-black/90 hover:bg-white/5 transition"
                aria-label="Explore chats"
              >
                Explore Chats
              </Button>
            </div>

            <p className="text-sm text-gray-400 mt-6">
              No spam. Just real conversations.
            </p>
          </section>

          {/* Right: Preview card */}
          <section
            aria-hidden
            className="hidden md:flex items-center justify-center"
          >
            <div className="w-full max-w-md rounded-2xl bg-white/5 p-6 backdrop-blur-sm border border-white/6 shadow-xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#FFB703] to-[#FB8500] flex items-center justify-center text-black font-bold">
                  M
                </div>
                <div>
                  <div className="text-sm font-semibold">
                    Mucchatlu • Featured
                  </div>
                  <div className="text-xs text-gray-300">
                    Fast, private, designed for humans
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-gradient-to-br from-white/5 to-white/2 p-4">
                <h3 className="text-lg font-bold mb-2">Global Users</h3>
                <p className="text-sm text-gray-300">
                  See everyone online, check profiles, and say hi — creating
                  conversations is effortless.
                </p>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="w-full h-12 rounded-lg bg-gradient-to-r from-[#1E90FF] to-[#00BFFF]" />
                <div className="w-full h-12 rounded-lg bg-gradient-to-r from-[#A78BFA] to-[#7C3AED]" />
                <div className="w-full h-12 rounded-lg bg-gradient-to-r from-[#F97316] to-[#FB923C]" />
              </div>
            </div>
          </section>
        </div>

        {/* SEO-friendly footer */}
        <footer className="mt-12 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Mucchatlu — Fast • Private • Friendly
        </footer>
      </div>
    </main>
  );
};

export default WelcomePage;
