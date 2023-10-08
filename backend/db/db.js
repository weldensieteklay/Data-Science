const mongoose = require('mongoose')

// connecting to mongodb 
exports.connectTodb = () => {
    return new Promise((resolve, reject) => {
            mongoose.connect(process.env.mongoURI, { useUnifiedTopology: true, useNewUrlParser: true })
                .then((res, err) => {
                    if (err) return reject(err)
                    resolve()
                })
    
    })


}

exports.close = () => {
    return mongoose.disconnect()
}


