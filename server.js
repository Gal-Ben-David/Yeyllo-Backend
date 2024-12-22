import http from 'http'
import cors from 'cors'
import express from 'express'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import OpenAI from 'openai'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

import { authRoutes } from './api/auth/auth.routes.js'
import { userRoutes } from './api/user/user.routes.js'
import { boardRoutes } from './api/board/board.routes.js'
import { setupSocketAPI } from './services/socket.service.js'
import { loggerService } from './services/logger.service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({
    path: '.env', //give .env file location
})

const genAI = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export default genAI

loggerService.info('server.js loaded...')

const app = express()
const server = http.createServer(app)

app.use(express.json()) //needed for the request bodies
app.use(cookieParser())
// app.use(express.static('public'))

if (process.env.NODE_ENV === 'production') {
    // Express serve static files on production environment
    // app.use(express.static(path.resolve(__dirname, 'public')))
    app.use(express.static(path.resolve('public')))
} else {
    // Configuring CORS
    // Make sure origin contains the url
    // your frontend dev-server is running on
    const corsOptions = {
        origin: [
            'http://127.0.0.1:5173',
            'http://localhost:5173',
            'http://127.0.0.1:5174',
            'http://localhost:5174',
            'http://127.0.0.1:3030',
            'http://localhost:3030',
        ],
        credentials: true,
    }
    app.use(cors(corsOptions))
}

// routes
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/board', boardRoutes)

setupSocketAPI(server)

app.get('/**', (req, res) => {
    res.sendFile(path.resolve('public/index.html'))
})

const PORT = process.env.PORT || 3030
server.listen(PORT, () => loggerService.info(`Server listening on port http://127.0.0.1:${PORT}/`))
