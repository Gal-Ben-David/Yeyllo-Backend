import { loggerService } from '../../services/logger.service.js'
// import { socketService } from '../../services/socket.service.js'
import { userService } from '../user/user.service.js'
import { authService } from '../auth/auth.service.js'
import { reviewService } from './review.service.js'
import { toyService } from '../toy/toy.service.js'

export async function getReviews(req, res) {
    try {
        const reviews = await reviewService.query(req.query)
        console.log(req.query)
        console.log('review', reviews)
        res.send(reviews)
    } catch (err) {
        loggerService.error('Cannot get reviews', err)
        res.status(400).send({ err: 'Failed to get reviews' })
    }
}

export async function deleteReview(req, res) {
    var { loggedinUser } = req
    const { id: reviewId } = req.params

    try {
        const deletedCount = await reviewService.remove(reviewId, loggedinUser)
        if (deletedCount === 1) {
            // socketService.broadcast({ type: 'review-removed', data: reviewId, userId: loggedinUser._id })
            res.send({ msg: 'Deleted successfully' })
        } else {
            res.status(400).send({ err: 'Cannot remove review' })
        }
    } catch (err) {
        loggerService.error('Failed to delete review', err)
        res.status(400).send({ err: 'Failed to delete review' })
    }
}

export async function addReview(req, res) {
    var { loggedinUser } = req

    try {
        var review = req.body
        review.byUserId = loggedinUser._id
        const toyId = review.aboutToyId
        review = await reviewService.add(review)

        //* Give the user credit for adding a review

        // Update user score in login token as well
        // const loginToken = authService.getLoginToken(loggedinUser)
        // res.cookie('loginToken', loginToken)

        //* prepare the updated review for sending out
        // const loginToken = authService.getLoginToken(loggedinUser)
        // prepare the updated review for sending out
        review.byUser = loggedinUser
        const toy = await toyService.getToyById(toyId)
        review.aboutToy = { name: toy.name, price: toy.price, _id: toy._id }
        delete review.aboutToyId
        delete review.byUserId

        // socketService.broadcast({ type: 'review-added', data: review, userId: loggedinUser._id })
        // socketService.emitToUser({ type: 'review-about-you', data: review, userId: review.aboutUser._id })

        // const fullUser = await userService.getById(loggedinUser._id)
        // socketService.emitTo({ type: 'user-updated', data: fullUser, label: fullUser._id })
        res.send(review)

    } catch (err) {
        loggerService.error('Failed to add review', err)
        res.status(400).send({ err: 'Failed to add review' })
    }
}
