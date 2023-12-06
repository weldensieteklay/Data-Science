# const { User } = require('../model/model')
# const bcrypt = require('bcryptjs');
# const jwt = require('jsonwebtoken');
# const { PythonShell } = require('python-shell');
# const path = require('path');
# const { spawn } = require('child_process');


# //Sign up
# exports.signUp = async (req, res, next) => {

#     const { first_name, last_name, phone, email, password } = req.body;
#     //simple validation
#     if (!first_name || !last_name || !email || !password || !phone) {
#         res.status(400).json({ message: "All fields are required" })
#     }
#     try {
#         //Check existing user
#         let user = await User.findOne({ email: email })

#         if (user) {
#             return res.status(400).json({ message: "User already exists" })
#         }

#         bcrypt.hash(password, 12)
#             .then(async hashedPassword => {
#                 const user = new User({
#                     first_name: first_name,
#                     last_name: last_name,
#                     email: email,
#                     password: hashedPassword,
#                     role: 'user',
#                     phone: phone,
#                     status: 'active',
#                 });

#                 await user.save()
#                 const token = jwt.sign({
#                     email: user.email, id: user._id, first_name: user.first_name,
#                     last_name: user.last_name, phone: user.phone, role: user.role
#                 }, process.env.jwtSecret);

#                 res.status(200).send({
#                     token, email: user.email, id: user._id, balance: user.balance,
#                     first_name: user.first_name, phone: user.phone, last_name: user.last_name, role: user.role
#                 });

#             })

#     }
#     catch (err) {
#         console.log(err.message, 'sign up error')
#         res.status(400).send({ message: err });
#     };
# };


# //User logn in
# exports.signIn = (req, res) => {

#     const { email, password } = req.body;

#     //simple validation
#     if (!email || !password) {
#         res.status(406).json({ message: "All fields are required" })
#     }

#     User.findOne({ email: email })
#         .then(user => {

#             if (user) {

#                 bcrypt.compare(password, user.password)
#                     .then(isMatch => {
#                         if (isMatch) {
#                             const token = jwt.sign({
#                                 email: user.email, id: user._id, first_name: user.first_name,
#                                 last_name: user.last_name, phone: user.phone, role: user.role
#                             }, process.env.jwtSecret);

#                             res.status(200).send({
#                                 token, email: user.email, id: user._id, balance: user.balance,
#                                 first_name: user.first_name, phone: user.phone, last_name: user.last_name, role: user.role
#                             });

#                         } else {

#                             res.status(408).send({ message: "Password doesn't match" });
#                         }
#                     });
#             } else {
#                 res.status(403).send({ message: "User doesn't exist" });
#             }
#         }).catch(err => {
#             res.json({ message: err });
#         });
# };

# //get list of users. All are async requests
# exports.getAllUsers = async (req, res) => {
#     await User.find({ role: { $in: ['user', 'admin'] } })
#         .then(data => {
#             res.status(200).send({ data });
#         }).catch(err => {
#             res.json({ message: err });
#         });

# }


# exports.updateUser = (req, res) => {
#     const userId = req.params.id;
#     const updatedFields = req.body;
#     User.findByIdAndUpdate(userId, { $set: updatedFields }, { new: true })
#         .then(updatedUser => {
#             if (!updatedUser) {
#                 return res.status(404).json({ message: "User not found" });
#             }
#             res.status(200).json({ message: "User updated successfully", user: updatedUser });
#         })
#         .catch(error => {
#             console.error('Error updating user:', error);
#             res.status(500).json({ message: "Internal server error" });
#         });
# };


# exports.deleteUser = (req, res) => {
#     const userId = req.params.id;

#     User.findByIdAndDelete(userId)
#         .then(deletedUser => {
#             if (!deletedUser) {
#                 return res.status(404).json({ message: "User not found" });
#             }
#             res.status(200).json({ message: "User deleted successfully" });
#         })
#         .catch(error => {
#             console.error('Error deleting user:', error);
#             res.status(500).json({ message: "Internal server error" });
#         });
# };


# exports.OLSPrediction = (req, res) => {
#     const scriptPath = path.join(__dirname, '../python/OLS.py');
    
#     const pythonPath = "C:\\Users\\weldensie\\AppData\\Local\\Microsoft\\WindowsApps\\python.exe"

