'use client';

interface AddButtonProps {
  onClick: () => void;
}

export default function AddButton({ onClick }: AddButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Add post"
      className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-2xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-50"
    >
      +
    </button>
  );
}
