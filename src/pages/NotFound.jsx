import { Link } from 'lucide-react';
import { motion } from 'motion/react';

export default function NotFound({ navigate }) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-8xl font-bold tracking-tight opacity-20">
          404
        </h1>

        <h2 className="text-2xl font-semibold mt-4">
          Page not found
        </h2>

        <p className="text-sm opacity-60 mt-3 max-w-sm">
          The page you're looking for doesn't exist ! 
        </p>

        <button
          onClick={() => navigate('practice')}
          className="mt-8 px-6 py-3 rounded-lg bg-[var(--tf-accent)] text-white font-medium hover:opacity-90 transition"
        >
          Back to Practice
        </button>
      </motion.div>
    </div>
  );
}