import { NextFunction, Request, Response } from 'express'
import userService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { RegisterReqBody } from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schema'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '~/constants/messages'
export const loginController = async (req: Request, res: Response) => {
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
export const logoutController = async (req: Request, res: Response) => {
  const { refresh_token } = req.body
  // logout thì nhận => tìm và xóa refresh token trong db
  const result = await userService.logout(refresh_token)
  res.json(result)
}
