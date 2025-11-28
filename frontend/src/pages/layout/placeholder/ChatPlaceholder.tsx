import { motion } from "framer-motion";
import { MessageCircle, Sparkles } from "lucide-react";

const ChatPlaceholder = () => {
  return (
    <section
      className={`flex-1 h-screen flex items-center justify-center bg-transparent dark:bg-neutral-900`}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md px-6"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mx-auto mb-6 flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/40"
        >
          <MessageCircle className="w-10 h-10  text-custom-bg-1!  dark:text-blue-300" />
        </motion.div>

        <h1 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
          Welcome to <span className=" text-custom-bg-1! ">Mucchatlu</span>
        </h1>

        <p className="text-neutral-600 dark:text-neutral-300 mt-3 leading-relaxed">
          Start conversations that matter. Stay connected with friends, family,
          and the people who matter the most. Click on a chat from the left or
          start a new one.
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center mt-6"
        >
          <div className="flex items-center text-sm text-custom-bg-1! dark:text-custom-bg-1! gap-1">
            <Sparkles className="w-4 h-4" />
            <span>Your conversations begin here</span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default ChatPlaceholder;
