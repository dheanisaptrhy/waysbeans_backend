const { product, user } = require('../../models')

exports.addProduct = async (req, res) => {
    try {
        const data = {
            title: req.body.title,
            desc: req.body.desc,
            price: req.body.price,
            image: req.file.filename,
            qty: req.body.qty,
            idUser: req.user.id
        }

        const createProduct = await product.create(data)

        let productData = await product.findOne({
            where: {
                id: createProduct.id
            },
            include: {
                model: user,
                as: 'user',
                attributes: {
                    exclude: ["createdAt", "updatedAt", "password"]
                }
            },
            attributes: {
                exclude: ["createdAt", "updatedAt", "idUser"],
            }
        })

        productData = JSON.parse(JSON.stringify(productData))
        res.send({
            status: 'success',
            data: {
                ...productData,
                image: process.env.PATH_FILE + productData.image
            }
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: 'failed',
            message: 'server error'
        })
    }
}

exports.getProducts = async (req, res) => {
    try {
        let data = await product.findAll({
            include: {
                model: user,
                as: 'user',
                attributes: {
                    exclude: ["createdAt", "updatedAt", "password"],
                }
            },
            attributes: {
                exclude: ["createdAt", "updatedAt", "idUser"],
            },
        })

        data = JSON.parse(JSON.stringify(data))

        data = data.map((item) => {
            return {
                ...item,
                image: process.env.PATH_FILE + item.image
            }
        })
        res.send({
            status: 'success',
            data
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: 'failed',
            message: 'server error'
        })
    }
}

exports.getProductDetail = async (req, res) => {
    try {
        const { id } = req.params
        let data = await product.findOne({
            where: {
                id
            },
            include: {
                model: user,
                as: 'user',
                attributes: {
                    exclude: ["createdAt", "updatedAt", "password"],
                },
            },
            attributes: {
                exclude: ['idUser', 'createdAt', 'updatedAt']
            }
        })

        data = JSON.parse(JSON.stringify(data))
        data = {
            ...data,
            image: process.env.PATH_FILE + data.image
        }

        res.send({
            status: 'success',
            data
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: 'failed',
            message: 'server error'
        })
    }
}

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params
        const updates = {
            title: req?.body?.title,
            desc: req?.body?.desc,
            price: req?.body?.price,
            image: req?.file?.filename,
            qty: req?.body?.qty,
            idUser: req?.user?.id
        }

        await product.update(updates, {
            where: {
                id
            }
        })
        res.send({
            status: 'success',
            data: {
                id,
                updates,
                image: req?.file?.filename
            }
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: 'failed',
            message: 'server error'
        })
    }
}

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params
        await product.destroy({
            where: {
                id
            }
        })
        res.send({
            status: 'success',
            data: {
                status:'success',
                message: `Delete product id: ${id} finished`
            }
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: 'failed',
            message: 'server error'
        })
    }
}