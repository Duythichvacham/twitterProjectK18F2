import { NextFunction, Request, Response } from 'express'
import userService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { RegisterReqBody } from '~/models/requests/User.requests'
export const loginController = async (req: Request, res: Response) => {
  // vô đến đây là đăng nhập thành công
  // server tạo access token và refresh token để đưa cho client
  const { user }: any = req // định nghĩa sau
  const user_id = user._id
  const result = await userService.login(user_id.toString()) // thằng này nó lấy từ user_id nên nó là obj id nên phải toString
  return res.status(200).json({
    message: 'login successfully',
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
    message: 'register successfully',
    result
  })
}
