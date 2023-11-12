import express from 'express'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import { initFolder } from './utils/file'
import mediasRouter from './routes/medias.routes'
import { config } from 'dotenv'

import staticRouter from './routes/static.routes'
config()
const app = express()
// khi mình code thì nó là PORT 4000
// nhưng khi mình build thì nó là domain mà mình đang dùng

const port = process.env.PORT || 4000
databaseService.connect().then(() => {
  // sau khi connect thì mới tạo index
  databaseService.indexUsers()
})
initFolder() //tạo folder uploads
app.use(express.json()) // tự động parse
app.get('/', (req, res) => {
  res.send('hello world')
})

app.use('/users', usersRouter) // route handler
// uploads,xử lý image, video
app.use('/medias', mediasRouter) //route handler
// Serving static file : là hành động cung cấp các tệp tỉnh cho client bằng server
// ta sẽ chia sẽ folder 'uploads' của máy chủ cho client truy cập và sử dụng hình ảnh
// app.use('/static', express.static(UPLOAD_DIR)) // thằng này là mặc định
app.use('/static', staticRouter)
// nơi tất cả lỗi dồn về - xử lý lỗi - mấy thằng kia next lỗi thì nó đi tìm err handler gần nhất - trong k có thì ra ngoài và cuối cùng đến đây
// err từ rất nhiều nơi truyền về nên mình sẽ éo biết cụ thể nó là gì
//thêm
// tạo folder upload

app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log(`Project twitter này đang chạy trên post ${port}`)
})
// dạng app mình làm: verify email để xài thêm tính năng
