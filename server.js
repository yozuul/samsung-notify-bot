import {} from 'dotenv/config'
import express from 'express'
import { darkGray, red } from 'ansicolor'

import { botStart } from './bot'
import { Parser } from './parser/parser'

const PORT = process.env.API_PORT
const botCommand = await botStart()

const startServer = async () => {
   const app = express()
   try {
      app.use(express.json())
      app.post('/sendNotify', (req, res, next) => {
         botCommand.sendNotify(req.body)
         res.send('OK')
         next()
      })
      app.post('/sendProducts', (req, res, next) => {
         botCommand.sendProducts(req.body)
         res.send('OK')
         next()
      })
      app.listen(PORT, () => {
         console.log((`\nСервер запущен на порту ${PORT}`).darkGray)
      })
   } catch (err) {
      console.log(err)
      console.log(('Ошибка запуска сервера').red);
   }
}

startServer()

const someURL = 'https://www.samsung.com/ru/smartphones/galaxy-s21-5g/buy/'
const someURL2 = 'https://www.samsung.com/ru/tablets/galaxy-tab-s7/buy/'
new Parser().urlChecker(someURL)