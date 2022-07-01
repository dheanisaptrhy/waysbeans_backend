const express = require('express')
const router = express.Router()

// middleware
const { uploadFile } = require('../middlewares/uploadFile')
const { auth } = require('../middlewares/auth')

// controller
const { register, login, checkAuth } = require('../controller/auth')
const { addProduct, getProducts, getProductDetail, updateProduct, deleteProduct } = require('../controller/product')
const { getProfile, updateProfile, getProfiles } = require('../controller/profile')
const { getUsers } = require('../controller/user')
const { addTransaction, getTransactionsClient, deleteTransaction, getTransactionsAdmin, notification, updateCancel, updateApprove } = require('../controller/transaction')

// router auth
router.post('/register', register)
router.post('/login', login)
router.get('/check-auth', auth, checkAuth)

// router products
router.post('/product', auth, uploadFile('image'), addProduct)
router.get('/products', getProducts)
router.get('/product/:id', getProductDetail)
router.patch('/product/:id', auth, uploadFile('image'), updateProduct)
router.delete('/product/:id', auth, deleteProduct)

// router profile
router.get('/users', getUsers)
router.get('/profile', auth, getProfile)
router.get('/profile/:id', auth, getProfiles)
router.patch('/profile', auth, uploadFile('image'), updateProfile)

// router transaction
router.post('/transaction', auth, addTransaction)
router.get('/transactionsclient', auth, getTransactionsClient)
router.get('/transactionsadmin', getTransactionsAdmin)
router.patch('/transactioncancel/:id', updateCancel)
router.patch('/transactionapprove/:id', updateApprove)
router.delete('/transaction/:id', deleteTransaction)

// notif midtrans
router.post('/notification', notification)

module.exports = router