"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ArchonLoaderProps {
  size?: number;
  className?: string;
  text?: string;
  showBlur?: boolean;
}

export function ArchonLoader({ 
  size = 120, 
  className, 
  text = "Systemen initialiseren...",
  showBlur = true 
}: ArchonLoaderProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-8", className)}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Extreme Glow Background */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 bg-amber-500/20 rounded-full blur-[40px]"
        />

        {/* Outer Pulsing Ring */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: 360,
          }}
          transition={{
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 8, repeat: Infinity, ease: "linear" }
          }}
          className="absolute inset-0 border-t-2 border-r-2 border-amber-500/30 rounded-full"
        />

        {/* Inner Spinning Ring (Fast) */}
        <motion.div
          animate={{
            rotate: -360,
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute inset-[15%] border-b-2 border-l-2 border-amber-400/50 rounded-full"
        />

        {/* The Core Image Container */}
        <motion.div 
          className="relative z-10 w-full h-full p-4 flex items-center justify-center rounded-3xl bg-slate-900/40 backdrop-blur-md border border-white/10 shadow-2xl"
          animate={{
            y: [0, -4, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="relative w-full h-full overflow-hidden rounded-2xl">
            <Image
              src="/Gemini_Generated_Image_hhbh51hhbh51hhbh.png"
              alt="Archon"
              fill
              className="object-contain p-2"
              priority
            />
          </div>
        </motion.div>

        {/* Particle satellites */}
        {[0, 72, 144, 216, 288].map((degree) => (
          <motion.div
            key={degree}
            className="absolute w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)]"
            animate={{
              rotate: [degree, degree + 360],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              originX: "50%",
              originY: "50%",
              transformOrigin: `center ${size / 2}px`,
              top: 0,
            }}
          />
        ))}
      </div>
      
      {/* Loading text with modern aesthetic */}
      <AnimatePresence>
        {text && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            <p className="text-white font-bold tracking-[0.3em] uppercase text-[10px] mb-1">
              ArchonPro
            </p>
            <motion.p 
              className="text-amber-500 font-bold tracking-[0.2em] shadow-amber-500/50 drop-shadow-lg"
              animate={{ 
                opacity: [0.4, 1, 0.4],
                textShadow: ["0 0 0px rgba(245,158,11,0)", "0 0 10px rgba(245,158,11,0.5)", "0 0 0px rgba(245,158,11,0)"]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {text}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ArchonFullScreenLoader({ text = "Systeem opstarten..." }: { text?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#0B0F14] z-[9999] flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-linear-to-b from-amber-500/5 to-transparent pointer-events-none" />
      <ArchonLoader size={160} text={text} />
    </motion.div>
  );
}

export function ArchonInlineLoader({ size = 48 }: { size?: number }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 border-t-2 border-amber-500/40 rounded-full"
      />
      <div className="relative p-2 w-full h-full">
        <Image
          src="/Gemini_Generated_Image_hhbh51hhbh51hhbh.png"
          alt="Loading"
          fill
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}
