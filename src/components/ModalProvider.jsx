import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import AlertModal from './AlertModal'
import ConfirmModal from './ConfirmModal'
import { useI18n } from '../i18n'

const ModalContext = createContext(null)

export const useModal = () => useContext(ModalContext)

export default function ModalProvider({ children }) {
  const { t } = useI18n()
  const [alertState, setAlertState] = useState(null)
  const [confirmState, setConfirmState] = useState(null)

  const showAlert = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setAlertState({
        message,
        title: options.title || t('common.alertTitle'),
        confirmLabel: options.confirmLabel || t('common.ok'),
        resolve
      })
    })
  }, [t])

  const showConfirm = useCallback((message, onConfirm, options = {}) => {
    return new Promise((resolve) => {
      setConfirmState({
        message,
        title: options.title || t('common.confirmTitle'),
        confirmLabel: options.confirmLabel || t('common.confirm'),
        cancelLabel: options.cancelLabel || t('common.cancel'),
        onConfirm,
        resolve
      })
    })
  }, [t])

  const handleAlertClose = () => {
    if (alertState?.resolve) alertState.resolve()
    setAlertState(null)
  }

  const handleConfirmClose = () => {
    if (confirmState?.resolve) confirmState.resolve(false)
    setConfirmState(null)
  }

  const handleConfirmAccept = () => {
    if (confirmState?.onConfirm) confirmState.onConfirm()
    if (confirmState?.resolve) confirmState.resolve(true)
    setConfirmState(null)
  }

  const isOpen = Boolean(alertState || confirmState)

  useEffect(() => {
    if (!isOpen) return undefined
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [isOpen])

  const value = useMemo(() => ({ showAlert, showConfirm }), [showAlert, showConfirm])

  return (
    <ModalContext.Provider value={value}>
      {children}
      <AlertModal
        isOpen={Boolean(alertState)}
        title={alertState?.title}
        message={alertState?.message}
        confirmLabel={alertState?.confirmLabel}
        onClose={handleAlertClose}
      />
      <ConfirmModal
        isOpen={Boolean(confirmState)}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel}
        cancelLabel={confirmState?.cancelLabel}
        onConfirm={handleConfirmAccept}
        onClose={handleConfirmClose}
      />
    </ModalContext.Provider>
  )
}
