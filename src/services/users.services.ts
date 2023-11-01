import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { RegisterReqBody } from '~/models/requests/User.requests'
import { hashPassword } from '~/utils/crypto'
import { TokenType } from '~/constants/enums'
import { signToken } from '~/utils/jwt'
import { config } from 'dotenv'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '~/constants/messages'
config()
class UserService {
  // hàm nhận vào user_id và bỏ vào payload để tạo access_token
  // hàm nhận vào user_id và bỏ vào payload để tạo Refresh_token
  private signAccessToken(user_id: string) {
    return signToken({
      // không await vì khi nào tạo mới cần await và k async vì no signToken đã là promise
      payload: { user_id, token_type: TokenType.AccessToken },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_IN }
    })
  }
  private signRefreshToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN }
    })
  }
  private signAccessTokenAndRefreshToken(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshToken(user_id)])
  }
  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }
  async register(payload: RegisterReqBody) {
    const result = await databaseService.users.insertOne(
      // thằng insertOne này trả rằng thằng mình mới tạo nên phải hứng
      // hành động xử lý data trong db mất tg nên phải đợi
      new User({
        ...payload,
        date_of_birth: new Date(payload.date_of_birth), // overide - do thằng này có sẵn trong db r nhưng mình k muốn chọn
        password: hashPassword(payload.password) // mã hóa code theo chuẩn sha256
      })
    )
    const user_id = result.insertedId.toString()
    const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken(user_id)
    // lưu refresh_token vào db
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    return { access_token, refresh_token }
  }
  async login(user_id: string) {
    const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken(user_id)
    // lưu refresh_token vào db
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id.toString())
      })
    )
    return { access_token, refresh_token }
  }
  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
    return { message: USERS_MESSAGES.LOGOUT_SUCCESS }
  }
}

const userService = new UserService()
export default userService
