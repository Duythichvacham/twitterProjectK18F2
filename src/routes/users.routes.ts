import { Router } from 'express'
import {
  emailVerifyController,
  forgotPasswordController,
  getMeController,
  getProfileController,
  loginController,
  logoutController,
  resendEmailVerifyController,
  resetPasswordController,
  updateMeController,
  verifyForgotPasswordTokenController
} from '~/controllers/users.controller'
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  updateMeValidator,
  verifiedUserValidator,
  verifyForgotPasswordTokenValidator
} from '~/middlewares/users.middlewares'
import { registerController } from '~/controllers/users.controller'
const usersRouter = Router()
import { wrapAsync } from '~/utils/handler'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import { UpdateMeReqBody } from '~/models/requests/User.requests'

//controller - Router
usersRouter.post('/login', loginValidator, wrapAsync(loginController))
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
/**des:reset-password - mô phỏng trang đổi pass :V
 * method: post
 * path: /users/reset-password
 * header: k cần vì nó quên pass r còn đâu
 * body:{
 * forgot_password_token: string
 * password: string
 * confirm_password: string
 * }
 */
usersRouter.post(
  '/reset-password',

  verifyForgotPasswordTokenValidator,
  resetPasswordValidator,

  wrapAsync(resetPasswordController)
)
/*
des: get profile của user
path: '/me'
method: get
Header: {Authorization: Bearer <access_token>}
body: {}
*/
usersRouter.get('/me', accessTokenValidator, wrapAsync(getMeController))

// phải đăng nhập r - có authorization mới được update
// access_token - khi mình tạo ra chứa verify = 0 - khi mình verify thành 1 trên server - thằng access vẫn giữ nguyên trạng thái
// chỉnh : sử dụng socket.io: nó có khả năng bắn ngược req cho sv - reset lại access_token của nó
// :V có thể login lại cho nó cập nhật lại access_token
usersRouter.patch(
  '/me',
  accessTokenValidator,
  verifiedUserValidator,
  filterMiddleware<UpdateMeReqBody>([
    // lọc ra những thằng mình muốn update - deo được truyền thêm thằng nào vào đây
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'avatar',
    'username',
    'cover_photo'
  ]),
  updateMeValidator,
  wrapAsync(updateMeController)
)
/**des: get profile của user khác bằng username
 * path: '/:username'
 * method: get
 * k cần headers vì k cần đăng nhập cũng xem đc
 */
usersRouter.get('/:username', wrapAsync(getProfileController))
export default usersRouter
// lưu thêm trạng thái của user vào token luôn  - đỡ phải lấy user_id vào kiếm user......
