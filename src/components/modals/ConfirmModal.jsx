import { useEffect } from 'react'

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    const handle = (e) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200]"
      onClick={onCancel}
    >
      <div
        className="bg-panel border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-white mb-2">{title}</h3>
        {message && <p className="text-sm text-gray-400 mb-5 leading-relaxed">{message}</p>}
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors
              ${danger
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-lime text-black hover:bg-lime-dark'
              }`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-panel-light text-gray-400 py-2.5 rounded-xl text-sm hover:bg-border transition-colors"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
