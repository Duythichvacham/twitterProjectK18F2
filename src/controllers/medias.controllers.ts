import { NextFunction, Request, Response } from 'express'
import path from 'path'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { USERS_MESSAGES } from '~/constants/messages'
import mediasService from '~/services/medias.services'
import { ServeImageParams, ServeVideoParams } from '~/models/requests/User.requests'
import HTTP_STATUS from '~/constants/httpstatus'
import fs from 'fs'
import mime from 'mime'
export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await mediasService.UploadImage(req)
  return res.json({
    message: USERS_MESSAGES.UPLOAD_SUCCESS,
    result: url
  })
}
export const serveImageController = async (req: Request<ServeImageParams>, res: Response, next: NextFunction) => {
  // client truyền filename qua path => nhận filename => vào đường dẫn UPLOAD_IMAGE_DIR tìm filename => trả về img cho client
  const { namefile } = req.params
  return res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, namefile), (err) => {
    if (err) {
      return res.status(err as any).send('Not found image')
    }
  })
}
export const uploadVideoController = async (req: Request, res: Response, next: NextFunction) => {
  // const url = await mediasService.uploadVideo(req) //uploadVideo chưa làm
  const url = await mediasService.UploadVideo(req)
  return res.json({
    message: USERS_MESSAGES.UPLOAD_SUCCESS,
    result: url
    // result: url
  })
}
export const serveVideoController = async (req: Request<ServeVideoParams>, res: Response, next: NextFunction) => {
  const { namefile } = req.params
  // xem header của req
  const range = req.headers.range // range: lấy từ header của req
  // lấy đường dẫn của video
  const videoPath = path.resolve(UPLOAD_VIDEO_DIR, namefile)
  if (!range) {
    return res.status(HTTP_STATUS.BAD_REQUEST).send('Require range header')
  }
  // lấy kích thước video
  const videoSize = fs.statSync(videoPath).size // statSync: lấy thông tin file
  // chunk size: kích thước mỗi đoạn video
  const CHUNK_SIZE = 10 ** 6 // 1MB -- hệ số chuẩn 1024 - hệ số các nxs thường dùng: 1000 10**6 == 10^6
  const start = Number(range.replace(/\D/g, '')) // replace: thay thế tất cả kí tự không phải là số thành ''
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1) // end: lấy start + CHUNK_SIZE nếu lớn hơn kích thước thì end = videoSize - 1
  // dung lượng cần load thược tế
  const contentLength = end - start + 1 //thường thì nó luôn bằng CHUNK_SIZE, nhưng nếu là phần cuối thì sẽ nhỏ hơn
  const contentType = mime.getType(videoPath) || 'video/*' // lấy kiểu của video
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`, // Content-Range: bytes 0-999999/10000000
    //0-999999: đoạn video cần load, 10000000: tổng dung lượng video
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  }
  res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers) // PARTIAL_CONTENT: 206
  // tạo stream để đọc video
  const videoStream = fs.createReadStream(videoPath, { start, end })
  videoStream.pipe(res) // pipe: đọc từng đoạn video
}
