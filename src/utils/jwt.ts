import jwt from 'jsonwebtoken'
// làm hàm nhận vào payload, privateKey, options từ đó ký tên
// server chỉ trả resolve -- nhưng thằng này buộc phải trả reject nếu thất bại
import { config } from 'dotenv'
import { TokenPayLoad } from '~/models/requests/User.requests'
config()
export const signToken = ({
  payload,
  privateKey,
  options = { algorithm: 'HS256' }
}: {
  payload: any
  privateKey: string
  options?: jwt.SignOptions
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
export const verifyToken = ({ token, secretOrPublicKey }: { token: string; secretOrPublicKey: string }) => {
  // ký chữ ký luôn có khả năng phát sinh err
  return new Promise<TokenPayLoad>((resolve, reject) => {
    jwt.verify(token, secretOrPublicKey, (err, decoded) => {
      // thằng này nó kiểm tra token của mình hết hạn hay chưa đc luôn
      if (err) throw reject(err)
      // resolve(decoded as jwt.JwtPayload)
      // chỉnh nó thành phiên bản vippro hơn do mình tự định nghĩa
      resolve(decoded as TokenPayLoad)
    }) // decoded là cái payload
  })
}
// bản chất khi payload truyền lên có mã hóa hay k nó đều dùng được
// tuy nhiên nó cần verify để xác nhận xem có nên - có được sử dụng hay k
