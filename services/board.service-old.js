import fs from 'fs'
import { utilService } from './util.service.js'
import { loggerService } from './logger.service.js'

const toys = utilService.readJsonFile('data/toy.json')

export const toyService = {
    query,
    getById,
    remove,
    save
}

function query(filterBy = {}) {
    return Promise.resolve(toys)
        .then(toys => {
            if (filterBy.name) {
                const regex = new RegExp(filterBy.name, 'i')
                toys = toys.filter(toy => regex.test(toy.name))
            }
            if (filterBy.labels.length !== 0) {
                toys = toys.filter(toy => filterBy.labels.some(label => toy.labels.includes(label)))
            }
            if (filterBy.price !== 0) {
                toys = toys.filter(toy => toy.price <= filterBy.price)
            }
            if (filterBy.inStock !== 'all') {
                toys = toys.filter(toy => filterBy.inStock === 'available' ? toy.inStock : !toy.inStock)
            }
            if (filterBy.selector === 'name') {
                toys.sort((toy1, toy2) => toy1.name.toLowerCase().localeCompare(toy2.name.toLowerCase()))
            }
            if (filterBy.selector === 'price') {
                toys.sort((toy1, toy2) => (toy1.price - toy2.price))
            }
            if (filterBy.selector === 'createdAt') {
                toys.sort((toy1, toy2) => (toy1.createdAt - toy2.createdAt))
            }
            return toys
        })
}

function getById(toyId) {
    const toy = toys.find(toy => toy._id === toyId)
    if (!toy) return Promise.reject('Cannot find toy', toyId)
    return Promise.resolve(toy)
}

function remove(toyId, loggedInUser = null) {
    const toyIdx = toys.findIndex(toy => toy._id === toyId)
    if (toyIdx === -1) return Promise.reject(`Cannot find toy ${toyId}`)

    // const toy = toys[toyIdx]
    // if (!loggedInUser.isAdmin &&
    //     toy.creator._id !== loggedInUser._id) {
    //     return Promise.reject('Not your toy')
    // }

    toys.splice(toyIdx, 1)
    return _saveToysToFile()
}

function save(toy, loggedInUser = null) {
    if (toy._id) {
        const toyToUpdate = toys.find(currToy => currToy._id === toy._id)
        // if (!loggedInUser.isAdmin &&
        //     toyToSave.creator._id !== loggedInUser._id) {
        //     return Promise.reject('Not your toy')
        // }

        toyToUpdate.name = toy.name
        toyToUpdate.price = toy.price
        toyToUpdate.inStock = toy.inStock
        toy = toyToUpdate

    } else {
        toy._id = utilService.makeId()
        toy.imgUrl = 'src/assets/img/default-pic.jpg'
        if (!toy.price) toy.price = 100
        // toy.creator = loggedInUser
        toys.unshift(toy)
    }

    return _saveToysToFile().then(() => toy)
}


function _saveToysToFile() {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(toys, null, 4)
        fs.writeFile('data/toy.json', data, (err) => {
            if (err) {
                return reject(err)
            }
            resolve()
        })
    })
}