#     const options = {
#         scriptPath: path.dirname(scriptPath),
#         pythonPath: pythonPath,
#         pythonOptions: ['-u'], 
#         args: [JSON.stringify(req.body.data)],
#     };

#     PythonShell.run('OLS.py', options, (err, results) => {
#         if (err) {
#             console.error('Error executing Python script:', err);
#             res.status(500).json({ error: 'Error executing Python script.' });
#         } else {
#             try {
#                 const result = JSON.parse(results[0]);
#                 res.json(result);
#             } catch (error) {
#                 console.error('Error parsing Python script output:', error);
#                 res.status(500).json({ error: 'Error parsing Python script output.' });
#             }
#         }
#     });
# };


from flask import request, jsonify
from model.model import db, User
import bcrypt
import jwt
import os

def signUp():
    try:
        data = request.get_json()
        first_name = data.get("first_name")
        last_name = data.get("last_name")
        phone = data.get("phone")
        email = data.get("email")
        password = data.get("password")

        # Simple validation
        if not all([first_name, last_name, phone, email, password]):
            return jsonify({"error": "All fields are required"}), 400

        # Check existing user
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"error": "User already exists"}), 400

        # Hash the password
        hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

        # Create a new user
        new_user = User(
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            email=email,
            password=hashed_password,
            role="user",  # Adjust the role as needed
            status="active"  # Adjust the status as needed
        )

        # Save the new user to the database
        db.session.add(new_user)
        db.session.commit()

        # Generate a JWT token for the new user
        token = jwt.encode(
            {"email": new_user.email, "id": new_user.id},
            os.getenv("jwtSecret"),
            algorithm="HS256"
        )

        # Return user data and token
        return jsonify({
            "token": token.decode("utf-8"),
            "email": new_user.email,
            "id": new_user.id,
            "first_name": new_user.first_name,
            "phone": new_user.phone,
            "last_name": new_user.last_name,
            "role": new_user.role
        }), 200

    except Exception as e:
        print(f"Error in signUp: {e}")
        return jsonify({"error": "Internal server error"}), 500


def signIn():
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")

        # Simple validation
        if not all([email, password]):
            return jsonify({"error": "All fields are required"}), 400

        # Find the user by email
        user = User.query.filter_by(email=email).first()

        if user and bcrypt.checkpw(password.encode("utf-8"), user.password):
            # Generate a JWT token for the authenticated user
            token = jwt.encode(
                {"email": user.email, "id": user.id},
                os.getenv("jwtSecret"),
                algorithm="HS256"
            )

            # Return user data and token
            return jsonify({
                "token": token.decode("utf-8"),
                "email": user.email,
                "id": user.id,
                "first_name": user.first_name,
                "phone": user.phone,
                "last_name": user.last_name,
                "role": user.role
            }), 200
        else:
            return jsonify({"error": "Invalid email or password"}), 401

    except Exception as e:
        print(f"Error in signIn: {e}")
        return jsonify({"error": "Internal server error"}), 500


def getAllUsers():
    try:
        users = User.query.filter(User.role.in_(['user', 'admin'])).all()

        # Convert user objects to a list of dictionaries
        user_list = [
            {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone": user.phone,
                "email": user.email,
                "role": user.role,
                "status": user.status
            }
            for user in users
        ]

        return jsonify({"data": user_list}), 200

    except Exception as e:
        print(f"Error in getAllUsers: {e}")
        return jsonify({"error": "Internal server error"}), 500


def updateUser(id):
    try:
        data = request.get_json()

        # Find the user by ID
        user = User.query.get(id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        # Update user fields
        for key, value in data.items():
            setattr(user, key, value)

        # Commit the changes to the database
        db.session.commit()

        return jsonify({
            "message": "User updated successfully",
            "user": {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone": user.phone,
                "email": user.email,
                "role": user.role,
                "status": user.status
            }
        }), 200

    except Exception as e:
        print(f"Error in updateUser: {e}")
        return jsonify({"error": "Internal server error"}), 500


def deleteUser(id):
    try:
        # Find the user by ID
        user = User.query.get(id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        # Delete the user
        db.session.delete(user)
        db.session.commit()

        return jsonify({"message": "User deleted successfully"}), 200

    except Exception as e:
        print(f"Error in deleteUser: {e}")
        return jsonify({"error": "Internal server error"}), 500
