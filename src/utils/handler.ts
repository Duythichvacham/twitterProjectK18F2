import { NextFunction, Request, RequestHandler, Response } from 'express'
//generic type: P là 1 kiểu dữ liệu bất kì - nó sẽ trả về 1 function có kiểu dữ liệu là RequestHandler<P> - P là kiểu dữ liệu của req.body
export const wrapAsync = <P>(func: RequestHandler<P>) => {
  return async (req: Request<P>, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next)
    } catch (err) {
      next(err)
    }
  }
}
