const express = require('express')

module.exports = function(db){
  const router = express.Router()

  router.post('/', async (req,res)=>{
    try {
      const { customer_name, phone, items, total, guest, pickup_time, comment } = req.body
      if(!phone) return res.status(400).json({ error: 'phone required' })
      if(!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'items required' })

      const now = new Date().toISOString()
      
      let discountApplied = 0
      let finalTotal = total

      const userRes = await db.query(
        `SELECT u.id, lc.status, lc.discount_percent
         FROM users u
         LEFT JOIN loyalty_cards lc ON lc.user_id = u.id
         WHERE u.phone = $1`,
        [phone]
      )

      if(userRes.rowCount > 0){
        const row = userRes.rows[0]
        if(row.status === 'active'){
          discountApplied = Math.round(total * (row.discount_percent || 10) / 100)
          finalTotal = total - discountApplied
        }
      }

      const order = await db.transaction(async (client) => {
        const insertOrder = await db.query(
          `INSERT INTO orders 
            (customer_name, phone, total, discount_applied, final_total, guest, status, created_at, pickup_time, comment)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           RETURNING *`,
          [
            customer_name,
            phone,
            total,
            discountApplied,
            finalTotal,
            guest ? 1 : 0,
            'new',
            now,
            pickup_time || null,
            comment || null
          ],
          client
        )

        const orderRow = insertOrder.rows[0]
        const insertItemText = 'INSERT INTO order_items (order_id, item_id, name, size, price) VALUES ($1,$2,$3,$4,$5)'

        for(const it of items){
          await db.query(
            insertItemText,
            [orderRow.id, it.id, it.name_en || it.name_ru || it.id, it.size, it.price],
            client
          )
        }

        return orderRow
      })

      res.json({ order, discountApplied, finalTotal })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: e.message })
    }
  })

  router.get('/', async (req,res)=>{
    try {
      const phone = req.query.phone
      if(phone){
        const orders = await db.query('SELECT * FROM orders WHERE phone=$1 ORDER BY id DESC', [phone])
        const ordersWithItems = []
        for(const o of orders.rows){
          const items = await db.query('SELECT * FROM order_items WHERE order_id=$1', [o.id])
          ordersWithItems.push({ ...o, items: items.rows })
        }
        return res.json({ orders: ordersWithItems })
      }
      
      if(req.headers['x-admin']!=='1') return res.status(403).send('forbidden')
      const orders = await db.query('SELECT * FROM orders ORDER BY id DESC')
      const ordersWithItems = []
      for(const o of orders.rows){
        const items = await db.query('SELECT * FROM order_items WHERE order_id=$1', [o.id])
        ordersWithItems.push({ ...o, items: items.rows })
      }
      res.json(ordersWithItems)
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: e.message })
    }
  })

  router.put('/:id/status', async (req,res)=>{
    if(req.headers['x-admin']!=='1') return res.status(403).send('forbidden')
    const { status } = req.body
    await db.query('UPDATE orders SET status=$1 WHERE id=$2', [status, req.params.id])
    res.json({ ok:true })
  })

  router.get('/stats', async (req,res)=>{
    if(req.headers['x-admin']!=='1') return res.status(403).send('forbidden')
    const { start, end } = req.query
    let where = ''
    const params = []
    if(start){ where += " AND created_at::date >= $1"; params.push(start) }
    if(end){ where += ` AND created_at::date <= $${params.length+1}`; params.push(end) }

    const totalOrders = await db.query('SELECT COUNT(*)::int as c FROM orders WHERE 1=1 ' + where, params)
    const totalRevenue = await db.query('SELECT COALESCE(SUM(final_total),0)::int as s FROM orders WHERE 1=1 ' + where, params)
    const today = new Date().toISOString().slice(0,10)
    const ordersToday = await db.query('SELECT COUNT(*)::int as c FROM orders WHERE created_at::date=$1', [today])
    const revenueToday = await db.query('SELECT COALESCE(SUM(final_total),0)::int as s FROM orders WHERE created_at::date=$1', [today])

    const popular = await db.query(
      'SELECT name, COUNT(*)::int as cnt FROM order_items JOIN orders ON order_items.order_id = orders.id WHERE 1=1 ' + where + ' GROUP BY name ORDER BY cnt DESC LIMIT 10',
      params
    )

    res.json({
      totalOrders: totalOrders.rows[0].c,
      totalRevenue: totalRevenue.rows[0].s,
      ordersToday: ordersToday.rows[0].c,
      revenueToday: revenueToday.rows[0].s,
      popular: popular.rows
    })
  })

  router.get('/user/:phone', async (req,res)=>{
    const phone = req.params.phone
    const orders = await db.query('SELECT * FROM orders WHERE phone=$1 ORDER BY id DESC', [phone])
    const ordersWithItems = []
    for(const o of orders.rows){
      const items = await db.query('SELECT * FROM order_items WHERE order_id=$1', [o.id])
      ordersWithItems.push({ ...o, items: items.rows })
    }
    res.json(ordersWithItems)
  })

  return router
}
