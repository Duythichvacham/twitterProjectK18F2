import { Router } from 'express'
import { loginController } from '~/controllers/users.controller'
import { loginValidator, registerValidator } from '~/middlewares/users.middlewares'
import { registerController } from '~/controllers/users.controller'
const usersRouter = Router()

//controller - Router
usersRouter.post('/login', loginValidator, loginController)
/*
// quy ước: value trong mongo dùng cú pháp snake_case
Description: Register new user
Path: /register\
Metho: POST
body:{ 
    name: string
    email: string
    password: string
    confirm_password: string
    date_of_birth: string theo chuẩn ISO 8601
    //let a = new Date().toISOString()
    undefined
    a
    '2023-10-20T12:57:06.216Z'
    vào trang web bất kì gõ như trên để lấy đoạn date theo chuẩn ISOString
}
*/
usersRouter.post('/register', registerValidator, registerController)
export default usersRouter
