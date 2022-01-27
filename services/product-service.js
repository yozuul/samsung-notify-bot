import { ProductModel } from '../models'
import { Op } from '../utils'

export class ProductService {
   static async getAllProducts() {
      return ProductModel.findAll({ row: true })
   }
   static async findByUrl(url) {
      return ProductModel.findAll({
         where: { url: url }
      })
   }
   static async findByParsedData(data) {
      return ProductModel.findOne({
         where: {
				[Op.and]: [
               { url: data.url },
               { device: data.device },
               { storage: data.storage },
            ]
			}
      })
   }
   static async deleteProduct(data) {
      await ProductModel.destroy({
         where: {
				[Op.and]: [
               { device: data.device },
               { storage: data.storage },
            ]
			}
      })
      return ProductService.getAllProducts()
   }
   static async addProduct(data) {
      ProductModel.create({
         url: data.url,
         device: data.device,
         storage: data.storage
      })
   }
}