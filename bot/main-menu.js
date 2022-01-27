import axios from 'axios'
import { UserController, ProductController } from '../controllers'
import { Parser } from '../parser/parser'
import { MenuKeyboards } from './keyboards'

const keyboard = new MenuKeyboards()
const parser = new Parser()

export class MainMenu {
   constructor(bot) {
      this.bot = bot
      this.user = {}
   }

   async searchProducts(chat_id, url) {
      this.bot.sendMessage(chat_id, 'Поиск товаров по указанной ссылке')
      await this.checkUserExist(chat_id)
      this.user[chat_id].parseProduct = true
      await parser.urlChecker(url)
   }
   async getProductList(chat_id) {
      await this.checkInit(chat_id)
      const products = await ProductController.getAllProducts()
      const productsListMenu = keyboard.existProducts(products)
      const msg = await this.bot.sendMessage(chat_id, '<pre>МОИ ТОВАРЫ:</pre>', {
         reply_markup: JSON.stringify({
            inline_keyboard: productsListMenu
         }), parse_mode: 'HTML'
      })
      this.user[chat_id].menu[msg.message_id] = productsListMenu
   }

   async deleteProduct(device, storage, chat_id, message_id) {
      const products = await ProductController.deleteProduct({
         device: device, storage: storage
      })
      await this.editKeyboard(
         '<pre>МОИ ТОВАРЫ:</pre>', chat_id, message_id, keyboard.existProducts(products)
      )
   }

   async sendNotify(data) {
      const { url, device, storage, colors } = data
      const authUsers = await UserController.getAllUsers()
      const message = `ПОСТУПЛЕНИЕ ТОВАРА:\n${url}\nМодель: ${device}\nПамять: ${storage}\nРасцветки:\n${colors}`
      for (let user of authUsers) {
         try {
            await this.bot.sendMessage(user.tg_id, message, {
               parse_mode: 'HTML', disable_web_page_preview: true
            })
         } catch (error) {
            console.log(error)
            console.log('ERROR SEND NOTIFY ^')
         }
      }
      ProductController.deleteProduct({
         device: device, storage: storage
      })
   }

   async sendProducts(data) {
      let tgID = 11111111
      console.log(this.user)
      for (let user in this.user) {
         if(this.user[user].parseProduct) {
            this.user[user].parseProduct = false
            tgID = user
         }
      }
      const parsedData = data[0]
      const url = data[1]
      const mainTitle = `<pre>ПОДПИСКА НА ТОВАРЫ:</pre>\n${url}`
      try {
         await this.bot.sendMessage(tgID, mainTitle, {
            parse_mode: 'HTML', disable_web_page_preview: true
         })
         for (let product of parsedData) {
            const deviceName = product.device
            const prodTitle = `<b>${deviceName}</b>`
            const msg = await this.bot.sendMessage(tgID, prodTitle, {
               reply_markup: JSON.stringify({
                  inline_keyboard: keyboard.parsedProducts(deviceName, product.storage)
               }), parse_mode: 'HTML'
            })
            this.user[tgID].menu[msg.message_id] = {
               device: deviceName,
               url: url,
               title: prodTitle,
               state: parsedData
            }
         }
      } catch (error) {
         console.log(error)
      }
   }

   async toggleProduct(device, storage, chat_id, message_id, query_id) {
      if(!this.checkMessageExist(chat_id, query_id, message_id)) return
      let menuItemIndex = 0
      const allMenuData = this.user[chat_id].menu[message_id].state
      const data = {
         url: this.user[chat_id].menu[message_id].url,
         device: device,
         storage: storage
      }
      for (const [index, item] of allMenuData.entries()) {
         if(item.device === device) menuItemIndex = index
      }

      if(this.user[chat_id].menu[message_id].state[menuItemIndex].storage[storage]) {
         this.user[chat_id].menu[message_id].state[menuItemIndex].storage[storage] = false
         ProductController.deleteProduct(data)
         axios.post('http://localhost:3000/unWatchProduct', data)
      } else {
         this.user[chat_id].menu[message_id].state[menuItemIndex].storage[storage] = true
         ProductController.addProduct(data)
         this.bot.answerCallbackQuery(query_id, { text: 'Запуск парсера' })
         axios.post('http://localhost:3000/watchProduct', data)
      }
      try {
         await this.editKeyboard(
            this.user[chat_id].menu[message_id].title,
            chat_id, message_id,
            keyboard.parsedProducts(
               device, this.user[chat_id].menu[message_id].state[menuItemIndex].storage
            )
         )
         return
      } catch (error) {
         console.log(error)
         console.log('MAIN MENU ERR ^')
      }
   }

