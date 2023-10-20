import express from 'express'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
const app = express()
const port = 3000
databaseService.connect()
app.use(express.json()) // tự động parse
app.get('/', (req, res) => {
  res.send('hello world')
})

app.use('/users', usersRouter) // route handler
app.listen(port, () => {
  console.log(`Project twitter này đang chạy trên post ${port}`)
})
