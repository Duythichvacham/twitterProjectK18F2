import { Request } from 'express'
import formidable, { File } from 'formidable'
import fs from 'fs' //thư viện giúp handle các đường dẫn
import path from 'path'
import { UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_TEMP_DIR } from '~/constants/dir'
export const initFolder = () => {
  //dir: direct - đường dẫn
  ;[UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_TEMP_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true //cho phép tạo folder nested vào nhau
        //uploads/image/bla bla bla
      }) //mkdirSync: giúp tạo thư mục
    }
  })
  //nếu không có đường dẫn 'TwitterProject/uploads' thì tạo ra
}
// nhờ vào sharp ext đều chuyển thành jpg - chỉ cần lấy tên
export const getNameFromFullName = (filename: string) => {
  //sádasfsdf,ádfdsfdas.àdfsa.png
  const nameArr = filename.split('.') // băm ra
  nameArr.pop() // xóa phần tử cuối
  return nameArr.join('.') // nối lại
}
export const getExtention = (filename: string) => {
  const nameArr = filename.split('.')
  return nameArr[nameArr.length - 1]
}
export const handleUploadImage = async (req: Request) => {
  // formidable: thư viện giúp xử lý file - kiểm tra xem req nó gửi img/video lên có hợp lệ k
  const form = formidable({
    uploadDir: path.resolve(UPLOAD_IMAGE_TEMP_DIR), //lưu ở đâu
    maxFiles: 4, //tối đa bao nhiêu
    keepExtensions: true, //có lấy đuôi mở rộng không .png, .jpg
    maxFileSize: 300 * 1024 * 4, //tối đa bao nhiêu byte, 300kb
    //xài option filter để kiểm tra file có phải là image không
    filter: function ({ name, originalFilename, mimetype }) {
      //name: name|key truyền vào của <input name = bla bla>
      //originalFilename: tên file gốc
      //mimetype: kiểu file vd: image/png
      console.log(name, originalFilename, mimetype) //log để xem, nhớ comment

      const valid = name === 'image' && Boolean(mimetype?.includes('image/'))
      //mimetype? nếu là string thì check, k thì thôi
      //ép Boolean luôn, nếu k thì valid sẽ là boolean | undefined

      //nếu sai valid thì dùng form.emit để gữi lỗi
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
        //as any vì bug này formidable chưa fix, khi nào hết thì bỏ as any
      }
      //nếu đúng thì return valid
      return valid
    }
  })
  //form.parse về thành promise
  //files là object có dạng giống hình test code cuối cùng
  // nhận 1 mảng các file img
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err) //để ý dòng này
      if (!files.image) {
        return reject(new Error('Image is empty'))
      }
      return resolve(files.image as File[])
    })
  })
}
export const handleUploadVideo = async (req: Request) => {
  // formidable: thư viện giúp xử lý file - kiểm tra xem req nó gửi img/video lên có hợp lệ k
  const form = formidable({
    // video k đi qua bước xử lý sharp nên k lưu vô temp -- giảm chất lượng chứ xử lí kích thước các thứ kiểu gì
    uploadDir: path.resolve(UPLOAD_VIDEO_DIR), //lưu ở đâu
    maxFiles: 1, //tối đa bao nhiêu
    maxFileSize: 50 * 1024 * 1024, //tối đa bao nhiêu byte, 300kb
    //xài option filter để kiểm tra file có phải là image không
    filter: function ({ name, originalFilename, mimetype }) {
      //name: name|key truyền vào của <input name = bla bla>
      //originalFilename: tên file gốc
      //mimetype: kiểu file vd: image/png
      console.log(name, originalFilename, mimetype) //log để xem, nhớ comment

      const valid = name === 'video' && Boolean(mimetype?.includes('video/'))
      //mimetype? nếu là string thì check, k thì thôi
      //ép Boolean luôn, nếu k thì valid sẽ là boolean | undefined

      //nếu sai valid thì dùng form.emit để gữi lỗi
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
        //as any vì bug này formidable chưa fix, khi nào hết thì bỏ as any
      }
      //nếu đúng thì return valid
      return valid
    }
  })
  //form.parse về thành promise
  //files là object có dạng giống hình test code cuối cùng
  // nhận 1 mảng các file img
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err) //để ý dòng này
      // files thọc đến key xem nó có juan key video k
      if (!files.video) {
        return reject(new Error('Video is empty'))
      }
      const videos = files.video as File[]
      videos.forEach((video) => {
        // lấy tên cũ và lấy đuôi file (mp4, avi,...)
        // dùng tên mới (tự động đc đổi) + đuôi cũ => tên mới
        const ext = getExtention(video.originalFilename as string)
        // dùng tên mới + đuôi cũ có tên mới - tại sao k giữ lại đuôi ? vì video có thể có định dạng sàds.ád.àd.mp4
        // dẫn đến khi lấy đuôi có thể lấy sai => không giữ đuôi khi lưu trên sv của mình(nó tự động reset tên tránh trùng)
        // > cần cắt đuôi từ tên cũ
        fs.renameSync(video.filepath, `${video.filepath}.${ext}`) //renameSync: đổi tên file - từ tên k đuôi thành tên mưới có đuôi
        video.newFilename = `${video.newFilename}.${ext}` //lưu lại tên mới
      })
      return resolve(files.video as File[])
    })
  })
}
