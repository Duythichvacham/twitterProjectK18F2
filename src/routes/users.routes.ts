import { Router } from 'express'
import { loginController, logoutController } from '~/controllers/users.controller'
import {
  accessTokenValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator
} from '~/middlewares/users.middlewares'
import { registerController } from '~/controllers/users.controller'
const usersRouter = Router()
import { wrapAsync } from '~/utils/handler'
//controller - Router
usersRouter.get('/login', loginValidator, wrapAsync(loginController))
/*
// quy ước: value trong mongo dùng cú pháp snake_case
Description: Register new user
Path: /register
Method: POST
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
usersRouter.post('/register', registerValidator, wrapAsync(registerController))
/*Description: logout
Path: /users/logout
method: POST
header: {Authorization: 'Bearer <access_token>'}// Bearer dấu cách <access_token> 
body: {refresh_token: string}

*/
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController))
export default usersRouter
