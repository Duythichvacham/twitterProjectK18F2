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
    // ký xong mới trả data - nên dùng promise
    jwt.sign(payload, privateKey, options, (err, token) => {
      if (err) throw reject(err)
      resolve(token as string)
    })
  })
}
// hàm nhận vào token và privateKey để verify, [options,callback] tự code
export const verifyToken = ({
  token,
  secretOrPublicKey = process.env.JWT_SECRET as string
}: {
  token: string
  secretOrPublicKey?: string
}) => {
  // ký chữ ký luôn có khả năng phát sinh err
  return new Promise<jwt.JwtPayload>((resolve, reject) => {
    jwt.verify(token, secretOrPublicKey, (err, decoded) => {
      // thằng này nó kiểm tra token của mình hết hạn hay chưa đc luôn
      if (err) throw reject(err)
      resolve(decoded as jwt.JwtPayload)
    }) // decoded là cái payload
  })
}
