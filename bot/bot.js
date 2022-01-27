import TelegramApi from 'node-telegram-bot-api'
import { darkGray, red, green } from 'ansicolor'

import { UserController } from '../controllers'
import { MainMenu } from './main-menu'

const bot = new TelegramApi(process.env.BOT_TOKEN, { polling: true })
const menu = new MainMenu(bot)

export const botStart = () => {
   // Сообщения
   bot.on('message', async (msg) => {
      const text = msg.text || 'default'
      const chat_id = msg.chat.id
      const checkAuth = await UserController.findByTgId(chat_id)
      if(!checkAuth) {
         menu.unAuthorizedUser(chat_id)
         return
      }
      if(checkAuth.role_id === 1) {
         if(text === '/start') {
            menu.forceStarted(chat_id)
            return
         }
         if(text === '🛒 Мои товары') {
            menu.changeTableUrl(chat_id)
            return
         }
         if(text === '📞 Добавить номер') {
            menu.addNewPhone(chat_id)
            return
         }
         if (text.split('+7')[1]) {
            await menu.checkAddNewPhone(chat_id, text)
            return
         }
         if (text.split('https://www.samsung.com/')[1]) {
            await menu.searchProducts(chat_id, text)
            return
         }
         menu.checkNewUrl(chat_id, text)
         menu.adminMenu(chat_id)
      }
      console.log(('message:').darkGray, (text).green)
   })

   // Колбеки
   bot.on('callback_query', async (query) => {
      const callback = query.data
      const chat_id = query.message.chat.id
      const { message_id } = query.message
      if (callback.split('+7')[1]) {
         const phoneNum = callback.split('/')[0]
         try {
            menu.deletePhone(chat_id, phoneNum, message_id)
         } catch (error) {
            console.log(error)
         }
      }
      const checkProductToggle = callback.split('~')[1]
      if (checkProductToggle) {
         const productData = checkProductToggle.split('|')
         const device = productData[0]
         const storage = productData[1]
         try {
            menu.toggleProduct(device, storage, chat_id, query.message.message_id, query.id)
         } catch (error) {
            console.log(error)
         }
      }
      console.log(('callback:').darkGray, (callback).green)
   })

   // Контакты
   bot.on('contact', async (msg) => {
      const chat_id = msg.chat.id
      const { contact } = msg
      // console.log(msg)
      let checkPhoneNumberFormat = contact.phone_number
      if(!checkPhoneNumberFormat.split('+')[1]) {
         checkPhoneNumberFormat = '+' + contact.phone_number
      }
      const userContact = {
         // name: `${contact.first_name}`,
         tg_id: `${contact.user_id}`,
         phone_num: `${checkPhoneNumberFormat}`
      }
      if(contact.last_name) {
         userContact.name += contact.last_name
      }
      // console.log(userContact)
      const isUserExist = await UserController.findByPhone(userContact.phone_num)
      // console.log(isUserExist)
      // console.log(userContact)
      if(isUserExist) {
         await UserController.confirmPhone(userContact)
         await menu.authorizedUser(chat_id)
      } else {
         await menu.userNotExist(chat_id)
      }
      return
   })

   console.log(('Бот запущен').darkGray);
   return menu
}