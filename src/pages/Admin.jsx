import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { useI18n } from '../i18n'
import { useModal } from '../components/ModalProvider'
import { getErrorText } from '../utils/error'

export default function Admin(){
  const { t } = useI18n()
  const { showAlert, showConfirm } = useModal()
  const [auth, setAuth] = useState(false)
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState({})
  const [nowTs, setNowTs] = useState(Date.now())

  const load = async () => {
    try {
      const oRes = await axios.get('/api/orders', { headers: { 'x-admin': '1' } })
      setOrders(oRes.data)
      
      const uRes = await axios.get('/api/users/admin/users', { headers: { 'x-admin': '1' } })
      setUsers(uRes.data.users || [])
      
      const sRes = await axios.get('/api/orders/stats', { headers: { 'x-admin': '1' } })
      setStats(sRes.data)
    } catch(e) {
      console.error(e)
    }
  }

  useEffect(() => { if(auth) load() }, [auth])

  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 60000)
    return () => clearInterval(id)
  }, [])

  const login = async (e) => {
    e.preventDefault()
    const f = new FormData(e.target)
    const u = f.get('user'), p = f.get('pass')
    if(u==='admin' && p==='admin') setAuth(true)
    else showAlert(t('admin.invalidLogin'))
  }

  const setStatus = async (id, status) => {
    try {
      await axios.put(`/api/orders/${id}/status`, { status }, { headers: { 'x-admin':'1' } })
      load()
    } catch(e) {
      console.error(e)
    }
  }

  const getPrimaryAction = (status) => {
    if(status === 'new') return { label: t('admin.accept'), next: 'preparing' }
    if(status === 'preparing') return { label: t('admin.ready'), next: 'completed' }
    return { label: t('admin.completed'), next: null }
  }

  const toggleExpanded = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const getPickupInfo = (order) => {
    if(!order.pickup_time) return null
    const parts = String(order.pickup_time).split(':')
    if(parts.length < 2) return null
    const h = Number(parts[0])
    const m = Number(parts[1])
    if(Number.isNaN(h) || Number.isNaN(m)) return null

    const baseDate = order.created_at ? new Date(order.created_at) : new Date()
    const pickup = new Date(baseDate)
    pickup.setHours(h, m, 0, 0)

    let diffMinutes = Math.round((pickup.getTime() - nowTs) / 60000)
    if(diffMinutes < -720) {
      pickup.setDate(pickup.getDate() + 1)
      diffMinutes = Math.round((pickup.getTime() - nowTs) / 60000)
    }

    return { time: order.pickup_time, diffMinutes }
  }

  const groupItems = (items = []) => {
    const map = new Map()
    items.forEach((it) => {
      const name = it.name || it.name_ru || it.name_en || it.item_id || 'Item'
      const size = it.size || ''
      const price = Number(it.price) || 0
      const key = `${name}__${size}__${price}`
      if(!map.has(key)) {
        map.set(key, { name, size, price, count: 0 })
      }
      map.get(key).count += 1
    })
    return Array.from(map.values())
  }

  const splitItems = (items = []) => {
    const addons = []
    const main = []
    items.forEach((it) => {
      const size = String(it.size || '').toLowerCase()
      const isAddon = size === 'add' || size === 'shot'
      if(isAddon) addons.push(it)
      else main.push(it)
    })
    return { main, addons }
  }

  const openReceipt = (order) => {
    const { main, addons } = splitItems(order.items || [])
    const mainGrouped = groupItems(main)
    const addonGrouped = groupItems(addons)

    const currency = t('common.currency')
    const lines = []
    lines.push(`<h2>Order #${order.id}</h2>`)
    lines.push(`<div>${order.customer_name || t('admin.guest')} - ${order.phone}</div>`)
    lines.push(`<div>${t('order.total')}: ${order.final_total || order.total} ${currency}</div>`)

    if(mainGrouped.length) {
      lines.push(`<h3>${t('admin.orderComposition')}</h3><ul>`)
      mainGrouped.forEach((g) => {
        const size = g.size && g.size !== 'add' && g.size !== 'shot' ? ` (${g.size})` : ''
        const total = g.price * g.count
        lines.push(`<li>${g.name}${size} x${g.count} - ${total} ${currency}</li>`)
      })
      lines.push('</ul>')
    }

    if(addonGrouped.length) {
      lines.push(`<h3>${t('admin.addons')}</h3><ul>`)
      addonGrouped.forEach((g) => {
        const total = g.price * g.count
        lines.push(`<li>${g.name} x${g.count} - +${total} ${currency}</li>`)
      })
      lines.push('</ul>')
    }

    lines.push(`<div><strong>${t('cart.comment')}:</strong> ${order.comment || t('admin.noComment')}</div>`)

    const receiptHtml = `
      <html>
        <head>
          <title>Order #${order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #1f2a24; }
            h2 { margin: 0 0 8px; }
            h3 { margin: 16px 0 8px; }
            ul { padding-left: 18px; }
            li { margin: 6px 0; }
          </style>
        </head>
        <body>
          ${lines.join('')}
        </body>
      </html>
    `

    const w = window.open('', '_blank')
    if(!w) return
    w.document.write(receiptHtml)
    w.document.close()
    w.focus()
  }

  const giveCard = async (userId) => {
    const ok = await showConfirm(t('admin.confirmCard'))
    if(!ok) return
    setLoading(true)
    try {
      await axios.patch(`/api/users/admin/users/${userId}/loyalty`, { action: 'give' }, { headers: { 'x-admin': '1' } })
      load()
    } catch(e) {
      showAlert(getErrorText(e), { title: t('common.error') })
    } finally {
      setLoading(false)
    }
  }

  const revokeCard = async (userId) => {
    const ok = await showConfirm(t('admin.confirmRevoke'))
    if(!ok) return
    setLoading(true)
    try {
      await axios.patch(`/api/users/admin/users/${userId}/loyalty`, { action: 'revoke' }, { headers: { 'x-admin': '1' } })
      load()
    } catch(e) {
      showAlert(getErrorText(e), { title: t('common.error') })
    } finally {
      setLoading(false)
    }
  }

  if(!auth) return (
    <div className="container" style={{maxWidth:'400px', margin:'4rem auto'}}>
      <motion.div
        initial={{opacity:0, y:20}}
        animate={{opacity:1, y:0}}
      >
        <h2>{t('admin.title')}</h2>
        <form onSubmit={login} className="form" style={{marginTop:'2rem'}}>
          <input name="user" defaultValue="admin" placeholder="Username" required />
          <input name="pass" type="password" defaultValue="admin" placeholder="Password" required />
          <motion.button 
            className="btn-primary" 
            whileHover={{scale:1.05}}
            whileTap={{scale:0.95}}
          >
            {t('common.login')}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )

  return (
    <motion.div 
      className="admin-panel container"
      initial={{opacity:0}}
      animate={{opacity:1}}
    >
      <h2>{t('admin.title')}</h2>
      
      <motion.div 
        className="stats-grid"
        initial={{y:20, opacity:0}}
        animate={{y:0, opacity:1}}
        transition={{delay:0.1}}
      >
        <h3>{t('admin.stats')}</h3>
        <div className="stat-item">
          <span className="stat-label">{t('admin.totalOrders')}:</span>
          <span className="stat-value">{stats?.totalOrders}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">{t('admin.ordersToday')}:</span>
          <span className="stat-value">{stats?.ordersToday}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">{t('admin.totalRevenue')}:</span>
          <span className="stat-value">{stats?.totalRevenue} {t('common.currency')}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">{t('admin.revenueToday')}:</span>
          <span className="stat-value">{stats?.revenueToday} {t('common.currency')}</span>
        </div>
      </motion.div>

      <motion.section
        initial={{y:20, opacity:0}}
        animate={{y:0, opacity:1}}
        transition={{delay:0.2}}
      >
        <h3 style={{marginTop:'3rem'}}>{t('admin.users')}</h3>
        <div className="users-list">
          {users.map((user, i) => (
            <motion.div 
              key={user.id} 
              className="user-card"
              initial={{opacity:0, x:-20}}
              animate={{opacity:1, x:0}}
              transition={{delay:0.1*i}}
            >
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-phone">{user.phone}</div>
              </div>
              <div className="user-card-status">
                {user.loyaltyCard?.status === 'active' ? (
                  <span className="badge-active">💎 {t('admin.cardActive')}</span>
                ) : (
                  <span className="badge-inactive">✗ {t('admin.cardInactive')}</span>
                )}
              </div>
              <div className="user-actions">
                {user.loyaltyCard?.status !== 'active' ? (
                  <motion.button 
                    className="btn-small btn-success"
                    onClick={() => giveCard(user.id)}
                    disabled={loading}
                    whileHover={{scale:1.05}}
                    whileTap={{scale:0.95}}
                  >
                    {t('admin.giveCard')}
                  </motion.button>
                ) : (
                  <motion.button 
                    className="btn-small btn-danger"
                    onClick={() => revokeCard(user.id)}
                    disabled={loading}
                    whileHover={{scale:1.05}}
                    whileTap={{scale:0.95}}
                  >
                    {t('admin.revokeCard')}
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section
        initial={{y:20, opacity:0}}
        animate={{y:0, opacity:1}}
        transition={{delay:0.3}}
      >
        <h3 style={{marginTop:'3rem'}}>{t('admin.orders')}</h3>
        <div className="orders-list">
          {orders.map((o, i) => (
            <motion.div 
              key={o.id} 
              className="order-card admin-order-card"
              initial={{opacity:0, y:10}}
              animate={{opacity:1, y:0}}
              transition={{delay:0.05*i}}
            >
              <div className="order-summary">
                <div className="order-summary-header">
                  <div className="order-summary-title">
                    <span className="order-id">#{o.id}</span>
                    <span className={`order-status status-${o.status}`}>{t(`order.status.${o.status}`)}</span>
                  </div>
                  <div className="order-summary-total">
                    {o.final_total || o.total} {t('common.currency')}
                  </div>
                </div>

                <div className="order-summary-body">
                  <div className="order-summary-row">
                    <span className="order-summary-label">{t('admin.summaryCustomer')}</span>
                    <span className="order-summary-value">{o.customer_name || t('admin.guest')} - {o.phone}</span>
                  </div>
                  <div className="order-summary-row">
                    <span className="order-summary-label">{t('admin.summaryItems')}</span>
                    <span className="order-summary-value">{o.items?.length || 0}</span>
                  </div>
                  {o.discount_applied > 0 && (
                    <div className="order-summary-row">
                      <span className="order-summary-label">{t('profile.discount')}</span>
                      <span className="order-summary-value discount-line">-{o.discount_applied} {t('common.currency')}</span>
                    </div>
                  )}
                  {(() => {
                    const info = getPickupInfo(o)
                    if(!info) {
                      return (
                        <div className="order-summary-row">
                          <span className="order-summary-label">{t('cart.pickupTime')}</span>
                          <span className="order-summary-value">{t('admin.noData')}</span>
                        </div>
                      )
                    }
                    const overdue = info.diffMinutes < 0
                    const minutes = Math.abs(info.diffMinutes)
                    return (
                      <div className={`order-timer ${overdue ? 'late' : 'soon'}`}>
                        <span className="order-summary-label">{t('admin.pickupAt')} {info.time}</span>
                        <span className="order-summary-value">
                          {overdue ? `${t('admin.overdue')} ${minutes} ${t('admin.minutes')}` : `${t('admin.pickupIn')} ${minutes} ${t('admin.minutes')}`}
                        </span>
                      </div>
                    )
                  })()}
                </div>
              </div>

              <div className="order-actions">
                {(() => {
                  const action = getPrimaryAction(o.status)
                  return (
                    <motion.button
                      className="btn-small btn-success"
                      onClick={() => action.next && setStatus(o.id, action.next)}
                      disabled={!action.next}
                      whileHover={{scale:1.05}}
                      whileTap={{scale:0.95}}
                    >
                      {action.label}
                    </motion.button>
                  )
                })()}
                <button
                  className="btn-small btn-outline"
                  onClick={() => toggleExpanded(o.id)}
                >
                  {expanded[o.id] ? t('admin.hideDetails') : t('admin.showDetails')}
                </button>
                <button
                  className="btn-small btn-ghost"
                  onClick={() => openReceipt(o)}
                >
                  {t('admin.openReceipt')}
                </button>
                <button
                  className="btn-small btn-danger"
                  onClick={() => setStatus(o.id, 'completed')}
                  disabled={o.status === 'completed'}
                >
                  {t('admin.closeOrder')}
                </button>
              </div>

              <div className="order-status-control">
                <span className="order-status-label">{t('admin.changeStatus')}</span>
                <select
                  value={o.status}
                  onChange={(e) => setStatus(o.id, e.target.value)}
                >
                  <option value="new">{t('order.status.new')}</option>
                  <option value="preparing">{t('order.status.preparing')}</option>
                  <option value="completed">{t('order.status.completed')}</option>
                </select>
              </div>

              <AnimatePresence initial={false}>
                {expanded[o.id] && (() => {
                  const { main, addons } = splitItems(o.items || [])
                  const mainGrouped = groupItems(main)
                  const addonGrouped = groupItems(addons)
                  return (
                    <motion.div
                      className="order-details-panel"
                      initial={{opacity:0, y:-6}}
                      animate={{opacity:1, y:0}}
                      exit={{opacity:0, y:-6}}
                      transition={{duration:0.2}}
                    >
                      <div className="order-section">
                        <h4>{t('admin.orderComposition')}</h4>
                        {mainGrouped.length === 0 ? (
                          <p className="order-empty">{t('admin.noData')}</p>
                        ) : (
                          <ul className="order-items-list">
                            {mainGrouped.map((g, idx) => {
                              const size = g.size && g.size !== 'add' && g.size !== 'shot' ? ` - ${g.size}` : ''
                              const total = g.price * g.count
                              return (
                                <li key={`${g.name}-${idx}`}>
                                  <span className="order-item-name">{g.name}{size}</span>
                                  <span className="order-item-qty">x{g.count}</span>
                                  <span className="order-item-price">{total} {t('common.currency')}</span>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </div>

                      <div className="order-section">
                        <h4>{t('admin.addons')}</h4>
                        {addonGrouped.length === 0 ? (
                          <p className="order-empty">{t('admin.noData')}</p>
                        ) : (
                          <ul className="order-items-list">
                            {addonGrouped.map((g, idx) => {
                              const total = g.price * g.count
                              return (
                                <li key={`${g.name}-addon-${idx}`}>
                                  <span className="order-item-name">{g.name}</span>
                                  <span className="order-item-qty">x{g.count}</span>
                                  <span className="order-item-price">+{total} {t('common.currency')}</span>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </div>

                      <div className="order-comment-box">
                        <div className="order-comment-title">{t('cart.comment')}</div>
                        <div className="order-comment-text">{o.comment || t('admin.noComment')}</div>
                      </div>
                    </motion.div>
                  )
                })()}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  )
}
