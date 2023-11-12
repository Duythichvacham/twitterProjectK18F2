import { ObjectId } from 'mongodb'
//interface dùng để định nghĩa kiểu dữ liệu
//interface không có thể dùng để tạo ra đối tượng
interface RefreshTokenType {
  _id?: ObjectId //khi tạo cũng k cần - gửi lên mongo nó đã tự tạo r
  token: string
  created_at?: Date // k có cũng đc, khi tạo object thì ta sẽ new Date() sau
  user_id: ObjectId
  iat: number // thời gian tạo token
  exp: number // thời gian hết hạn token
}
//class dùng để tạo ra đối tượng
//class sẽ thông qua interface
//thứ tự dùng như sau
//class này < databse < service < controller < route < app.ts < server.ts < index.ts

export default class RefreshToken {
  _id?: ObjectId //khi client gửi lên thì không cần truyền _id
  token: string
  created_at: Date
  user_id: ObjectId
  iat: Date // thời gian tạo token -- lưu trên mongo thì lưu dạng Date để nó đọc
  exp: Date // thời gian hết hạn token
  constructor({ _id, token, created_at, user_id, iat, exp }: RefreshTokenType) {
    this._id = _id
    this.token = token
    this.created_at = created_at || new Date()
    this.user_id = user_id
    this.iat = new Date(iat * 1000) // thời gian tạo token -- lưu trên mongo thì lưu dạng Date để nó đọc
    this.exp = new Date(exp * 1000) // thời gian hết hạn token
  }
}
