import { NextFunction, Request, Response } from 'express'
import HTTP_STATUS from '~/constants/httpstatus'
import { omit } from 'lodash'
import { ErrorWithStatus } from '~/models/Errors'
// phải return res vì nếu k nó sẽ chạy xuống tiếp và gây ra lỗi vì res đã được trả về
export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // nơi lỗi toàn bộ hệ thống dồn về
  console.log('error handler tổng')
  if (err instanceof ErrorWithStatus) {
    return res.status(err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(omit(err, ['status']))
    // omit - loại bỏ cái status trong err
  }
  // nếu lỗi xuống được đây thì là lỗi default
  // set name, stack, message về enumerable: true
  Object.getOwnPropertyNames(err).forEach((key) => {
    Object.defineProperty(err, key, { enumerable: true })
  })
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    errorInfor: omit(err, ['stack'])
  })
}
// lỗi tự phát sinh đều là throw new Error -- ex: đang code lỗi mạng - lỗi -- enumerable của thằng này là fasle nên mình sẽ đc rỗng - bị ẩn
