// 1 ai đó truy cập vào/ login
// client sẽ gửi cho mình mail và password
//client sẽ tạo 1 req gửi server
// username và pass sẽ nằm ở req.body
// viết 1 middlewares xử lý validator của req body
import { NextFunction, Request, Response } from 'express'
import { ParamSchema, checkSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { capitalize } from 'lodash'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpstatus'
import { USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayLoad } from '~/models/requests/User.requests'
import databaseService from '~/services/database.services'
import userService from '~/services/users.services'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'
//commonMiddleware.ts -- có thể lưu vô
const passwordSchema: ParamSchema = {
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
const confirmPasswordSchema: ParamSchema = {
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
}
const nameSchema: ParamSchema = {
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
}
const dateOfBirthSchema: ParamSchema = {
  isISO8601: {
    options: {
      strict: true, // ép nhập chuẩn ngày tháng năm
      strictSeparator: true // chuỗi đc thêm dấu gạch ngang
    }
  },
  errorMessage: USERS_MESSAGES.DATE_OF_BIRTH_BE_ISO8601
}
const imageSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USERS_MESSAGES.IMAGE_URL_MUST_BE_A_STRING
  },
  trim: true, // để thằng này ở đầu có thể bug- deo biết bug gì
  isLength: {
    options: {
      min: 1,
      max: 400
    },
    errorMessage: USERS_MESSAGES.IMAGE_URL_LENGTH_MUST_BE_FROM_1_TO_400
  }
}
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
      name: nameSchema,
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
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
      date_of_birth: dateOfBirthSchema
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
export const emailVerifyTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            //verify refresh_token để lấy decoded_refresh_token
            // nếu k try catch thì nó sẽ nó sẽ đi vào validate()
            // thằng này có tận 2 lỗi khác nhau nên phải có 2 xử lý khác nhau:
            // 2 nhiệm vụ: 1 là verify refresh_token - do jwt, 2 là tìm xem refresh_token có tồn tại trong db k

            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              //verify email_verify_token để lấy decoded_email_verify_token
              const decoded_email_verify_token = await verifyToken({
                token: value,
                secretOrPublicKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
              })
              ;(req as Request).decoded_email_verify_token = decoded_email_verify_token
              // lấy user_id từ decoded_email_verify_token để tìm thằng sở hữu
              const user_id = decoded_email_verify_token.user_id
              const user = await databaseService.users.findOne({
                _id: new ObjectId(user_id)
              })
              if (!user) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.USER_NOT_FOUND,
                  status: HTTP_STATUS.NOT_FOUND
                }) // nếu k tìm thấy user thì throw lỗi
              }
              // nếu có user thì check xem bị band chưa
              req.user = user // lưu user vào req để dùng ở controller
              if (user.verify === UserVerifyStatus.Banned) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.USER_BANNED,
                  status: HTTP_STATUS.FORBIDDEN // 403
                })
              }
              // nếu đang gửi bị lỗi - nó resend: mình phải xóa mã cũ đưa mã mới => nếu nó khác thằng đang lưu thì cút
              if (user.verify !== UserVerifyStatus.Verified && user.email_verify_token !== value) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_NOT_MATCH,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
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
export const forgotPasswordValidator = validate(
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
            const user = await databaseService.users.findOne({
              email: value
            })
            if (!user) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            req.user = user // lưu user vào req để dùng ở controller
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const verifyForgotPasswordTokenValidator = validate(
  checkSchema(
    {
      forgot_password_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            //verify refresh_token để lấy decoded_refresh_token
            // nếu k try catch thì nó sẽ nó sẽ đi vào validate()
            // thằng này có tận 2 lỗi khác nhau nên phải có 2 xử lý khác nhau:
            // 2 nhiệm vụ: 1 là verify refresh_token - do jwt, 2 là tìm xem refresh_token có tồn tại trong db k

            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              //verify forgot_password_token để lấy decoded_forgot_password_token
              const decoded_forgot_password_token = await verifyToken({
                token: value,
                secretOrPublicKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
              })
              ;(req as Request).decoded_forgot_password_token = decoded_forgot_password_token
              // lấy user_id từ decoded_forgot_password_token để tìm thằng sở hữu
              const user_id = decoded_forgot_password_token.user_id
              const user = await databaseService.users.findOne({
                _id: new ObjectId(user_id)
              })
              if (!user) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.USER_NOT_FOUND,
                  status: HTTP_STATUS.NOT_FOUND
                }) // nếu k tìm thấy user thì throw lỗi
              }
              // nếu có user thì check xem bị band chưa
              req.user = user // lưu user vào req để dùng ở controller
              // nếu đang gửi bị lỗi - nó resend: mình phải xóa mã cũ đưa mã mới => nếu nó khác thằng đang lưu thì cút
              if (user.forgot_password_token !== value) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_NOT_MATCH,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
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
// đã kiểm tra forgot_password_token với thằng verifyForgotPasswordTokenValidator =>  chỉ cần check thêm pass - confirmPass
export const resetPasswordValidator = validate(
  checkSchema(
    {
      password: passwordSchema,
      confirm_password: confirmPasswordSchema
    },
    ['body']
  )
)
export const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) => {
  // check user xem đã verify chưa
  // có decoded_authorization trong req do accessTokenValidator -- muốn chỉnh sửa thì phải đăng nhập rồi
  const { verify } = req.decoded_authorization as TokenPayLoad
  if (verify !== UserVerifyStatus.Verified) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_VERIFIED,
      status: HTTP_STATUS.FORBIDDEN
    })
  }
  next()
}
export const updateMeValidator = validate(
  checkSchema(
    {
      name: {
        optional: true, //đc phép có hoặc k
        ...nameSchema, //phân rã nameSchema ra
        notEmpty: undefined //ghi đè lên notEmpty của nameSchema - nó k cần phải update
      },
      date_of_birth: {
        optional: true, //đc phép có hoặc k
        ...dateOfBirthSchema, //phân rã nameSchema ra
        notEmpty: undefined //ghi đè lên notEmpty của nameSchema
      },
      bio: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.BIO_MUST_BE_A_STRING ////messages.ts thêm BIO_MUST_BE_A_STRING: 'Bio must be a string'
        },
        trim: true, //trim phát đặt cuối, nếu k thì nó sẽ lỗi validatior
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: USERS_MESSAGES.BIO_LENGTH_MUST_BE_LESS_THAN_200 //messages.ts thêm BIO_LENGTH_MUST_BE_LESS_THAN_200: 'Bio length must be less than 200'
        }
      },
      //giống bio
      location: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.LOCATION_MUST_BE_A_STRING ////messages.ts thêm LOCATION_MUST_BE_A_STRING: 'Location must be a string'
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: USERS_MESSAGES.LOCATION_LENGTH_MUST_BE_LESS_THAN_200 //messages.ts thêm LOCATION_LENGTH_MUST_BE_LESS_THAN_200: 'Location length must be less than 200'
        }
      },
      //giống location
      website: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.WEBSITE_MUST_BE_A_STRING ////messages.ts thêm WEBSITE_MUST_BE_A_STRING: 'Website must be a string'
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },

          errorMessage: USERS_MESSAGES.WEBSITE_LENGTH_MUST_BE_LESS_THAN_200 //messages.ts thêm WEBSITE_LENGTH_MUST_BE_LESS_THAN_200: 'Website length must be less than 200'
        }
      },
      username: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.USERNAME_MUST_BE_A_STRING ////messages.ts thêm USERNAME_MUST_BE_A_STRING: 'Username must be a string'
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 50
          },
          errorMessage: USERS_MESSAGES.USERNAME_LENGTH_MUST_BE_LESS_THAN_50 //messages.ts thêm USERNAME_LENGTH_MUST_BE_LESS_THAN_50: 'Username length must be less than 50'
        }
      },
      avatar: imageSchema,
      cover_photo: imageSchema
    },
    ['body']
  )
)
