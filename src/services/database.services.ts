import { MongoClient, Db, Collection } from 'mongodb'
import { config } from 'dotenv'
import User from '~/models/schemas/User.schema'
config()
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@tweetpiedteam.li8biqc.mongodb.net/?retryWrites=true&w=majority`
// process giúp truy cập vào khu vực env
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
class DatabaseService {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(process.env.DB_NAME)
  }
  async connect() {
    try {
      //   await this.client.db(process.env.DB_NAME).command({ ping: 1 })
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      console.log(error)
      throw error
    }
  }
  get users(): Collection<User> {
    // mặc định nó là doc mà mình đã định nghĩa User r thì dùng thôi
    return this.db.collection(process.env.DB_USERS_COLLECTION as string) // mình tạo nên mình biết nó là string
  }
}
const databaseService = new DatabaseService() // nếu export class cứ mỗi lần call tại phải tạo obj rất phiền
export default databaseService
