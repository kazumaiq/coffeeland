const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const db = require('./db')

const app = express()
app.use(cors())
app.use(express.json())

const isVercel = !!process.env.VERCEL

// routes
app.use('/api/orders', require('./routes/orders')(db))
app.use('/api/users', require('./routes/users')(db))

// serve public assets
app.use('/public', express.static(path.join(__dirname, '..', 'public')))

// in production serve built frontend (local/prod only)
if (process.env.NODE_ENV === 'production' && !isVercel){
  const dist = path.join(__dirname, '..', 'dist')
  if (fs.existsSync(dist)){
    app.use(express.static(dist))
    app.get('*', (req,res)=>{
      res.sendFile(path.join(dist, 'index.html'))
    })
  }
}

module.exports = app
