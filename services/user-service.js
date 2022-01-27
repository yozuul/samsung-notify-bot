import { UserModel } from '../models'
import { Op } from '../utils'

export class UserService {
   static async getAllUsers() {
         return UserModel.findAll({
            where: {
               [Op.and]: [
                  { tg_id: {[Op.ne]: null }}
               ]
            }
         })
   }
   static async getAuthUsers() {
      return UserModel.findAll({
         where: {
            [Op.and]: [
               { tg_id: {[Op.ne]: null }},
               { role_id: 2 }
            ]
         }
      })
   }
   static async saveNewPhone(phone_num) {
      let data = {
         result: true,
         text: '🔔\nНомер успешно добавлен. \nТеперь пользователь может авторизоваться в боте.'
      }
      const findUser = await UserModel.findOne({
         where: { phone_num: phone_num }
      })
      if(findUser) {
         data.result = false
         data.text = 'Указанный номер уже привязан.'
      } else {
         UserModel.create({
            name: 'User',
            role_id: 2,
            phone_num: phone_num
         })
      }
      return data
   }
   static async confirmPhone(userData) {
      const user = await UserModel.findOne({
         where: { phone_num: userData.phone_num }
      })
      user.tg_id = userData.tg_id
      await user.save()
      return user
   }
   static async deletePhone(userData) {
      console.log(userData)
      await UserModel.destroy({
         where: { phone_num: userData },
      })
      return true
   }
   static async findByTgId(tg_id) {
      const user = await UserModel.findOne({
         where: { tg_id: tg_id }
      })
      return user
   }
   static async findByPhone(phone_num) {
      const users = await UserModel.findAll({
         row: true
      })
      return users.find(user => parseInt(user.phone_num) === parseInt(phone_num))
   }
}



