import { config } from 'dotenv'
config()
import argv from 'minimist'
//argv: các tham số dòng lệnh truyền vào chương trình lưu ở dạng mảng
// ở script mấy thằng development và production được gọi là argv
// có nhiều thư viện xử lý nó - ở đây mình dùng Minimist
/*"dev": "npx nodemon --development",
//ta sẽ có {_: [], development: true } vậy option.development == true
"start": "node dist/index.js --production",
//ta sẽ có {_: [], production: true } vậy option.production == true
*/
const options = argv(process.argv.slice(2))
// true thì là production, false thì là development
export const isProduction = Boolean(options.production)
