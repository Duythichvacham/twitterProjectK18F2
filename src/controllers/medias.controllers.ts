import { NextFunction, Request, Response } from 'express'
import path from 'path'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { USERS_MESSAGES } from '~/constants/messages'
import mediasService from '~/services/medias.services'
import fs from 'fs'
import mime from 'mime'
import HTTP_STATUS from '~/constants/httpstatus'

export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await mediasService.UploadImage(req)
  return res.json({
    message: USERS_MESSAGES.UPLOAD_SUCCESS,
    result: url
  })
}
export const serveImageControler = async (req: Request, res: Response, next: NextFunction) => {
  // client truyền filename qua path => nhận filename => vào đường dẫn UPLOAD_IMAGE_DIR tìm filename => trả về img cho client
  const { filename } = req.params
  res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, filename), (err) => {
    if (err) {
      res.status(err as any).send('Not found image')
    }
  })
}
export const uploadVideoController = async (req: Request, res: Response, next: NextFunction) => {
  // const url = await mediasService.uploadVideo(req) //uploadVideo chưa làm
  return res.json({
    message: USERS_MESSAGES.UPLOAD_SUCCESS
    // result: url
  })
}
export const serveVideoController = async (req: Request, res: Response, next: NextFunction) => {
  const { namefile } = req.params
  const range = req.headers.range // đến khúc nào đó thì tải thêm
  // lấy đc đường dẫn của video
  const videoPath = path.resolve(UPLOAD_VIDEO_DIR, namefile)
  if (!range) {
    return res.status(400).send('Requires Range header')
  }
  // có range => lấy kích thước video (byte)
  const videoSize = fs.statSync(videoPath).size //sta: status
  const CHUNK_SIZE = 10 ** 6 // 1MB - cứ đến đoạn nào đó thì load thêm 1MB - làm lại thì check content-range tribng network - phần header
  // CHUNK_SIZE: lượng tải thêm mỗi lần
  const start = Number(range.replace(/\D/g, '')) // \D: k phải là số, g: global -- loại những thằng k phải là số
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1) // end: đến đoạn nào đó thì tải thêm
  // end: đến đoạn nào đó thì tải thêm, nếu end > videoSize thì end = videoSize
  // giải thích content-range: bytes start-end/total
  const contentLength = end - start + 1 // dung lượng thực tế cần tải
  const contentType = mime.getType(videoPath) || 'video/*' //lấy kiểu file, nếu k đc thì mặc định là video/*
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`, //end-1 vì nó tính từ 0
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  }
  res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers) // 206
  const videoStream = fs.createReadStream(videoPath, { start, end }) // đọc file từ start đến end
  videoStream.pipe(res) // pipe: đọc file từ start đến end rồi ghi vào res
}
