import { UserController, ProductController } from '../controllers'
import { Parser } from '../parser/parser'

export class MainMenu {
   constructor(bot) {
      this.bot = bot
      this.user = {}
   }

   async sendNotify(data) {
      const authUsers = await UserController.getAuthUsers()
      const message = data.text
      for (let user of authUsers) {
         try {
            await this.bot.sendMessage(user.tg_id, message, { parse_mode: 'HTML' })
         } catch (error) {
            console.log(error)
         }
      }
   }

   async sendProducts(data) {
      const tgID = 1884297416
      this.checkUserExist(tgID)
      const parsedData = data[0]
      const url = data[1]
      const mainTitle = `<pre>ТОВАР</pre>\n${url}`
      try {
         await this.bot.sendMessage(tgID, mainTitle, { parse_mode: 'HTML' })
         for (let product of parsedData) {
            const deviceName = product.device
            const prodTitle = `<b>${deviceName}</b>`
            const msg = await this.bot.sendMessage(tgID, prodTitle, {
               reply_markup: JSON.stringify({
                  inline_keyboard: this.prepareProductsKeyboard(deviceName, product.storage)
               }),
               parse_mode: 'HTML'
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

   prepareProductsKeyboard(device, storages) {
      const storageKeyboard = []
      let rows = []
      const itemsCount = Object.keys(storages).length
      let indexRows = 0
      let indexCount = 0
      for (let item in storages) {
         const checkbox = storages[item] ? '✅' : ''
         rows.push({
            text: `${checkbox} ${item}`,
            callback_data: `~${device}|${item}`,
         })
         indexRows++
         indexCount++
         if(indexRows === 2) {
            storageKeyboard.push(rows)
            rows = []
            indexRows = 0
         }
         if(indexCount === itemsCount) {
            if(rows.length > 0) storageKeyboard.push(rows)
         }
      }
      return storageKeyboard
   }

   async toggleProduct(device, storage, chat_id, message_id) {
      let menuItemIndex = 0
      const allMenuData = this.user[chat_id].menu[message_id].state

      for (const [index, item] of allMenuData.entries()) {
         if(item.device === device) menuItemIndex = index
      }

      if(this.user[chat_id].menu[message_id].state[menuItemIndex].storage[storage]) {
         this.user[chat_id].menu[message_id].state[menuItemIndex].storage[storage] = false
         ProductController.deleteProduct({
            device: device,
            storage: storage
         })
      } else {
         this.user[chat_id].menu[message_id].state[menuItemIndex].storage[storage] = true
         ProductController.addProduct({
            url: this.user[chat_id].menu[message_id].url,
            device: device,
            storage: storage
         })
      }
      await this.bot.editMessageText(this.user[chat_id].menu[message_id].title, {
         chat_id: chat_id,
         message_id: message_id,
         reply_markup: JSON.stringify({
            inline_keyboard: this.prepareProductsKeyboard(
               device, this.user[chat_id].menu[message_id].state[menuItemIndex].storage
            )
         }), parse_mode: 'HTML'
      })
      return
   }

   async addNewPhone(chat_id) {
      await this.checkInit(chat_id)
      const title = 'Для удаления привязанного телефона, нажмите на соотвествующую кнопку с его номером.\nДля добавления нового, отправьте его номер в чат в формате: \n+7xxxxxxxxxx/Группа/Фамилия Имя'
      const users = await UserController.getAllUsers()
      this.existPhonesKeyboard(users)
      await this.bot.sendMessage(chat_id, title, {
         reply_markup: JSON.stringify({
            inline_keyboard: this.existPhonesKeyboard(users)
         })
      })
      this.user[chat_id].currentPath = 'addNewPhone'
   }

   async deletePhone(chat_id, phone_num, message_id) {
      await UserController.deletePhone(phone_num)
      const users = await UserController.getAllUsers()
      this.bot.editMessageText(`Пользователь с номером ${phone_num} успешно удалён`, {
         chat_id: chat_id,
         message_id: message_id,
         reply_markup: JSON.stringify({
            inline_keyboard: this.existPhonesKeyboard(users)
         })
      })
   }

   async checkAddNewPhone(chat_id, userData) {
      await this.checkInit(chat_id)
      if(this.user[chat_id].currentPath === 'addNewPhone') {
         const checkCorrectData = userData.split('/')
         const user = {
            phone: checkCorrectData[0],
            group: checkCorrectData[1],
            name: checkCorrectData[2],
         }
         const checkCorrectPhone = parseInt(user.phone)
         console.log(checkCorrectPhone)
         if(checkCorrectPhone.toString().length !== 11) {
            await this.bot.sendMessage(chat_id, 'Номер указан не верно')
            return
         }
         if(!user.group) {
            await this.bot.sendMessage(chat_id, 'Укажите группу')
            return
         }
         if(!user.name) {
            await this.bot.sendMessage(chat_id, 'Укажите Фамилию Имя')
            return
         }
         // console.log(user)
         const saveData = await UserController.saveNewPhone(user)
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

   existPhonesKeyboard(users) {
      const phonesKeyboard = []
      let keyboardRow = []
      for(let user of users) {
         const userGroup = user.role_id === 2 ? 'Директор' : 'РП'
         const btnText = `${user.phone_num}/${userGroup}/${user.name}`
         keyboardRow.push({
            text: `${user.phone_num} / ${userGroup} / ${user.name} ❌`,
            callback_data: btnText,
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
      this.user[chat_id] = { currentPath: '/' }
   }
   checkUserExist(tgID) {
      if(!this.user[tgID]) this.user[tgID] = { menu: {} }
   }
}