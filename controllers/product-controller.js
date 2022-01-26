import { ProductService } from '../services'

export class ProductController {
    static async getAllProducts() {
        try {
            return ProductService.getAllProducts()
        } catch (err) {
            console.log(err)
        }
    }
    static async findByUrl(url) {
        try {
            return ProductService.findByUrl(url)
        } catch (err) {
            console.log(err)
        }
    }
    static async findByParsedData(data) {
        try {
            return ProductService.findByParsedData(data)
        } catch (err) {
            console.log(err)
        }
    }
    static async deleteProduct(data) {
        try {
            return ProductService.deleteProduct(data)
        } catch (err) {
            console.log(err)
        }
    }
    static async addProduct(data) {
        try {
            return ProductService.addProduct(data)
        } catch (err) {
            console.log(err)
        }
    }
}
