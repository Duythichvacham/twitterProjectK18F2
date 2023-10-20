// hàm tiện ích - xài chung
import { Request, Response, NextFunction } from 'express'
import { body, validationResult, ValidationChain } from 'express-validator'
// can be reused by many routes
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema'
// sequential processing, stops running validations chain if the previous one fails.
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  // ở đây mình xài checkSchema nên định nghĩa lại
  // nhận vào checkSchema - trả ra 1 cái middlewares

  return async (req: Request, res: Response, next: NextFunction) => {
    await validation.run(req) // đi qua từng check(ex: name lỗi nè- lụm,....) và lưu lỗi vào req

    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }

    res.status(400).json({ errors: errors.mapped() }) // dùng array ở đây nó khá ngoằng - dùng mapped() cho đẹp hơn
  }
}
