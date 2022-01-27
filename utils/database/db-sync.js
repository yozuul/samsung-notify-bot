import { postgres } from './db-connect'
import { darkGray, red } from 'ansicolor'

import { defaultUser, defaultProducts } from './default-db-data'

const pgSync = async (models) => {

   try {
      const { UserModel, ProductModel } = models

      await postgres.sync()
      await (async () => {
         const existUser = await UserModel.findAll({ row: true })
         if(existUser.length === 0) {
            UserModel.bulkCreate(defaultUser)
         }
         // const existProducts = await ProductModel.findAll({ row: true })
         // if(existProducts.length === 0) {
         //    ProductModel.bulkCreate(defaultProducts)
         // }
      })()
      } catch (err) {
         console.log(err)
         console.log(('Ошибка синхронизации таблиц').red)
   }
}

export default pgSync