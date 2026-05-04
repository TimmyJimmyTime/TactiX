import { useEffect } from 'react'
import useStore from '../../store'

export function Toast() {
  const toast     = useStore((s) => s.toast)
  const clearToast = useStore((s) => s.clearToast)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(clearToast, 2400)
    return () => clearTimeout(t)
  }, [toast, clearToast])

  if (!toast) return null

  return (
    <div
      key={toast.id}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300]
        bg-panel border border-lime/40 text-lime text-sm px-5 py-2.5
        rounded-full shadow-xl pointer-events-none
        animate-toast-in"
    >
      {toast.message}
    </div>
  )
}

export default Toast
