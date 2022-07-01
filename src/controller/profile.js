const { user, profile } = require('../../models')


exports.getProfile = async (req, res) => {
    try {
        const { id } = req.params

        let data = await profile.findOne({
            where: {
                idUser: req.user.id
            },
            include:{
                model:user,
                as:'user',
                attributes:{
                    exclude:['password','createdAt', 'updatedAt']
                }
            },
            
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            }
        })

        data = JSON.parse(JSON.stringify(data))
        res.send({
            status: 'success',
            data: {
                ...data,
                image: data.image ? process.env.PATH_FILE + data.image : null
            }
        })
    } catch (error) {
        console.log(error)
        res.status(400).send({
            status: 'failed',
            message: 'server error'
        })
    }
}

exports.updateProfile = async (req, res) => {
    try {
        const id = req.user.id
        const update = {
            image: req.file.filename,
            postCode: req.body.postCode,
            address: req.body.address,
            idUser: id
        }

        const updateProfile = {
            name: req.body.name,
            email: req.body.email
        }

        await profile.update(update, {
            where: {
                idUser: id
            }
        })

        await user.update(updateProfile, {
            where: {
                id: id
            }
        })

        res.send({
            status: "success",
            data: {
                update,
                updateProfile,
                image: req.file.filename
            }
        })
    } catch (error) {
        console.log(error);
        res.status(400).send({
            status: 'failed',
            message: 'server error'
        })
    }
}

exports.getProfiles = async (req, res) => {
    try {
        const { id } = req.params

        let data = await profile.findOne({
            where: {
                idUser: id
            },
            include:{
                model:user,
                as:'user',
                attributes:{
                    exclude:['password','createdAt', 'updatedAt']
                }
            },
            
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            }
        })

        data = JSON.parse(JSON.stringify(data))
        res.send({
            status: 'success',
            data: {
                ...data,
                image: data.image ? process.env.PATH_FILE + data.image : null
            }
        })
    } catch (error) {
        console.log(error)
        res.status(400).send({
            status: 'failed',
            message: 'server error'
        })
    }
}