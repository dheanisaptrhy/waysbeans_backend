const { transaction, user, product, profile } = require('../../models')

const midtransClient = require('midtrans-client')

// exports.addTransaction = async (req, res) => {
//     try {
//         let data = req.body
//         data = {
//             id: parseInt(data.idProduct + Math.random().toString().slice(3, 8)),
//             ...data,
//             idBuyer: req.user.id,
//             status: "pending"
//         }

//         const newData = await transaction.create(data)

//         const buyerData = await user.findOne({
//             where: {
//                 id: newData.idBuyer
//             },
//             include: {
//                 mode: profile,
//                 as: 'profile',
//                 attributes: {
//                     exclude: ["createdAt", "updatedAt", "idUser"],
//                 },
//             },
//             attributes: {
//                 exclude: ["createdAt", "updatedAt", "password"],
//             },
//         });

//         let snap = new midtransClient.Snap({
//             idProduction: false,
//             serverKey: process.env.MIDTRANS_SERVER_KEY
//         })

//         let parameter = {
//             transaction_details: {
//                 order_id: newData.id,
//                 gross_amount: newData.price
//             },
//             credit_card: {
//                 secure: true,
//             },
//             customer_details: {
//                 full_name: buyerData?.name,
//                 email: buyerData?.email,
//             },
//         };

//         const payment = await snap.createTransaction(parameter)
//         console.log(payment);

//         res.send({
//             status: "pending",
//             message: "Pending transaction payment gateway",
//             payment,
//             product: {
//                 id: data.idProduct
//             },
//             data
//         })
//     } catch (error) {
//         console.log(error);
//         res.status(500).send({
//             status: 'failed',
//             message: 'server error'
//         })
//     }
// }

const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY;
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;

const core = new midtransClient.CoreApi();

core.apiConfig.set({
    isProduction: false,
    serverKey: MIDTRANS_SERVER_KEY,
    clientKey: MIDTRANS_CLIENT_KEY,
});

exports.notification = async (req, res) => {
    try {
        const statusResponse = await core.transaction.notification(req.body);
        const orderId = statusResponse.order_id;
        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status; //pelanggaran

        console.log(statusResponse);

        if (transactionStatus == "capture") {
            if (fraudStatus == "challenge") {
                // TODO set transaction status on your database to 'challenge'
                // and response with 200 OK
                updateTransaction("pending", orderId);
                res.status(200);
            } else if (fraudStatus == "accept") {
                // TODO set transaction status on your database to 'success'
                // and response with 200 OK
                updateProduct(orderId);
                updateTransaction("success", orderId);
                res.status(200);
            }
        } else if (transactionStatus == "settlement") {
            // TODO set transaction status on your database to 'success'
            // and response with 200 OK
            updateTransaction("success", orderId);
            res.status(200);
        } else if (
            transactionStatus == "cancel" ||
            transactionStatus == "deny" ||
            transactionStatus == "expire"
        ) {
            // TODO set transaction status on your database to 'failure'
            // and response with 200 OK
            updateTransaction("failed", orderId);
            res.status(200);
        } else if (transactionStatus == "pending") {
            // TODO set transaction status on your database to 'pending' / waiting payment
            // and response with 200 OK
            updateTransaction("pending", orderId);
            res.status(200);
        }
    } catch (error) {
        console.log(error);
        res.status(500);
    }
};

const updateTransaction = async (status, transactionId) => {
    await transaction.update(
        {
            status,
        },
        {
            where: {
                id: transactionId,
            },
        }
    );
}

const updateProduct = async (orderId) => {
    const transactionData = await transaction.findOne({
        where: {
            id: orderId,
        },
    });
    const productData = await product.findOne({
        where: {
            id: transactionData.idProduct,
        },
    });
    const qty = productData.qty - 1;
    await product.update({ qty }, { where: { id: productData.id } });
}

// =======================================================================

exports.addTransaction = async (req, res) => {
    try {
        const { ...data } = req.body
        const createTransaction = await transaction.create({
            ...data,
            status: "Waiting Approve",
            idBuyer: req.user.id
        })
        res.status({
            status: 'success',
            data: {
                createTransaction
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

// =====================================================================

exports.getTransactionsClient = async (req, res) => {
    try {
        const idBuyer = req.user.id
        let data = await transaction.findAll({
            where: {
                idBuyer
            },
            order: [['createdAt', "DESC"]],
            attributes: {
                exclude: ['updatedAt', 'idBuyer', 'idSeller', 'idProduct']
            },
            include: [
                {
                    model: user,
                    as: 'buyer',
                    attributes: {
                        exclude: ['password', 'image', 'status', 'createdAt', 'updatedAt']
                    }
                },
                {
                    model: user,
                    as: 'seller',
                    attributes: {
                        exclude: ['password', 'image', 'status', 'createdAt', 'updatedAt']
                    }
                },
                {
                    model: product,
                    as: 'products',
                    attributes: {
                        exclude: ['qty', 'idUser', 'createdAt', 'updatedAt']
                    }
                },
            ],
            attributes: {
                exclude: [ 'updatedAt']
            }
        });

        data = JSON.parse(JSON.stringify(data))
        data = data.map((item) => {
            return {
                ...item,
                products: {
                    ...item.products,
                    image: process.env.PATH_FILE + item.products.image
                }
            }
        })

        res.status(200).send({
            status: 'success',
            data
        })

    } catch (error) {
        console.log(error)
        res.status(500).send({
            status: 'failed',
            message: 'server error'
        })
    }
}


exports.getTransactionsAdmin = async (req, res) => {
    try {
        let data = await transaction.findAll({
            order: [['createdAt', "DESC"]],
            attributes: {
                exclude: ['updatedAt', 'idBuyer', 'idSeller', 'idProduct']
            },
            include: [
                {
                    model: user,
                    as: 'buyer',
                    attributes: {
                        exclude: ['password', 'image', 'status', 'createdAt', 'updatedAt']
                    }
                },
                {
                    model: user,
                    as: 'seller',
                    attributes: {
                        exclude: ['password', 'image', 'status', 'createdAt', 'updatedAt']
                    }
                },
                {
                    model: product,
                    as: 'products',
                    attributes: {
                        exclude: ['price', 'qty', 'idUser', 'createdAt', 'updatedAt']
                    }
                },
            ],
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            }
        });

        // let dataProfile = await profile.findOne({
        //     where:{
        //         idUser : data.data.idBuyer
        //     },
        //     attributes: {
        //         exclude: ['createdAt', 'updatedAt']
        //     }
        // })

        data = JSON.parse(JSON.stringify(data))
        data = data.map((item) => {
            return {
                ...item,
                products: {
                    ...item.products,
                    // image: process.env.PATH_FILE + item.product.image
                },
            }
        })

        res.status(200).send({
            status: 'success',
            data,
            // profile
        })

    } catch (error) {
        console.log(error)
        res.status(500).send({
            status: 'failed',
            message: 'server error'
        })
    }
}

// ===================================================================
exports.deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params
        await transaction.destroy({
            where: {
                id
            }
        })

        res.send({
            status: 'success',
            data: {
                id
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


// 
exports.updateCancel = async (req, res) => {
    try {
        const { id } = req.params

        const dataUpdate = {
            status:"Cancel"
        }

        const data = await transaction.update(dataUpdate,{
            where:{
                id
            }
        })
        res.send({
            status:'success',
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

exports.updateApprove = async (req, res) => {
    try {
        const { id } = req.params

        const dataUpdate = {
            status:"Success"
        }

        const data = await transaction.update(dataUpdate,{
            where:{
                id
            }
        })
        res.send({
            status:'success',
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