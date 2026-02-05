const express = require('express')

module.exports = function(db){
  const router = express.Router()

  router.post('/login', async (req,res)=>{
    try {
      const { phone, name } = req.body
      if(!phone) return res.status(400).json({ error: 'phone required' })

      const existing = await db.query('SELECT * FROM users WHERE phone=$1', [phone])
      if(existing.rowCount > 0) {
        const user = existing.rows[0]
        const cardRes = await db.query('SELECT * FROM loyalty_cards WHERE user_id=$1', [user.id])
        return res.json({ ...user, loyaltyCard: cardRes.rows[0] || null })
      }

      const insert = await db.query(
        'INSERT INTO users (name, phone, avatar) VALUES ($1,$2,$3) RETURNING *',
        [name || '', phone, null]
      )
      const user = insert.rows[0]
      const cardRes = await db.query('SELECT * FROM loyalty_cards WHERE user_id=$1', [user.id])
      res.json({ ...user, loyaltyCard: cardRes.rows[0] || null })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: e.message })
    }
  })

  router.get('/:phone/orders', async (req,res)=>{
    try {
      const phone = req.params.phone
      const orders = await db.query('SELECT * FROM orders WHERE phone=$1 ORDER BY id DESC', [phone])
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

  router.get('/:phone/loyalty', async (req,res)=>{
    try {
      const phone = req.params.phone
      const user = await db.query('SELECT * FROM users WHERE phone=$1', [phone])
      if(user.rowCount === 0) return res.json(null)
      const card = await db.query('SELECT * FROM loyalty_cards WHERE user_id=$1', [user.rows[0].id])
      res.json(card.rows[0] || null)
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: e.message })
    }
  })

  // Admin: get all users with their loyalty cards
  router.get('/admin/users', async (req,res)=>{
    try {
      if(req.headers['x-admin']!=='1') return res.status(403).send('forbidden')
      const result = await db.query(`
        SELECT 
          u.*,
          lc.id as loyalty_id,
          lc.status as loyalty_status,
          lc.discount_percent,
          lc.created_at as loyalty_created_at,
          lc.activated_at
        FROM users u
        LEFT JOIN loyalty_cards lc ON lc.user_id = u.id
        ORDER BY u.id DESC
      `)

      const users = result.rows.map(r => {
        const user = {
          id: r.id,
          name: r.name,
          phone: r.phone,
          avatar: r.avatar,
          created_at: r.created_at
        }
        if (r.loyalty_id) {
          user.loyaltyCard = {
            id: r.loyalty_id,
            user_id: r.id,
            status: r.loyalty_status,
            discount_percent: r.discount_percent,
            created_at: r.loyalty_created_at,
            activated_at: r.activated_at
          }
        }
        return user
      })

      res.json({ users })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: e.message })
    }
  })

  // Admin: give/revoke loyalty card
  router.patch('/admin/users/:id/loyalty', async (req,res)=>{
    try {
      if(req.headers['x-admin']!=='1') return res.status(403).send('forbidden')
      const { action } = req.body
      const userId = req.params.id
      
      if(action === 'give') {
        await db.query(
          `INSERT INTO loyalty_cards (user_id, status, discount_percent, activated_at)
           VALUES ($1, 'active', 10, NOW())
           ON CONFLICT (user_id)
           DO UPDATE SET status='active', discount_percent=10, activated_at=NOW()`,
          [userId]
        )
      } else if(action === 'revoke') {
        await db.query('UPDATE loyalty_cards SET status=$1 WHERE user_id=$2', ['inactive', userId])
      }
      
      const userRes = await db.query('SELECT * FROM users WHERE id=$1', [userId])
      const cardRes = await db.query('SELECT * FROM loyalty_cards WHERE user_id=$1', [userId])
      res.json({ user: userRes.rows[0], card: cardRes.rows[0] || null })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: e.message })
    }
  })

  return router
}
