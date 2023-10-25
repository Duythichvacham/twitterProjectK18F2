// 1 ai đó truy cập vào/ login
// client sẽ gửi cho mình mail và password
//client sẽ tạo 1 req gửi server
// username và pass sẽ nằm ở req.body
// viết 1 middlewares xử lý validator của req body
import { Request, Response, NextFunction } from 'express'
import { check, checkSchema } from 'express-validator'
import { has } from 'lodash'
import { USERS_MESSAGES } from '~/constants/messages'
import databaseService from '~/services/database.services'
import userService from '~/services/users.services'
import { hashPassword } from '~/utils/crypto'
import { validate } from '~/utils/validation'
//body: {email and password}
export const loginValidator = validate(
  checkSchema({
    email: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
      },
      isEmail: {
        errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
      },
      trim: true,
      custom: {
        options: async (value, { req }) => {
          // tìm user có email và pass giống client đưa
          const user = await databaseService.users.findOne({ email: value, password: hashPassword(req.body.password) }) // vì pass mình mã hóa r
          if (user === null) {
            throw new Error(USERS_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT)
          }
          req.user = user // lưu user vào req để dùng ở controller
          return true
        }
      }
    },
    password: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
      },
      isLength: {
        options: {
          min: 8,
          max: 50
        },
        errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
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
      errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG // thông báo tổng khi lỗi tùm lum
    }
  })
)
// thằng này k báo lỗi - vô validationResult để lấy lỗi
// trỏ vào checkSchema - crtl
export const registerValidator = validate(
  checkSchema({
    //custom -- mô tả thuộc tính cần validated
    name: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED
      }, // k duoc empty
      isString: {
        errorMessage: USERS_MESSAGES.NAME_MUST_BE_A_STRING
      },
      trim: true,
      isLength: {
        options: {
          min: 1,
          max: 100
        },
        errorMessage: USERS_MESSAGES.NAME_LENGTH_MUST_BE_FROM_1_TO_100
      }
    },
    email: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
      },
      isEmail: {
        errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
      },
      trim: true,
      custom: {
        options: async (value, { req }) => {
          const isExist = await userService.checkEmailExist(value)
          if (isExist) {
            throw new Error(USERS_MESSAGES.EMAIL_ALREADY_EXISTS)
          }
          return true
        }
      }
    },
    password: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
      },
      isLength: {
        options: {
          min: 8,
          max: 50
        },
        errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
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
      errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG // thông báo tổng khi lỗi tùm lum
    },
    confirm_password: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING
      },
      isLength: {
        options: {
          min: 8,
          max: 50
        },
        errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
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
      errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG, // thông báo tổng khi lỗi tùm lum
      custom: {
        options: (value, { req }) => {
          //value là confirm_password vì nó đang trong field confirm_password
          //req là cái req hiện tại -- đang nhập thông tin từ ngoài vào
          if (value !== req.body.password) {
            throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
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
      },
      errorMessage: USERS_MESSAGES.DATE_OF_BIRTH_BE_ISO8601
    }
  })
)
