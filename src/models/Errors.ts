//ở đây thường mình sẽ extend Error để nhận đc báo lỗi ở dòng nào
// là cái khuôn dùng để tạo ra obj mô tả lỗi có status và message
import { USERS_MESSAGES } from '~/constants/messages'
import HTTP_STATUS from '~/constants/httpstatus'
export class ErrorWithStatus {
  message: string
  status: number
  constructor({ message, status }: { message: string; status: number }) {
    this.message = message
    this.status = status
  }
}
//đầu file
//tạo kiểu lỗi giống thiết kế ban đâu
type ErrorsType = Record<
  // Record là những thằng nó thu đc từ bug
  string,
  {
    msg: string
    [key: string]: any //
  }
>
// { [key: string]:  {
//     [field: string]:{
//         msg: string
//     }
// }
//}
export class EntityError extends ErrorWithStatus {
  errors: ErrorsType
  //truyển message mặt định
  constructor({ message = USERS_MESSAGES.VALIDATION_ERROR, errors }: { message?: string; errors: ErrorsType }) {
    super({ message, status: HTTP_STATUS.UNPROCESSABLE_ENTITY }) //tạo lỗi có status 422
    this.errors = errors
  }
}
