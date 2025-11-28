// src/pages/WelcomePage.tsx
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import React from "react";

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <main className="h-screen w-screen bg-[#0c131b] text-white flex items-center justify-center">
      <div className="container mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          {/* LEFT SECTION — BRAND + TEXT */}
          <motion.section
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="space-y-6"
          >
            {/* LOGO + NAME */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-black font-extrabold text-xl shadow-md">
                M
              </div>
              <span className="text-2xl font-semibold tracking-wide">
                Mucchatlu
              </span>
            </div>

            {/* MAIN TITLE */}
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Simple. Fast.
              <br />
              <span className="text-teal-400">Reliable Chats.</span>
            </h1>

            {/* DESCRIPTION */}
            <p className="text-gray-300 max-w-md leading-relaxed">
              Welcome to{" "}
              <span className="text-white font-semibold">Mucchatlu</span>, a
              modern chat platform built for speed, privacy, and effortless
              conversation.
            </p>

            {/* BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-4 pt-3">
              <Button
                onClick={() => navigate("/login")}
                className=" text-black! px-6 py-3 text-md rounded-full bg-teal-500 hover:bg-teal-400! transition shadow-lg"
              >
                Log in
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate("/app/users")}
                className="text-black! px-6 py-3 text-md rounded-full border-gray-400/30 hover:bg-teal-400! transition"
              >
                Explore
              </Button>
            </div>

            <p className="text-sm text-gray-500 pt-2">
              End-to-end vibes. Zero distractions.
            </p>
          </motion.section>

          {/* RIGHT SECTION — PHONE MOCKUP */}
          <motion.section
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="flex justify-center"
          >
            <div className="w-[260px] h-[520px] rounded-3xl bg-white/5 border border-white/10 shadow-2xl p-4 backdrop-blur-lg relative overflow-hidden">
              {/* TOP BAR */}
              <div className="flex justify-between items-center px-2 py-1">
                <div className="w-16 h-2 bg-gray-400/20 rounded-full" />
                <div className="w-6 h-6 bg-gray-400/20 rounded-full" />
              </div>

              {/* CHAT PREVIEW */}
              <div className="mt-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-white/5 p-2 rounded-xl"
                  >
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-teal-400 to-teal-600!" />
                    <div>
                      <div className="h-3 w-28 bg-white/20 rounded-md mb-1" />
                      <div className="h-2 w-16 bg-white/10 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        </div>

        {/* FOOTER */}
        <footer className="mt-16 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Mucchatlu — Privacy First.
        </footer>
      </div>
    </main>
  );
};

export default WelcomePage;
