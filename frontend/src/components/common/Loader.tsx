import { motion } from "framer-motion";

const Loader = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Chat bubbles animation */}
      <div className="flex space-x-2 mb-6">
        <motion.span
          className="w-4 h-4 bg-blue-500! rounded-full"
          animate={{
            y: [0, -8, 0],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0,
          }}
        ></motion.span>

        <motion.span
          className="w-4 h-4 bg-indigo-500 rounded-full"
          animate={{
            y: [0, -8, 0],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2,
          }}
        ></motion.span>

        <motion.span
          className="w-4 h-4 bg-purple-500 rounded-full"
          animate={{
            y: [0, -8, 0],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.4,
          }}
        ></motion.span>
      </div>

      {/* Text glow effect */}
      <motion.h2
        className="text-lg font-semibold text-gray-700 tracking-wide"
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
        }}
      >
        Connecting to Mucchatlu...
      </motion.h2>
    </div>
  );
};

export default Loader;
