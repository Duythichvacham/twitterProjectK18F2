import express from 'express'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
const app = express()
const port = 3000
databaseService.connect()
app.use(express.json()) // tự động parse
app.get('/', (req, res) => {
  res.send('hello world')
})

app.use('/users', usersRouter) // route handler
// nơi tất cả lỗi dồn về - xử lý lỗi - mấy thằng kia next lỗi thì nó đi tìm err handler gần nhất - trong k có thì ra ngoài và cuối cùng đến đây
// err từ rất nhiều nơi truyền về nên mình sẽ éo biết cụ thể nó là gì
app.use(defaultErrorHandler)
app.listen(port, () => {
  console.log(`Project twitter này đang chạy trên post ${port}`)
})
// dạng app mình làm: verify email để xài thêm tính năng
