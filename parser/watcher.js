import EventEmitter from 'events'
import axios from 'axios'
import { darkGray, red, green } from 'ansicolor'

import { Parser } from './parser'

const emitter = new EventEmitter()
emitter.setMaxListeners(100)

export class ProductWatcher {
	constructor() {
		this.pages = {}
	}

	async reCheckProducts() {
		console.log(this.pages)
		for (let device in this.pages) {
			const deviceStorages = this.pages[device]
			for (let storage in deviceStorages) {
				const pageData = deviceStorages[storage]
				if(pageData.status === 'closed') {
					const { url } = pageData
					this.pages[device][storage].status === 'loading'
					this.pages[device][storage].page = await new Parser().openPage(url)
					this.pages[device][storage].status = 'loaded'
					this.checkProduct(url, device, storage)
				}
			}
		}
	}

	async checkProduct(url, device, storage) {
		const page = this.pages[device][storage].page

		// Клик по инпуту DEVICE
		const clickDeviceOption = async () => await page.evaluate((device) => {
			const deviceOptions = document.querySelectorAll('.s-option-device input')
			for (let inputDevice of deviceOptions) {
				if(inputDevice.getAttribute('data-englishname') === device) inputDevice.click()
			}
		}, device)

		// Клик по инпуту STORAGE
		const clickStorageOption = async () => await page.evaluate((storage) => {
			let hasAttributeFlag = false
			const storageOptions = document.querySelectorAll('.s-option-storage input')
			for (let inputStorage of storageOptions) {
				if(inputStorage.getAttribute('data-displayname') === storage) {
					hasAttributeFlag = true
					inputStorage.click()
				}
			}
			return hasAttributeFlag
		}, storage)

		// Поиск расцветки
		const checkProductColors = async () => await page.evaluate(() => {
			let productAvailableFlag = false
			let availableColors = ''
			const allColorsBlocks = document.querySelectorAll('.hubble-product__options-color .s-type-color')
			for (let colorBlock of allColorsBlocks) {
				const condition = (className) => colorBlock.classList.contains(className) ? true : false
				if(!condition('is-disabled') && !condition('is-out-stock')) {
					productAvailableFlag = true
					colorBlock.classList.add('productAvailable')
				}
			}
			if(!productAvailableFlag) return 'off'
			if(productAvailableFlag) {
				const availableColorsBlocks = document.querySelectorAll('.productAvailable input')
				for (let block of availableColorsBlocks) {
					let colorName = block.getAttribute('data-displayname')
					availableColors += `- ${colorName}\n`
					// console.log(block.getAttribute('data-displayname'))
					// availableColors.push(block.getAttribute('data-displayname'))
				}
				return availableColors
			}
		})
		// ДЕЙСТВИЯ
		// Клик по инпуту DEVICE
		try {
			const isPageClosed = await this.isPageClosed(device, storage)
			if(isPageClosed) return
			await clickDeviceOption()
			await page.waitForTimeout(1000)
		} catch (error) {
			console.log(error)
			console.log('clickDeviceOption ERROR ^')
		}
		// Клик по инпуту STORAGE
		try {
			const closePage = async () => {
				await page.waitForTimeout(10000)
				await page.close()
				this.pages[device][storage].status = 'closed'
				this.pages[device][storage].page = false
				this.isPageClosed(device, storage)
			}
			const isPageClosed = await this.isPageClosed(device, storage)
			if(isPageClosed) return
			const storageOptionExist = await clickStorageOption()
			await page.waitForTimeout(1000)
			if(storageOptionExist) {
				// Поиск расцветки
				const colors = await checkProductColors()
				if(colors === 'off') {
					console.log(('НЕТ В НАЛИЧИИ:').red, (`${device} ~ ${storage}`).darkGray)
				} else {
					console.log(('ПОЯВИЛСЯ ТОВАР:').green, (`${device} ~ ${storage}`).darkGray)
					console.log(('Расцветки:').darkGray, colors)
					axios.post('http://localhost:3000/sendNotify', {
						url: url,
						device: device,
						storage: storage,
						colors: colors
					})
				}
			} else {
				console.log(('ОПЦИЯ НЕ АКТИВНА:').red, (`${device} ~ ${storage}`).darkGray)
			}
			await closePage()
			return
		} catch (error) {
			console.log(error)
			console.log('clickStorageOption ERROR ^')
		}
	}

	async watch(data) {
		const { url, device, storage } = data
		if(!this.pages[device]) this.pages[device] = {}
		if(!this.pages[device][storage]) this.pages[device][storage] = {
			url: url,
			page: false,
			status: 'loading',
			delete: false
		}

		if(this.pages[device][storage].status === 'loading') {
			this.pages[device][storage].page = await new Parser().openPage(url)
			this.pages[device][storage].status = 'loaded'
		}

		const isPageClosed = await this.isPageClosed(device, storage)
		if(isPageClosed) return

		this.checkProduct(url, device, storage)
	}

	async unWatch(data) {
		const { device, storage } = data
		if(this.pages[device]) {
			if(this.pages[device][storage]) {
				if(this.pages[device][storage].status === 'loading') {
					this.pages[device][storage].delete = true
				}
				if(this.pages[device][storage].status === 'loaded') {
					await this.pages[device][storage].page.close()
					delete this.pages[device][storage]
				}
			}
		}
	}

	async isPageClosed(device, storage) {
		if(this.pages[device][storage].delete) {
			await this.pages[device][storage].page.close()
			delete this.pages[device][storage]
			return true
		} else {
			return false
		}
	}
}