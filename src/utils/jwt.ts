import jwt from 'jsonwebtoken'
// làm hàm nhận vào payload, privateKey, options từ đó ký tên
// server chỉ trả resolve -- nhưng thằng này buộc phải trả reject nếu thất bại
import { config } from 'dotenv'
config()
export const signToken = ({
  payload,
  privateKey = process.env.JWT_SECRET as string,
  options = { algorithm: 'HS256' }
}: {
  payload: string | object | Buffer
  privateKey?: string
  options: jwt.SignOptions
}) => {
  // nó truyền tùm lum thì mình k biết đc nếu k định nghĩa
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options, (err, token) => {
      if (err) throw reject(err)
      resolve(token as string)
    })
  })
}
