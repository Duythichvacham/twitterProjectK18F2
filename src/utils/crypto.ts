import { createHash } from 'crypto'
import { create } from 'domain'
import { config } from 'dotenv'
config()
// tạo 1 hàm nhận vào chuỗi là mã hóa theo chuẩn SHA256
function sha256(content: string) {
  return createHash('sha256').update(content).digest('hex')
}
//hàm nhận vào password và trả về password đã mã hóa
export function hashPassword(password: string) {
  return sha256(password + process.env.PASSWORD_SECRET)
}
// client - ahihi => server - mã hóa
// mã hóa ngược lại : nó sẽ mã hóa ra chuỗi khác -- hash bảo mật : 1 đầu vào cho 1 đầu ra, từ đầu ra rất khó mã hóa ngược
// nó có thể mã hóa ra rất nhiều đến khi ra pass - nhưng biết thế deo nào đc
