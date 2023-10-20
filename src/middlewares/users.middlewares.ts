// 1 ai đó truy cập vào/ login
// client sẽ gửi cho mình mail và password
//client sẽ tạo 1 req gửi server
// username và pass sẽ nằm ở req.body
// viết 1 middlewares xử lý validator của req body
import { Request, Response, NextFunction } from 'express'
import { checkSchema } from 'express-validator'
import userService from '~/services/users.services'
import { validate } from '~/utils/validation'
export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({
      message: 'missing email or password'
    })
  }
  next()
}
// thằng này k báo lỗi - vô validationResult để lấy lỗi
// trỏ vào checkSchema - crtl
export const registerValidator = validate(
  checkSchema({
    //custom -- mô tả thuộc tính cần validated
    name: {
      notEmpty: true, // k duoc empty
      isString: true,
      trim: true,
      isLength: {
        options: {
          min: 1,
          max: 100
        }
      }
    },
    email: {
      notEmpty: true,
      isString: true,
      trim: true,
      custom: {
        options: async (value, { req }) => {
          const isExist = await userService.checkEmailExist(value)
          if (isExist) {
            throw new Error('Email already exists')
          }
        }
      }
    },
    password: {
      notEmpty: true,
      isString: true,
      isLength: {
        options: {
          min: 8,
          max: 50
        }
      },
      isStrongPassword: {
        options: {
          minLength: 8,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
          // returnScore: true // chấm điểm độ mạnh yếu pass - để false nó cho mình biết mạnh hay yếu thôi
        }
      },
      errorMessage:
        'password mus be at least 8 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol'
    },
    confirm_password: {
      notEmpty: true,
      isString: true,
      isLength: {
        options: {
          min: 8,
          max: 50
        }
      },
      isStrongPassword: {
        options: {
          minLength: 8,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
          // returnScore: true // chấm điểm độ mạnh yếu pass - để false nó cho mình biết mạnh hay yếu thôi
        }
      },
      errorMessage:
        'Confirm_password mus be at least 8 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol',
      custom: {
        options: (value, { req }) => {
          //value là confirm_password vì nó đang trong field confirm_password
          //req là cái req hiện tại -- đang nhập thông tin từ ngoài vào
          if (value !== req.body.password) {
            throw new Error('confirm_password does not match password')
          }
          return true
        }
      }
    },
    date_of_birth: {
      isISO8601: {
        options: {
          strict: true, // ép nhập chuẩn ngày tháng năm
          strictSeparator: true // chuỗi đc thêm dấu gạch ngang
        }
      }
    }
  })
)
