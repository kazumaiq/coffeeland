import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '../i18n'

export default function MenuItem({ item, onAdd, hasDiscount }){
  const { t, lang } = useI18n()
  const [size, setSize] = useState(item.sizes[0].size)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)


  const name = lang === 'ru' ? item.name_ru : item.name_en
  const price = item.sizes.find(s => s.size === size)?.price || item.sizes[0].price
  const currency = t('common.currency')

  const fallbackImage = '/glass Coffe Land.jpg'
  const imageSrc = item.image || fallbackImage
  const dropdownId = `volume-${item.id}`
  const formatVolume = (sizeLabel, priceValue) => `${sizeLabel} — ${priceValue} ${currency}`

  useEffect(() => {
    const handleClickOutside = (event) => {
      if(!dropdownRef.current) return
      if(!dropdownRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event) => {
      if(event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside, { passive: true })
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])


  const onSelect = (selected) => {
    setSize(selected)
    setOpen(false)
  }

  return (
    <motion.div 
      className="item"
      whileHover={{ y: -10 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      layout
    >
      {hasDiscount && (
        <motion.div 
          className="discount-badge"
          initial={{ opacity: 0, scale: 0, rotateZ: -15 }}
          animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          {t('menu.discount')}
        </motion.div>
      )}
      <motion.div 
        className="item-image"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <img
          src={imageSrc}
          alt={name}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.src = fallbackImage
          }}
        />
      </motion.div>

      <div className="item-meta">
        <motion.div 
          className="item-name"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {name}
        </motion.div>

        <motion.div 
          className="item-size"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          {formatVolume(size, price)}
        </motion.div>
      </div>

      <div className="item-actions">
        <div className="volume-select" ref={dropdownRef}>
          <button
            type="button"
            className="volume-select-trigger"
            onClick={() => setOpen(prev => !prev)}
            aria-expanded={open}
            aria-controls={dropdownId}
            aria-haspopup="listbox"
          >
            <span>{formatVolume(size, price)}</span>
            <span className={`volume-caret ${open ? 'is-open' : ''}`} aria-hidden="true">▾</span>
          </button>
          <div
            id={dropdownId}
            className={`volume-dropdown ${open ? 'is-open' : ''}`}
            role="listbox"
          >
            {item.sizes.map(s => {
              const active = s.size === size
              return (
                <button
                  key={s.size}
                  type="button"
                  className={`volume-option ${active ? 'volume-option-active' : ''}`}
                  onClick={() => onSelect(s.size)}
                  role="option"
                  aria-selected={active}
                >
                  <span>{formatVolume(s.size, s.price)}</span>
                  {active && <span className="volume-check" aria-hidden="true">✓</span>}
                </button>
              )
            })}
          </div>
        </div>
        <motion.button 
          className="add-btn" 
          onClick={()=>onAdd({ ...item, size, price })}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 350, damping: 26 }}
        >
          ✓ {t('menu.add')}
        </motion.button>
      </div>

    </motion.div>
  )
}
