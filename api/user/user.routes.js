import express from 'express'

import { requireAuth, requireAdmin } from '../../middlewares/requireAuth.middleware.js'
import { getUser, getUsers, deleteUser, updateUser, addUser } from './user.controller.js'

export const userRoutes = express.Router()

// middleware that is specific to this router
// userRoutes.use(requireAuth)

userRoutes.get('/', getUsers)
userRoutes.get('/:id', getUser)
userRoutes.put('/:id', updateUser)
userRoutes.post('/', addUser)

// userRoutes.put('/:id',  requireAuth, updateUser)
userRoutes.delete('/:id', requireAuth, requireAdmin, deleteUser)
