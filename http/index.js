import axios from 'axios'

const BASE_URL='http://localhost:5000'

const $users = axios.create({
   withCredentials: true,
   baseURL: `${BASE_URL}/users`
})
const $cars = axios.create({
   withCredentials: true,
   baseURL: `${BASE_URL}/cars`
})
const $settings = axios.create({
   withCredentials: true,
   baseURL: `${BASE_URL}/settings`
})

export { $users, $cars, $settings }