   async addNewPhone(chat_id) {
      await this.checkInit(chat_id)
      const title = 'Для удаления привязанного телефона, нажмите на соотвествующую кнопку с его номером.\nДля добавления нового, отправьте его номер в чат в формате: \n+7xxxxxxxxxx'
      await this.bot.sendMessage(chat_id, title, {
         reply_markup: JSON.stringify({
            inline_keyboard: await this.existPhonesKeyboard()
         })
      })
      this.user[chat_id].currentPath = 'addNewPhone'
   }

   async deletePhone(chat_id, phone_num, message_id) {
      await UserController.deletePhone(phone_num)
      this.bot.editMessageText(`Пользователь с номером ${phone_num} успешно удалён`, {
         chat_id: chat_id,
         message_id: message_id,
         reply_markup: JSON.stringify({
            inline_keyboard: await this.existPhonesKeyboard()
         })
      })
   }

   async checkAddNewPhone(chat_id, phone_num) {
      await this.checkInit(chat_id)
      if(this.user[chat_id].currentPath === 'addNewPhone') {
         const checkCorrectPhone = parseInt(phone_num)
         if(checkCorrectPhone.toString().length !== 11) {
            await this.bot.sendMessage(chat_id, 'Номер указан не верно')
            return
         }
         const saveData = await UserController.saveNewPhone(phone_num)
         await this.bot.sendMessage(chat_id, saveData.text)
      }
   }

   async adminMenu(chat_id) {
      if(!this.user[chat_id]) {
         this.initNavigation(chat_id)
         await this.startedAdminKeyboard(chat_id)
      }
   }
   async forceStarted(chat_id) {
      this.initNavigation(chat_id)
      await this.startedAdminKeyboard(chat_id)
   }
   async unAuthorizedUser(chat_id) {
      await this.bot.sendMessage(chat_id, 'Для доступа к боту, нажмите на кнопку ниже:', {
         reply_markup: {
            keyboard: [[{
               text: '📞 Авторизация по номеру телефона',
               request_contact: true
            }]]
         }
      })
   }
   async userNotExist(chat_id) {
      await this.bot.sendMessage(chat_id, '⛔️')
      await this.bot.sendMessage(chat_id, 'Вы не имеете доступа к боту')
   }

   async authorizedUser(chat_id) {
      const message = await this.bot.sendMessage(chat_id, 'Вы успешно авторизованы', {
         reply_markup: {
            keyboard: [[{
               text: 'Авторизованный пользователь',
               resize_keyboard: true
            }]]
         }
      })
      await this.bot.deleteMessage(chat_id, message.message_id)
      await this.bot.sendMessage(chat_id, '✅')
      await this.bot.sendMessage(chat_id, 'Вы успешно авторизованы!')
   }

   async startedAdminKeyboard(chat_id) {
      this.bot.sendMessage(chat_id, '<pre>ВЫ ВОШЛИ КАК АДМИНИСТРАТОР</pre>', {
         reply_markup: {
            keyboard: [['🛒 Мои товары', '📞 Добавить номер']],
            resize_keyboard: true
         }, parse_mode: 'HTML'
      })
   }

   async existPhonesKeyboard() {
      const users = await UserController.getAuthUsers()
      const phonesKeyboard = []
      let keyboardRow = []
      for(let user of users) {
         const { phone_num } = user
         keyboardRow.push({
            text: `${phone_num} ❌`,
            callback_data: phone_num,
         })
         if(keyboardRow.length === 1) {
            phonesKeyboard.push(keyboardRow)
            keyboardRow = []
         }
      }
      keyboardRow.length > 0 ? phonesKeyboard.push(keyboardRow) : ''
      return phonesKeyboard
   }
   async checkInit(chat_id) {
      if(!this.user[chat_id]) this.initNavigation(chat_id)
   }
   async initNavigation(chat_id) {
      this.user[chat_id] = {
         menu: {},
         currentPath: '/'
      }
   }
   checkUserExist(tgID) {
      if(!this.user[tgID]) this.user[tgID] = { menu: {} }
   }
   checkMessageExist(chat_id, query_id, message_id) {
      if(this.user[chat_id]) {
         if(!this.user[chat_id].menu[message_id]) {
            this.bot.answerCallbackQuery(query_id, { text: 'Сообщение устарело' })
            return false
         }
      }
      return true
   }

   async editKeyboard(title, chat_id, message_id, keyboard) {
      await this.bot.editMessageText(title, {
         chat_id: chat_id,
         message_id: message_id,
         reply_markup: JSON.stringify({
            inline_keyboard: keyboard
         }), parse_mode: 'HTML'
      })
   }
}