import { NextFunction, Request, Response } from 'express'
import userService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { LoginReqBody, LogoutReqBody, RegisterReqBody, TokenPayLoad } from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schema'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '~/constants/messages'
import { UserVerifyStatus } from '~/constants/enums'
import databaseService from '~/services/database.services'
import HTTP_STATUS from '~/constants/httpstatus'
import { ErrorWithStatus } from '~/models/Errors'
export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  // vô đến đây là đăng nhập thành công
  // server tạo access token và refresh token để đưa cho client
  const user = req.user as User // user này có thể là user or undefined mà mình biết nó là gì nên địng nghĩa luôn
  const user_id = user._id as ObjectId //_id này có thể là ObjId or undefined mà mình biết nó là gì nên địng nghĩa luôn
  const result = await userService.login(user_id.toString()) // thằng này nó lấy từ user_id nên nó là obj id nên phải toString
  return res.status(200).json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result
  })
}
export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response,
  next: NextFunction
) => {
  // const { email, password } = req.body // luồng : user nhập => gửi req lên server - server nhận req - thằng muốn post lên nằm ở body
  //body ở đây đang là any - k bị ràng buộc - có thể truyền thêm dữ liệu
  // tạo 1 user mới và bỏ vào collection users trong database
  const result = await userService.register(req.body)
  return res.status(201).json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result
  })
}
export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  const { refresh_token } = req.body
  // logout thì nhận => tìm và xóa refresh token trong db
  const result = await userService.logout(refresh_token)
  res.json(result)
}

export const emailVerifyController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayLoad
  const user = req.user as User
  if (user.verify === UserVerifyStatus.Verified) {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    })
  }
  // nếu xuống đây tức là chưa verify, chưa bị banned, và mã khớp
  // tiến hành verify - chỉnh 3 thằng
  const result = await userService.verifyEmail(user_id)
  return res.json({
    message: USERS_MESSAGES.EMAIL_VERIFY_SUCCESS,
    result
  })
}
// resend khi thất lạc email verify token
export const resendEmailVerifyController = async (req: Request, res: Response) => {
  // nếu code vào được đây tức là đã đi qua tầng accessTokenValidator
  // trong req có decoded_authorization
  const { user_id } = req.decoded_authorization as TokenPayLoad
  // tìm user trong db
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  // nếu k có
  if (!user) {
    throw new ErrorWithStatus({ message: USERS_MESSAGES.USER_NOT_FOUND, status: HTTP_STATUS.NOT_FOUND })
  }
  // banned
  if (user.verify === UserVerifyStatus.Banned) {
    throw new ErrorWithStatus({ message: USERS_MESSAGES.USER_BANNED, status: HTTP_STATUS.FORBIDDEN })
  }
  // verified
  if (user.verify === UserVerifyStatus.Verified) {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    })
  }
  // chưa verify
  const result = await userService.resendEmailVerify(user_id)
  return res.json({
    message: USERS_MESSAGES.EMAIL_VERIFY_SUCCESS,
    result
  })
}
// forgot password
export const forgotPasswordController = async (req: Request, res: Response) => {
  // lấy user_id từ req.user
  const { _id } = req.user as User
  // update  lại  forgot_password_token
  const result = await userService.forgotPassword((_id as ObjectId).toString())
  return res.json(result)
}
export const verifyForgotPasswordTokenController = async (req: Request, res: Response) => {
  return res.json({
    message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_SUCCESS
  })
}
