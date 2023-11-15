import { Request } from 'express'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR } from '~/constants/dir'
import { getNameFromFullName, handleUploadImage, handleUploadVideo } from '~/utils/file'
import fs from 'fs'
import { config } from 'dotenv'
config()
import { isProduction } from '~/constants/config'
import { Media } from '~/models/Other'
import { MediaType } from '~/constants/enums'
import path from 'path'
class MediasService {
  async UploadImage(req: Request) {
    // lưu mảng các ảnh vào uploads/temp
    const files = await handleUploadImage(req) //đem từ uploadSingleImageController qua

    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        // tên mới sau khi bỏ đuôi
        const newFilename = getNameFromFullName(file.newFilename) + '.jpg'
        const newPath = UPLOAD_IMAGE_DIR + '/' + newFilename
        //xử lý file bằng sharp -- xử lý ảnh - giảm kích thước ảnh- chuyển ext thành jpg
        await sharp(file.filepath).jpeg().toFile(newPath) // chuyển đường dẫn thành jpeg xong lưu vào newPath
        // xóa ảnh cũ trong temp - sử dụng fs - thêm xóa sửa
        fs.unlinkSync(file.filepath) // file.filepath: đường dẫn tạm thời
        // thằng mà mình lưu trong temp là file.filepath - sau khi lưu lại vào uploads thì xóa file.filepath: file.type
        return {
          url: isProduction
            ? ` ${process.env.HOST}/static/image/${newFilename}`
            : `http://localhost:4000/static/image/${newFilename}`,
          type: MediaType.Image
        }
        // return 'https://localhost:4000/uploads/' + newFilename
        // trả về đường dẫn mới
        // nếu chạy domain production thì trả đường dẫn khác
      })
    )
    // trả về danh sách các file đã up kèm đường dẫn
    return result
  }
  async UploadVideo(req: Request) {
    // lưu mảng các video vào uploads/video
    const files = await handleUploadVideo(req) //đem từ uploadSingleImageController qua

    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        // tên mới sau khi bỏ đuôi
        const { newFilename } = file // đã lấy newFilename ở handleUploadVideo
        return {
          url: isProduction
            ? ` ${process.env.HOST}/static/video-stream/${newFilename}`
            : `http://localhost:4000/static/video-stream/${newFilename}`,
          type: MediaType.Video
        }
        // return 'https://localhost:4000/uploads/' + newFilename
        // trả về đường dẫn mới
        // nếu chạy domain production thì trả đường dẫn khác
      })
    )
    // trả về danh sách các file đã up kèm đường dẫn
    return result
  }
}

const mediasService = new MediasService()

export default mediasService
