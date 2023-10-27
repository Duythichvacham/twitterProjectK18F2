// định nghĩa lại request truyền lên
import { Request } from 'express'
import User from './models/schemas/User.schema'

// định nghĩa: nói cho request này biết nó có thể có hoặc k thằng user
declare module 'express' {
  interface Request {
    user?: User
  }
}
