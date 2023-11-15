import { config } from 'dotenv'
config()
import argv from 'minimist'
//argv: các đối số dòng lệnh truyền vào chương trình lưu ở dạng mảng
// ở script mấy thằng development và production được gọi là argv
// có nhiều thư viện xử lý nó - ở đây mình dùng Minimist
/*"dev": "npx nodemon --development",
//ta sẽ có {_: [], development: true } vậy option.development == true
"start": "node dist/index.js --production",
//ta sẽ có {_: [], production: true } vậy option.production == true
*/
// có thể: bth nó k hiện các argv --development, --production ám chỉ việc hiển thị thằng này là true khi chạy ct
const options = argv(process.argv.slice(2)) // kiểm tra đối số dòng lệnh mình bổ nghĩa ở package.json
// true thì là production, false thì là development
export const isProduction = Boolean(options.production)
