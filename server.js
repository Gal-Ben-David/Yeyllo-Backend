import http from 'http'
import cors from 'cors'
import express from 'express'
import cookieParser from 'cookie-parser'

import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

import { authRoutes } from './api/auth/auth.routes.js'
import { userRoutes } from './api/user/user.routes.js'
import { boardRoutes } from './api/board/board.routes.js'
// import { reviewRoutes } from './api/review/review.routes.js'
import { setupSocketAPI } from './services/socket.service.js'
import { loggerService } from './services/logger.service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// import { toyService } from './services/toy.service.js'
// import { userService } from './services/user.service.js'

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
        credentials: true
    }
    app.use(cors(corsOptions))
}

// routes
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
// app.use('/api/review', reviewRoutes)
app.use('/api/board', boardRoutes)

setupSocketAPI(server)

app.get('/**', (req, res) => {
    res.sendFile(path.resolve('public/index.html'))
})

const PORT = process.env.PORT || 3030
server.listen(PORT, () =>
    loggerService.info(`Server listening on port http://127.0.0.1:${PORT}/`)
)

// REST API for Toys
// app.get('/api/toy', (req, res) => {
//     const filterBy = {
//         name: req.query.name || '',
//         price: +req.query.price || 0,
//         labels: req.query.labels || [],
//         inStock: req.query.inStock || 'all',
//         selector: req.query.selector || '',
//     }
//     toyService.query(filterBy)
//         .then(toys => res.send(toys))
//         .catch(err => {
//             loggerService.error('Cannot get toys', err)
//             res.status(400).send('Cannot get toys')
//         })
// })

// app.get('/api/toy/:toyId', (req, res) => {
//     const { toyId } = req.params

//     toyService.getById(toyId)
//         .then(toy => res.send(toy))
//         .catch(err => {
//             loggerService.error('Cannot get toy', err)
//             res.status(400).send('Cannot get toy')
//         })
// })

// app.post('/api/toy', (req, res) => {
//     // const loggedinUser = userService.validateToken(req.cookies.loginToken)
//     // if (!loggedinUser) return res.status(401).send('Cannot add toy')
//     const toy = {
//         name: req.body.name,
//         price: +req.body.price,
//         labels: req.body.labels,
//         inStock: req.body.inStock,
//         imgUrl: req.body.imgUrl,
//         createdAt: Date.now()
//     }
//     toyService.save(toy, null)
//         .then(savedToy => res.send(savedToy))
//         .catch(err => {
//             loggerService.error('Cannot save toy', err)
//             res.status(400).send('Cannot save toy')
//         })
// })

// app.put('/api/toy/:id', (req, res) => {
//     // const loggedinUser = userService.validateToken(req.cookies.loginToken)
//     // if (!loggedinUser) return res.status(401).send('Cannot update toy')

//     const toy = {
//         _id: req.body._id,
//         name: req.body.name,
//         price: +req.body.price,
//         inStock: req.body.inStock,
//     }
//     toyService.save(toy, null)
//         .then(savedToy => res.send(savedToy))
//         .catch(err => {
//             loggerService.error('Cannot save toy', err)
//             res.status(400).send('Cannot save toy')
//         })
// })

// app.delete('/api/toy/:toyId', (req, res) => {
//     // const loggedinUser = userService.validateToken(req.cookies.loginToken)
//     // if (!loggedinUser) return res.status(401).send('Cannot remove toy')

//     const { toyId } = req.params
//     toyService.remove(toyId, null)
//         .then(() => res.send('Removed!'))
//         .catch(err => {
//             loggerService.error('Cannot remove toy', err)
//             res.status(400).send('Cannot remove toy')
//         })
// })
