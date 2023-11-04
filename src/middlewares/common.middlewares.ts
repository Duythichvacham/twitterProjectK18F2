// chứa những thằng middaleware mình sẽ dùng ở nhiều nơi
import { Response, Request, NextFunction } from 'express'
import { pick } from 'lodash'
//ta đang dùng generic để khi dùng hàm filterMiddleware nó sẽ nhắc ta nên bỏ property nào vào mảng
//FilterKeys là mảng các key của object T nào đó
// T đại diện cho 1 object nào đó - ở đây là chữ Type - chữ gì ở đây cũng đc - đại diện cho 1 kiểu dữ liệu nào đó chưa biết
type FilterKeys<T> = Array<keyof T>

export const filterMiddleware =
  <T>(filterKey: FilterKeys<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    req.body = pick(req.body, filterKey)
    next()
  }
