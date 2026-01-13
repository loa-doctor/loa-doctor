import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { connectMongo } from './db/mongo.js'

const app = express()

connectMongo()

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'loa-doctor-server',
  })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`${PORT} 포트 수신중..`)
})
