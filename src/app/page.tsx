"use client";

import { motion } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

function BackgroundGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px'
        }}
      />
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute left-1/2 top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-white/10 to-transparent" />
    </div>
  );
}

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/app");
    }
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-4 h-4 border border-foreground border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden font-sans">
      <BackgroundGrid />

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-xl p-8 flex flex-col items-center"
      >
        <div className="text-center mb-16">
          <h1 className="text-[28px] md:text-[36px] font-medium tracking-tight text-foreground mb-4 font-mono uppercase">
            Merge Conflict Predictor
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
            Predict merge conflicts before they break your development workflow.
          </p>
        </div>

        <div className="w-full space-y-8 flex flex-col items-center">
          <button
            onClick={() => signIn("github", { callbackUrl: "/app" })}
            className="w-full max-w-md flex items-center justify-center space-x-3 bg-foreground text-background hover:bg-foreground/90 py-4 rounded-none text-sm font-medium transition-all"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
            <span className="uppercase tracking-widest font-mono">Login with GitHub</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
