import { NextFunction, Request, Response } from 'express'
import userService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import {
  GetProfileReqParams,
  LoginReqBody,
  LogoutReqBody,
  RegisterReqBody,
  TokenPayLoad,
  UpdateMeReqBody,
  ResetPasswordReqBody,
  FollowReqBody,
  UnfollowReqParams
} from '~/models/requests/User.requests'
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
  // verify này có thể là UserVerifyStatus or undefined mà mình biết nó là gì nên địng nghĩa luôn
  const result = await userService.login({ user_id: user_id.toString(), verify: user.verify }) // thằng này nó lấy từ user_id nên nó là obj id nên phải toString
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
  const { _id, verify } = req.user as User
  // update  lại  forgot_password_token
  const result = await userService.forgotPassword({ user_id: (_id as ObjectId).toString(), verify })
  return res.json(result)
}
export const verifyForgotPasswordTokenController = async (req: Request, res: Response) => {
  // đã làm hết ở middleware: verifyForgotPasswordTokenValidator - đối chiếu các thứ
  return res.json({
    message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS
  })
}
export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response
) => {
  // muốn update new pass thì phải có user_id và new pass
  const { user_id } = req.decoded_forgot_password_token as TokenPayLoad
  const { password } = req.body
  // update password for user
  const result = await userService.resetPassword({ user_id, password }) // nếu tên property trùng tên biến thì k cần ghi lại
  return res.json(result)
}
export const getMeController = async (req: Request, res: Response) => {
  // muốn lấy thông tin user thì cần user_id
  const { user_id } = req.decoded_authorization as TokenPayLoad
  // vào db và lấy tt
  const user = await userService.getMe(user_id)
  return res.json({
    message: USERS_MESSAGES.GET_ME_SUCCESS,
    result: user
  })
}
export const updateMeController = async (req: Request<ParamsDictionary, any, UpdateMeReqBody>, res: Response) => {
  // muốn update thì cần user_id và thông tin cần update
  const { user_id } = req.decoded_authorization as TokenPayLoad
  //pick: lấy những thằng mình muốn lấy -- k nên dùng trực tiếp ở đây
  const { body } = req // dùng body nhớ định nghĩa cho nó nhắc code :V
  // update
  const result = await userService.updateMe({ user_id, payload: body })
  return res.json({ message: USERS_MESSAGES.UPDATE_ME_SUCCESS, result })
}
export const getProfileController = async (req: Request<GetProfileReqParams>, res: Response) => {
  // muốn lấy thông tin user thì cần user_id
  const { username } = req.params // đụng đến req => định nghĩa lại
  // vào db và lấy tt
  const user = await userService.getProfile(username)
  return res.json({
    message: USERS_MESSAGES.GET_PROFILE_SUCCESS,
    result: user
  })
}
export const followController = async (
  req: Request<ParamsDictionary, any, FollowReqBody>,
  res: Response,
  next: NextFunction
) => {
  // muốn follow thì cần user_id và followed_user_id
  const { user_id } = req.decoded_authorization as TokenPayLoad
  const { followed_user_id } = req.body
  // follow
  const result = await userService.follow({ user_id, followed_user_id })
  return res.json({
    result
  })
}
export const unfollowController = async (req: Request<UnfollowReqParams>, res: Response, next: NextFunction) => {
  // muốn unfollow thì cần user_id và unfollowed_user_id
  const { user_id } = req.decoded_authorization as TokenPayLoad // user đang đi unfollow
  const { user_id: followed_user_id } = req.params // user truyền lên để unfollow - trùng tên đặt lại cho nó
  // unfollow
  const result = await userService.unfollow({ user_id, followed_user_id })
  return res.json({
    result
  })
}
