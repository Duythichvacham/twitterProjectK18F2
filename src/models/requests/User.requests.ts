import { JwtPayload } from 'jsonwebtoken'
import { TokenType, UserVerifyStatus } from '~/constants/enums'

// định nghĩa body của Requset
export interface RegisterReqBody {
  name: string
  email: string
  password: string
  confirm_password: string
  date_of_birth: string
}
export interface LoginReqBody {
  email: string
  password: string
}
export interface LogoutReqBody {
  refresh_token: string
}
export interface resetPasswordReqBody {
  forgot_password_token: string
  password: string
  confirm_password: string
}
// payload cuả mình k chỉ có mấy thằng giống jwt nên mình thêm
export interface TokenPayLoad extends JwtPayload {
  user_id: string
  token_type: TokenType
  verify: UserVerifyStatus
}
export interface UpdateMeReqBody {
  name?: string
  date_of_birth?: string //vì ngta truyền lên string dạng ISO8601, k phải date
  bio?: string
  location?: string
  website?: string
  username?: string
  avatar?: string
  cover_photo?: string
}
//vì đây là route patch nên ngta truyền thiếu 1 trong các prop trên cũng k sao
export interface GetProfileReqParams {
  username: string
}
