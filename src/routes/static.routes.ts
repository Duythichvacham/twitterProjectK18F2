import { Router } from 'express'
import { serveImageControler } from '~/controllers/medias.controllers'
import { wrapAsync } from '~/utils/handler'
const staticRouter = Router()
staticRouter.get('/image/:filename', wrapAsync(serveImageControler))
export default staticRouter
