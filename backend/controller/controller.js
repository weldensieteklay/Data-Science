const { User } = require('../model/model')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PythonShell } = require('python-shell');
const path = require('path');
const { spawn } = require('child_process');


//Sign up
exports.signUp = async (req, res, next) => {

    const { first_name, last_name, phone, email, password } = req.body;
    //simple validation
    if (!first_name || !last_name || !email || !password || !phone) {
        res.status(400).json({ message: "All fields are required" })
    }
    try {
        //Check existing user
        let user = await User.findOne({ email: email })

        if (user) {
            return res.status(400).json({ message: "User already exists" })
        }

        bcrypt.hash(password, 12)
            .then(async hashedPassword => {
                const user = new User({
                    first_name: first_name,
                    last_name: last_name,
                    email: email,
                    password: hashedPassword,
                    role: 'user',
                    phone: phone,
                    status: 'active',
                });

                await user.save()
                const token = jwt.sign({
                    email: user.email, id: user._id, first_name: user.first_name,
                    last_name: user.last_name, phone: user.phone, role: user.role
                }, process.env.jwtSecret);

                res.status(200).send({
                    token, email: user.email, id: user._id, balance: user.balance,
                    first_name: user.first_name, phone: user.phone, last_name: user.last_name, role: user.role
                });

            })

    }
    catch (err) {
        console.log(err.message, 'sign up error')
        res.status(400).send({ message: err });
    };
};


//User logn in
exports.signIn = (req, res) => {

    const { email, password } = req.body;

    //simple validation
    if (!email || !password) {
        res.status(406).json({ message: "All fields are required" })
    }

    User.findOne({ email: email })
        .then(user => {

            if (user) {

                bcrypt.compare(password, user.password)
                    .then(isMatch => {
                        if (isMatch) {
                            const token = jwt.sign({
                                email: user.email, id: user._id, first_name: user.first_name,
                                last_name: user.last_name, phone: user.phone, role: user.role
                            }, process.env.jwtSecret);

                            res.status(200).send({
                                token, email: user.email, id: user._id, balance: user.balance,
                                first_name: user.first_name, phone: user.phone, last_name: user.last_name, role: user.role
                            });

                        } else {

                            res.status(408).send({ message: "Password doesn't match" });
                        }
                    });
            } else {
                res.status(403).send({ message: "User doesn't exist" });
            }
        }).catch(err => {
            res.json({ message: err });
        });
};

//get list of users. All are async requests
exports.getAllUsers = async (req, res) => {
    await User.find({ role: { $in: ['user', 'admin'] } })
        .then(data => {
            res.status(200).send({ data });
        }).catch(err => {
            res.json({ message: err });
        });

}


exports.updateUser = (req, res) => {
    const userId = req.params.id;
    const updatedFields = req.body;
    User.findByIdAndUpdate(userId, { $set: updatedFields }, { new: true })
        .then(updatedUser => {
            if (!updatedUser) {
                return res.status(404).json({ message: "User not found" });
            }
            res.status(200).json({ message: "User updated successfully", user: updatedUser });
        })
        .catch(error => {
            console.error('Error updating user:', error);
            res.status(500).json({ message: "Internal server error" });
        });
};


exports.deleteUser = (req, res) => {
    const userId = req.params.id;

    User.findByIdAndDelete(userId)
        .then(deletedUser => {
            if (!deletedUser) {
                return res.status(404).json({ message: "User not found" });
            }
            res.status(200).json({ message: "User deleted successfully" });
        })
        .catch(error => {
            console.error('Error deleting user:', error);
            res.status(500).json({ message: "Internal server error" });
        });
};


exports.OLSPrediction = (req, res) => {
    const scriptPath = path.join(__dirname, '../python/OLS.py');
    
    const pythonPath = "C:\\Users\\weldensie\\AppData\\Local\\Microsoft\\WindowsApps\\python.exe"

    const options = {
        scriptPath: path.dirname(scriptPath),
        pythonPath: pythonPath,
        pythonOptions: ['-u'], 
        args: [JSON.stringify(req.body.data)],
    };

    PythonShell.run('OLS.py', options, (err, results) => {
        if (err) {
            console.error('Error executing Python script:', err);
            res.status(500).json({ error: 'Error executing Python script.' });
        } else {
            try {
                const result = JSON.parse(results[0]);
                res.json(result);
            } catch (error) {
                console.error('Error parsing Python script output:', error);
                res.status(500).json({ error: 'Error parsing Python script output.' });
            }
        }
    });
};
