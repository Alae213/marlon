"use client";

interface DeleteConfirmOverlayProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmOverlay({ onCancel, onConfirm }: DeleteConfirmOverlayProps) {
  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
      <div className="text-center p-4">
        <p className="text-white font-normal mb-3">حذف المنتج؟</p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCancel();
            }}
            className="px-3 py-1.5 bg-white text-[#171717] text-sm"
          >
            إلغاء
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onConfirm();
            }}
            className="px-3 py-1.5 bg-[#dc2626] text-white text-sm"
          >
            حذف
          </button>
        </div>
      </div>
    </div>
  );
}
