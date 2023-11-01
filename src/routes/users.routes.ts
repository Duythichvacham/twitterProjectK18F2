import { Router } from 'express'
import {
  emailVerifyController,
  forgotPasswordController,
  loginController,
  logoutController,
  resendEmailVerifyController,
  verifyForgotPasswordTokenController
} from '~/controllers/users.controller'
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  verifyForgotPasswordTokenValidator
} from '~/middlewares/users.middlewares'
import { registerController } from '~/controllers/users.controller'
const usersRouter = Router()
import { wrapAsync } from '~/utils/handler'
import { verify } from 'crypto'
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

// thường ngta sẽ k gửi đoạn token lên email cho client luôn mà là gửi 1 link chứa token
// khi ngta click vào link thì mới gửi token lên server
// nếu nó chưa verify : verify == 0
//=> vào database cập nhật: chỉnh email_verify_token = "", verify = 1,update_at new Date()

/*link có email_verify_token: - 
des: verify email
method : POST
path: /users/verify-email?token=<> -- thường nó là vậy
* mình truyền qua body
path: /users/verify-email
body:{
  email_verify_token: string
}
*/
usersRouter.post('/verify-email', emailVerifyTokenValidator, wrapAsync(emailVerifyController))
/*
des: resend verify email
method: post
path: /users/resend-verify-email
header:{
  Authorization: "Bearer <access_token>"
}
// có 2 cách: 1 nếu theo hướng phải verify email thì mới cho đăng nhập thì gửi lại email pass thông qua body
// mình theo hướng đăng nhập rồi mới cần verify email thì gửi access qua header để xác nhận
 */
usersRouter.post('/resend-verify-email', accessTokenValidator, wrapAsync(resendEmailVerifyController))
/*forgot-password
des: forgot password
method: post
path: /users/forgot-password
body:{
  email: string
}
*/
usersRouter.post('/forgot-password', forgotPasswordValidator, wrapAsync(forgotPasswordController))
/*verify forgot-passwordToken
des: verify forgot password 
method: post
path: /users/verify-forgot-password
body:{
  forgot_password_token: string
}
 */
usersRouter.post(
  '/verify-forgot-password',
  verifyForgotPasswordTokenValidator,
  wrapAsync(verifyForgotPasswordTokenController)
)
export default usersRouter
