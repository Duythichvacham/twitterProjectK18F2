// 1 ai đó truy cập vào/ login
// client sẽ gửi cho mình mail và password
//client sẽ tạo 1 req gửi server
// username và pass sẽ nằm ở req.body
// viết 1 middlewares xử lý validator của req body
import { Request } from 'express'
import { checkSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { capitalize } from 'lodash'
import HTTP_STATUS from '~/constants/httpstatus'
import { USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import databaseService from '~/services/database.services'
import userService from '~/services/users.services'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'
//body: {email and password}
export const loginValidator = validate(
  checkSchema(
    {
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
            const user = await databaseService.users.findOne({
              email: value,
              password: hashPassword(req.body.password)
            }) // vì pass mình mã hóa r
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
    },
    ['body'] // bth nó sẽ tìm full trong req // này là chỉ tìm trong body
  )
)
// thằng này k báo lỗi - vô validationResult để lấy lỗi
// trỏ vào checkSchema - crtl
export const registerValidator = validate(
  checkSchema(
    {
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
    },
    ['body']
  )
)
export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        trim: true, // xóa khoảng trắng ở đầu và cuối tránh lỗi
        custom: {
          options: async (value: string, { req }) => {
            //nếu value là null thì ta sẽ gán nó bằng chuỗi rỗng
            //thì khi băm ra nó vẫn là chuỗi ""
            const accessToken = (value || '').split(' ')[1] // băm đc 2 thằng thì accessToken ở index 1 - ở đây có mỗi 2 thằng bearer AccessToken
            if (!accessToken) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              // nếu có accessToken thì mình phải verify AccessToken
              const decoded_authorization = await verifyToken({
                token: accessToken,
                secretOrPublicKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
              })
              // lấy ra decoded_authorization(payload), lưu vào req, để dùng dần
              ;(req as Request).decoded_authorization = decoded_authorization
            } catch (err) {
              throw new ErrorWithStatus({
                message: capitalize((err as JsonWebTokenError).message), // mình biết nó phát sinh lỗi trong phạm vi jwt chỉ có thể là...
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            return true
          }
        }
      }
    },
    ['headers']
  )
)
export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        trim: true,
        notEmpty: {
          errorMessage: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value: string, { req }) => {
            //verify refresh_token để lấy decoded_refresh_token
            // nếu k try catch thì nó sẽ nó sẽ đi vào validate()
            // thằng này có tận 2 lỗi khác nhau nên phải có 2 xử lý khác nhau:
            // 2 nhiệm vụ: 1 là verify refresh_token - do jwt, 2 là tìm xem refresh_token có tồn tại trong db k
            try {
              const [decoded_refresh_token, refresh_token] = await Promise.all([
                verifyToken({ token: value, secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string }),
                databaseService.refreshTokens.findOne({
                  token: value
                })
              ]) // lỗi này do jwt tạo ra
              // tìm xem refresh_token có tồn tại trong db k
              // thuộc tính token trong collection refreshTokens - éo có cái nào là refresh_token
              // có thể thất bại: lỗi - or =null

              if (refresh_token === null) {
                // lỗi mình tự tạo ra nếu nó truyền sai refresh_token
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.USED_REFRESH_TOKEN_OR_NOT_EXIST,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              ;(req as Request).decoded_refresh_token = decoded_refresh_token
            } catch (err) {
              if (err instanceof JsonWebTokenError) {
                // nếu lỗi do jwt tạo ra
                throw new ErrorWithStatus({
                  message: capitalize((err as JsonWebTokenError).message), // mình biết nó phát sinh lỗi trong phạm vi jwt chỉ có thể là...
                  status: HTTP_STATUS.UNAUTHORIZED // bản thân nó k có status nên phải tạo ra
                })
              }
              throw err // nếu lỗi do mình tạo ra thì nó sẽ throw err
            }
          }
        }
      }
    },
    ['body']
  )
)
