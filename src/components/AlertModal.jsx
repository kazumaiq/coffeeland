import React, { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function AlertModal({
  isOpen,
  title,
  message,
  confirmLabel,
  onClose
}) {
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="ui-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="ui-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="ui-alert-title"
            aria-describedby="ui-alert-message"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ui-modal-header">
              <h3 id="ui-alert-title">{title}</h3>
            </div>
            <div className="ui-modal-body" id="ui-alert-message">
              {message}
            </div>
            <div className="ui-modal-actions">
              <button className="btn-primary ui-btn-primary" onClick={onClose}>
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
