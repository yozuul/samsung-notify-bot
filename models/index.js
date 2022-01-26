import pgSync from '../utils/database/db-sync'

import UserModel from './user-model'
import ProductModel from './product-model'

pgSync({
   UserModel: UserModel,
   ProductModel: ProductModel,
})

export { UserModel, ProductModel }