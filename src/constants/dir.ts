import path from 'path'
// đường dẫn upload ảnh => sau khi tối ưu hóa sẽ lưu vào uploads/images
// path.resolve: biến các đường dẫn tương đối thành đường dẫn tuyệt đối: vd: uploads/images/temp => C:\Users\ADMIN\Desktop\TwitterBE\uploads\images\temp
export const UPLOAD_IMAGE_TEMP_DIR = path.resolve('uploads/images/temp')
// thằng uploads bth sau khi đc tối ưu
export const UPLOAD_IMAGE_DIR = path.resolve('uploads/images')
//
export const UPLOAD_VIDEO_TEMP_DIR = path.resolve('uploads/videos/temp')
//
export const UPLOAD_VIDEO_DIR = path.resolve('uploads/videos')
export const UPLOAD_DIR = path.resolve('uploads')
