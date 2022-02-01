import puppeteer from 'puppeteer'
import axios from 'axios'

import { ProductController } from '../controllers/product-controller'

export class Parser {
	async urlChecker(url) {
		const { page, browser } = await this.openPage(url)
		const parsedData = await this.parseData(page)
		await this.checkProduct(url, parsedData)
		await browser.close()
	}

	async checkProduct(url, parsedData) {
		for (const [index, product] of parsedData.entries()) {
			for (let storage in product.storage) {
				const foundedProduct = await ProductController.findByParsedData({
					url: url,
					device: product.device,
					storage: storage
				})
				if(foundedProduct) {
					parsedData[index].storage[storage] = true
				}
			}
		}
		axios.post('http://localhost:3000/sendProducts', [parsedData, url])
	}

	prepareFoundedProduct(data) {
		const message = {}
		for (let product of data) {
			if(!message.model) message[product.model] = []
			message[product.model].push(product.memory)
		}
	}

	async parseData(page) {
		return await page.evaluate(() => {
			const deviceOptions = document.querySelectorAll('#device input')
			const deviceData = []
			for (let device of deviceOptions) {
				const deviceName = device.getAttribute('data-englishname')
				deviceData.push({
					device: deviceName,
					storage: collectStorage()
				})
			}
			function collectStorage() {
				const storageOptions = document.querySelectorAll('#storage .s-rdo-text')
				const storageData = {}
				for (let storage of storageOptions) {
					storageData[storage?.innerText] = false
				}
				return storageData
			}
			return deviceData
		})
	}

   async openPage(url) {
      const browser = await puppeteer.launch({
         headless: false,
         devtools: true,
         defaultViewport: null,
         args: [
            // '--start-maximized',
            '--disable-notifications',
            '--window-size=1920,1020',
            '--no-sandbox',
         ]
      })
      const page = await browser.newPage()
      const tabs = await browser.pages()
      await tabs[0].close()
      try {
			await page.goto(url, { waitUntil: 'networkidle2', timeout: 120000 })
		} catch (error) {
			console.log('Страница закрыта')
		}
      return {
			page: page,
			browser: browser
		}
   }

	mockData() {
		return [{
				device: 'Galaxy S21 5G',
				storage: {
					'256ГБ / 8ГБ ОЗУ': false,
					'128ГБ / 8 ГБ ОЗУ': false,
					'128ГБ / 12 ГБ ОЗУ': false,
					'256ГБ / 12ГБ ОЗУ': false,
					'512ГБ / 16ГБ ОЗУ': false
				}
			},
			{
				device: 'Galaxy S21+ 5G',
				storage: {
					'256ГБ / 8ГБ ОЗУ': false,
					'128ГБ / 8 ГБ ОЗУ': false,
					'128ГБ / 12 ГБ ОЗУ': false,
					'256ГБ / 12ГБ ОЗУ': false,
					'512ГБ / 16ГБ ОЗУ': false
				}
			},
			{
				device: 'Galaxy S21 Ultra 5G',
				storage: {
					'256ГБ / 8ГБ ОЗУ': false,
					'128ГБ / 8 ГБ ОЗУ': false,
					'128ГБ / 12 ГБ ОЗУ': false,
					'256ГБ / 12ГБ ОЗУ': false,
					'512ГБ / 16ГБ ОЗУ': false
				}
			}
		]
	}
}

