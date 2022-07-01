const { chat, user, profile } = require('../../models')
const jwt = require('jsonwebtoken')
const { Op } = require('sequelize')

const connectedUser = {}

const socketIo = (io) => {
    io.use((socket, next) => {
        if (socket.handshake.auth && socket.handshake.auth.token) {
            next()
        } else {
            next(new Error('Not Authorized'))
        }
    })

    io.on('connection', async (socket) => {
        console.log('Client connect:', socket.id);
        const userId = socket.handshake.query.id
        connectedUser[userId] = socket.id

        // load admin contact
        socket.on('load admin contact', async () => {
            try {
                const adminContact = await user.findOne({
                    where: {
                        status: 'admin'
                    },
                    include: [{
                        model: profile,
                        as: 'profile',
                        attributes: {
                            exclude: ['createdAt', 'updatedAt', 'idUser']
                        }
                    }],
                    attributes: {
                        exclude: ['createdAt', 'updatedAt', 'password']
                    }
                })
                socket.emit('admin contact', adminContact)
            } catch (error) {
                console.log(error);
            }
        })

        // load customer contact
        socket.on('load customer contacts', async () => {
            try {
                let customerContacts = await user.findAll({
                    where:{
                        status:'customer'
                    },
                    include: [{
                        model: profile,
                        as: 'profile',
                        attributes: {
                            exclude: ['createdAt', 'updatedAt']
                        }
                    }, {
                        model: chat,
                        as: 'sender',
                        attributes: {
                            exclude: ['createdAt', 'updatedAt', 'idRecipient', 'idSender']
                        }
                    }, {
                        model: chat,
                        as: 'recipient',
                        attributes: {
                            exclude: ['createdAt', 'updatedAt', 'idRecipient', 'idSender']
                        }
                    }],
                    attributes: {
                        exclude: ['createdAt', 'updatedAt', 'password']
                    }
                })
        
                customerContacts = JSON.parse(JSON.stringify(customerContacts))
                customerContacts = customerContacts.map((item) => ({
                    ...item,
                    profile: {
                        ...item.profile,
                        image: item.profile?.image ? process.env.PATH_FILE + item.profile?.image : null
                    }
                }))
                socket.emit('customer contacts', customerContacts)
                console.log(customerContacts);
            } catch (error) {
                console.log(error);
            }
        })


        // load message
        socket.on('load messages', async (payload) => {
            try {
                const token = socket.handshake.auth.token

                const tokenKey = process.env.TOKEN_KEY
                const verified = jwt.verify(token, tokenKey)

                const idRecipient = payload //get dari id client
                const idSender = verified.id

                const data = await chat.findAll({
                    where: {
                        idSender: {
                            [Op.or]: [idRecipient, idSender]
                        },
                        idRecipient: {
                            [Op.or]: [idRecipient, idSender]
                        }
                    },
                    include: [{
                        model: user,
                        as: 'recipient',
                        attributes: {
                            exclude: ['createdAt', 'updatedAt', 'password']
                        }
                    }, {
                        model: user,
                        as: 'sender',
                        attributes: {
                            exclude: ['createdAt', 'updatedAt', 'password']
                        }
                    }],
                    order: [['createdAt', 'ASC']],
                    attributes: {
                        exclude: ['createdAt', 'updatedAt', 'idRecipient', 'idSender']
                    }
                })
                socket.emit('messages', data)
            } catch (error) {
                console.log(error);
            }
        })

        // send message
        socket.on('send message', async (payload) => {
            try {
                const token = socket.handshake.auth.token

                const tokenKey = process.env.TOKEN_KEY
                const verified = jwt.verify(token, tokenKey)

                const idSender = verified.id
                const { message, idRecipient } = payload

                await chat.create({
                    message,
                    idRecipient,
                    idSender
                })
                io.to(socket.id).to(connectedUser[idRecipient]).emit('new message', idRecipient)
            } catch (error) {
                console.log(error);
            }
        })
        socket.on('disconnect', () => {
            console.log('Client disconnected', socket.id);
        })
    })
}

module.exports = socketIo