const { user, profile, chat } = require('../../models')

exports.getUsers = async (req,res)=>{
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
        
        res.send({
            status:'success',
            customerContacts
        })
    } catch (error) {
        console.log(error)
        res.status(400).send({
            status: 'failed',
            message: 'server error'
        })
    }
}