// file này để định nghĩa lại các module mà mình sử dụng
// định nghĩa lại request truyền lên
import { Request } from 'express'
import User from './models/schemas/User.schema'
import { TokenPayLoad } from './models/requests/User.requests'

// định nghĩa: nói cho request này biết nó có thể có hoặc k thằng user
declare module 'express' {
  interface Request {
    user?: User
    decoded_authorization?: TokenPayLoad
    decoded_refresh_token?: TokenPayLoad
    decoded_email_verify_token?: TokenPayLoad
  }
}
