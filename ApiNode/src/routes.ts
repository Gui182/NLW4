import { Router } from 'express'
import { UserController } from './controllers/UserController'

const router = Router()

const useController = new UserController()

router.post("/users", useController.create)

export { router }
