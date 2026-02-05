require('dotenv').config()
const app = require('./app')

function startServer(port){
  const server = app.listen(port, ()=> console.log('Server listening on', port))
  server.on('error', (err)=>{
    if(err.code === 'EADDRINUSE'){
      console.warn(`Port ${port} in use, trying ${port+1}`)
      startServer(port+1)
    } else {
      console.error(err)
      process.exit(1)
    }
  })
}

const initialPort = process.env.PORT ? parseInt(process.env.PORT,10) : 4000
startServer(initialPort)
