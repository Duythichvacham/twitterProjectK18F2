import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { RegisterReqBody, UpdateMeReqBody } from '~/models/requests/User.requests'
import { hashPassword } from '~/utils/crypto'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { signToken, verifyToken } from '~/utils/jwt'
import { config } from 'dotenv'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpstatus'
import axios from 'axios'
config()
class UserService {
  // hàm nhận vào user_id và bỏ vào payload để tạo access_token
  private decodeRefreshToken(refresh_token: string) {
    return verifyToken({
      token: refresh_token,
      secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    })
  }
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      // không await vì khi nào tạo mới cần await và k async vì no signToken đã là promise
      payload: { user_id, token_type: TokenType.AccessToken, verify },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_IN }
    })
  }
  // hàm nhận vào user_id và bỏ vào payload để tạo Refresh_token
  private signRefreshToken({ user_id, verify, exp }: { user_id: string; verify: UserVerifyStatus; exp?: number }) {
    if (exp) {
      // k dùng option: nó đôn ngày hết hạn lên
      return signToken({
        payload: { user_id, token_type: TokenType.RefreshToken, verify, exp },
        privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
      })
    } else {
      return signToken({
        payload: { user_id, token_type: TokenType.AccessToken, verify },
        privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
        options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN }
      })
    }
  }
  // email_verify_token:string
  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.EmailVerificationToken, verify },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      options: { expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRE_IN }
    })
  }
  private signForgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.EmailVerificationToken, verify },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      options: { expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRE_IN }
    })
  }
  private signAccessTokenAndRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
  }
  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }
  async register(payload: RegisterReqBody) {
    // tự tạo user_id thay vì để nó tự tạo để ký EmailVerifyToken dễ hơn
    const user_id = new ObjectId()
    // đăng ký thì nó ở trạng thái chưa verify
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    const result = await databaseService.users.insertOne(
      // thằng insertOne này trả rằng thằng mình mới tạo nên phải hứng
      // hành động xử lý data trong db mất tg nên phải đợi
      new User({
        ...payload,
        _id: user_id,
        username: `user${user_id.toString()}`, // tạo sẵn - muốn thì chỉnh
        date_of_birth: new Date(payload.date_of_birth), // overide - do thằng này có sẵn trong db r nhưng mình k muốn chọn
        password: hashPassword(payload.password), // mã hóa code theo chuẩn sha256
        email_verify_token
      })
    )
    //object_id mongo nó tự tạo ra -
    const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    const { iat, exp } = await this.decodeRefreshToken(refresh_token)
    // lưu refresh_token vào db
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id),
        iat,
        exp
      })
    )
    // giả lập gửi mail
    console.log(email_verify_token)
    return { access_token, refresh_token }
  }
  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    // lấy verify
    const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken({
      user_id,
      verify
    })
    const { iat, exp } = await this.decodeRefreshToken(refresh_token)
    // lưu refresh_token vào db
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id.toString()),
        iat,
        exp
      })
    )
    return { access_token, refresh_token }
  }
  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
    return { message: USERS_MESSAGES.LOGOUT_SUCCESS }
  }
  async verifyEmail(user_id: string) {
    // cập nhật lại user - đã verify trước đó r - thằng này chỉ có nhiệm vụ update => verify = 1
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      }, // filter
      [
        {
          $set: {
            email_verify_token: '',
            verify: UserVerifyStatus.Verified, //1
            updated_at: '$$NOW' // lấy thời gian hiện tại khi nó lên đến mongo - đây là thuộc tính của mongo
          }
        }
      ]
    )
    // tạo accessToken và refreshToken - để khi nó verify xong thì nó tự đăng nhập luôn
    const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken({
      user_id,
      verify: UserVerifyStatus.Verified
    })
    const { iat, exp } = await this.decodeRefreshToken(refresh_token)
    // lưu refresh_token vào db
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id),
        iat,
        exp
      })
    )
    return { access_token, refresh_token }
  }
  async resendEmailVerify(user_id: string) {
    // nếu nó đã đến đây tức là 100% nó chưa verify nếu k đã bị chặn trước đó
    const email_verify_token = await this.signEmailVerifyToken({ user_id, verify: UserVerifyStatus.Unverified })
    // cập nhật lại user
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      }, // filter
      [
        {
          $set: {
            email_verify_token,
            updated_at: '$$NOW' // lấy thời gian hiện tại khi nó lên đến mongo - đây là thuộc tính của mongo
          }
        }
      ]
    )
    // giả lập gửi mail
    console.log(email_verify_token)
    return { message: USERS_MESSAGES.RESEND_EMAIL_VERIFY_SUCCESS }
  }
  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const forgot_password_token = await this.signForgotPassword({ user_id, verify })
    // cập nhật lại user
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      }, // filter
      [
        {
          $set: {
            forgot_password_token,
            updated_at: '$$NOW' // lấy thời gian hiện tại khi nó lên đến mongo - đây là thuộc tính của mongo
          }
        }
      ]
    )
    // giả lập gửi mail
    console.log(forgot_password_token)
    return { message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD }
  }
  async resetPassword({ user_id, password }: { user_id: string; password: string }) {
    // cập nhật lại user
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      }, // filter
      [
        {
          $set: {
            password: hashPassword(password),
            forgot_password_token: '',
            updated_at: '$$NOW' // lấy thời gian hiện tại khi nó lên đến mongo - đây là thuộc tính của mongo
          }
        }
      ]
    )
    return { message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS }
  }
  async getMe(user_id: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          // thằng này mongo có - đánh chặn những thằng k muốn nó gửi ra
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    if (!user) {
      throw new ErrorWithStatus({ message: USERS_MESSAGES.USER_NOT_FOUND, status: HTTP_STATUS.NOT_FOUND })
    }
    return user
  }
  async updateMe({ user_id, payload }: { user_id: string; payload: UpdateMeReqBody }) {
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    // cập nhật lại user
    const user = await databaseService.users.findOneAndUpdate(
      {
        _id: new ObjectId(user_id)
      }, // filter
      [
        {
          $set: {
            ..._payload,
            updated_at: '$$NOW' // lấy thời gian hiện tại khi nó lên đến mongo - đây là thuộc tính của mongo
          }
        }
      ],
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user
  }
  async getProfile(username: string) {
    const user = await databaseService.users.findOne(
      { username },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0,
          create_at: 0,
          updated_at: 0
        }
      }
    )
    if (!user) {
      throw new ErrorWithStatus({ message: USERS_MESSAGES.USER_NOT_FOUND, status: HTTP_STATUS.NOT_FOUND })
    }
    return user
  }
  async follow({ user_id, followed_user_id }: { user_id: string; followed_user_id: string }) {
    // tìm xem đã follow chưa
    const isFollowed = await databaseService.follwers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    // nếu đã follow rồi thì k cần follow nữa - thật ra thì khi mình follow rồi nó sẽ tự động hiện unfollow => k thể follow lại
    if (isFollowed) {
      // này éo phải error :V
      return { message: USERS_MESSAGES.USER_ALREADY_FOLLOWED }
    }
    // nếu chưa follow
    await databaseService.follwers.insertOne({
      // éo cần await cũng đc vì mình đâu có cần hứng kq :V - mình chỉ cần nó thực hiện
      user_id: new ObjectId(user_id), // thằng nào follow
      followed_user_id: new ObjectId(followed_user_id), // thằng nào được follow
      created_at: new Date()
    })
    return { message: USERS_MESSAGES.FOLLOW_SUCCESS }
  }
  async unfollow({ user_id, followed_user_id }: { user_id: string; followed_user_id: string }) {
    // tìm xem có đang follow k
    const isFollowed = await databaseService.follwers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    // nếu chưa follow
    if (!isFollowed) {
      // này éo phải error :V
      return { message: USERS_MESSAGES.USER_NOT_FOLLOWED }
    }
    // nếu đã follow
    await databaseService.follwers.deleteOne({
      user_id: new ObjectId(user_id), // thằng nào cần xóa
      followed_user_id: new ObjectId(followed_user_id) // thằng nào được xóa
    })
    return { message: USERS_MESSAGES.UNFOLLOW_SUCCESS }
  }
  async changePassword({ user_id, password }: { user_id: string; password: string }) {
    // tìm và update pass
    await databaseService.users.findOneAndUpdate(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            password: hashPassword(password),
            updated_at: '$$NOW' // lấy thời gian hiện tại khi nó lên đến mongo - đây là thuộc tính của mongo
          }
        }
      ]
    )
    return { message: USERS_MESSAGES.CHANGE_PASSWORD_SUCCESS }
  }
  private async getOAuthGoogleToken(code: string) {
    const body = {
      // body sẽ truyền lên server
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    }
    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return data as {
      access_token: string
      id_token: string
    }
  }

  private async getGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    })
    return data as {
      id: string
      email: string
      email_verified: boolean
      name: string
      given_name: string
      family_name: string
      picture: string
      locale: string
    }
  }
  async oAuth(code: string) {
    const { access_token, id_token } = await this.getOAuthGoogleToken(code)
    const userInfor = await this.getGoogleUserInfo(access_token, id_token)
    // check xem verify chưa
    if (!userInfor.email_verified) {
      throw new ErrorWithStatus({ message: USERS_MESSAGES.EMAIL_NOT_VERIFIED, status: HTTP_STATUS.UNAUTHORIZED })
    }
    //kiểm tra xem email tồn tại trong db chưa vì: nếu tồn tại thì nó sẽ đăng nhập - nếu k thì nó sẽ đăng ký
    const user = await databaseService.users.findOne({ email: userInfor.email })
    if (user) {
      const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken({
        user_id: user._id.toString(),
        verify: user.verify
      })
      const { iat, exp } = await this.decodeRefreshToken(refresh_token)
      // lưu lại refresh_token
      await databaseService.refreshTokens.insertOne(
        new RefreshToken({
          token: refresh_token,
          user_id: new ObjectId(user._id),
          iat,
          exp
        })
      )
      return {
        access_token,
        refresh_token,
        new_user: 0,
        verify: user.verify
      }
    } else {
      const password = Math.random().toString(36).slice(1, 15)
      // nó đăng nhập = email thông qua gg => bản chất là đăng nhập = giao thức - chả biết pass
      const data = await this.register({
        email: userInfor.email,
        password,
        confirm_password: password,
        name: userInfor.name,
        date_of_birth: new Date().toISOString()
      })
      return {
        ...data,
        new_user: 1,
        verify: UserVerifyStatus.Unverified
      }
    }
  }
  // thêm exp: ngày hết hạn (cũ) để tạo mới refresh_token
  async refreshToken({
    user_id,
    verify,
    refresh_token,
    exp
  }: {
    user_id: string
    verify: UserVerifyStatus
    refresh_token: string
    exp: number
  }) {
    //tạo mới
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({
        user_id: user_id,
        verify
      }),
      this.signRefreshToken({
        user_id: user_id,
        verify,
        exp
      })
    ])
    const { iat } = await this.decodeRefreshToken(new_refresh_token)
    //vì một người đăng nhập ở nhiều nơi khác nhau, nên họ sẽ có rất nhiều document trong collection refreshTokens
    //ta không thể dùng user_id để tìm document cần update, mà phải dùng token, đọc trong RefreshToken.schema.ts
    await databaseService.refreshTokens.deleteOne({ token: refresh_token }) //xóa refresh
    //insert lại document mới
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: new_refresh_token, iat, exp })
    )
    return { access_token: new_access_token, refresh_token: new_refresh_token }
  }
}

const userService = new UserService()
export default userService
