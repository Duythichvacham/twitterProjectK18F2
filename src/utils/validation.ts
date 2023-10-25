// hàm tiện ích - xài chung
import { Request, Response, NextFunction } from 'express'
import { body, validationResult, ValidationChain } from 'express-validator'
// can be reused by many routes
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema'
import { EntityError, ErrorWithStatus } from '~/models/Errors'
// sequential processing, stops running validations chain if the previous one fails.
// checkSchema - kiểu dữ liệu là the validation chain - return RunnableValidationChains<ValidationChain>
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  // ở đây mình xài checkSchema nên định nghĩa lại
  // nhận vào checkSchema - trả ra 1 cái middlewares

  return async (req: Request, res: Response, next: NextFunction) => {
    await validation.run(req) // đi qua từng check(ex: name lỗi nè- lụm,....) và lưu lỗi vào req

    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }
    const errorObject = errors.mapped() // thay vì ném lỗi ra thì lưu lại để xử lý
    const entityError = new EntityError({ errors: {} })
    for (const key in errorObject) {
      // lấy msg của từng lỗi ra
      // thằng nào có cái msg có cấu trúc giống cái schema errorWithStatus thì nó sẽ trả về cái đó
      const { msg } = errorObject[key]
      if (msg instanceof ErrorWithStatus && msg.status !== 422) {
        return next(msg) // next() - nếu có lỗi khác 422 thì nó sẽ nhảy vào cái error handler ở cuối
      }
      // nếu xuống đây là lỗi 422
      entityError.errors[key] = { msg }
    }
    // đáng lý lỗi ở đây là 422 - lỗi của validate do dữ liệu ng dùng truyền lên lỏ
    next(entityError)
  }
}
