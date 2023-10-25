import { NextFunction, Request, Response } from 'express'
import HTTP_STATUS from '~/constants/httpstatus'
import { omit } from 'lodash'
export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // nơi lỗi toàn bộ hệ thống dồn về
  console.log('error handler tổng')
  res.status(err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(omit(err, ['status']))
  // omit - loại bỏ cái status trong err
}
