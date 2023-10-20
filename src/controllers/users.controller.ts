import { Request, Response } from 'express'
import userService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { RegisterReqBody } from '~/models/requests/User.requests'
export const loginController = (req: Request, res: Response) => {
  //service
  const { email, password } = req.body
  if (email === 'test@gmail.com' && password === '123456') {
    res.json({
      data: [
        { fname: 'Điệp', yob: 1999 },
        { fname: 'Hùng', yob: 2003 },
        { fname: 'Được', yob: 1994 }
      ]
    })
  } else {
    res.status(400).json({
      message: 'login failed'
    })
  }
}
export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  // const { email, password } = req.body // luồng : user nhập => gửi req lên server - server nhận req - thằng muốn post lên nằm ở body
  //body ở đây đang là any - k bị ràng buộc - có thể truyền thêm dữ liệu
  try {
    // tạo 1 user mới và bỏ vào collection users trong database
    const result = await userService.register(req.body)
    return res.status(201).json({
      message: 'register successfully',
      result
    })
  } catch (error) {
    return res.status(404).json({
      message: 'register failed'
    })
  }
}
