"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Upload, Trash2, Crop } from "lucide-react";

interface LogoToolbarProps {
  isOpen: boolean;
  onUpload: () => void;
  onCrop: () => void;
  onDelete: () => void;
}

export function LogoToolbar({
  isOpen,
  onUpload,
  onCrop,
  onDelete,
}: LogoToolbarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute top-full mt-2 left-0 flex items-center gap-1 bg-[var(--system-50)] border border-[--system-gray-200] rounded-lg shadow-lg p-1 z-50"
        >
          <button
            onClick={onUpload}
            className="p-1.5 hover:bg-[--system-gray-100] rounded flex items-center gap-1 text-xs text-[--system-gray-400]"
            title="Change"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onCrop}
            className="p-1.5 hover:bg-[--system-gray-100] rounded flex items-center gap-1 text-xs text-[--system-gray-400]"
            title="Crop"
          >
            <Crop className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-red-50 rounded flex items-center gap-1 text-xs text-red-500"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </motion.div>
          )}
        </AnimatePresence>
  );
}
