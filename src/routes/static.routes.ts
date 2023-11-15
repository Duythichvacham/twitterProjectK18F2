import { Router } from 'express'
import { serveImageController, serveVideoController } from '~/controllers/medias.controllers'
import { wrapAsync } from '~/utils/handler'
const staticRouter = Router()
staticRouter.get('/image/:namefile', wrapAsync(serveImageController))
// stream video: cứ đc 1 đoạn thì nó sẽ gửi 1 req lên server, server sẽ gửi 1 đoạn xuống client
staticRouter.get('/video-stream/:namefile', wrapAsync(serveVideoController))
export default staticRouter
