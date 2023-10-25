const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  UNPROCESSABLE_ENTITY: 422,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const // as const - giúp giữ nguyên giá trị của object - k cho phép thay đổi - cấm gán dữ liệu lúc truy cập đến

export default HTTP_STATUS