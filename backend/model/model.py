# const mongoose = require('mongoose');
# const Schema = mongoose.Schema;

# const userSchema = new Schema({
#     first_name: {type: String, required: true},
#     last_name: {type: String, required: true},
#     phone: {type: String, required: true},
#     email: {type: String, required: true, unique: true},
#     password: {type: String, required: true},
#     role:{type:String, required: true},
#     status:{type:String, required: true },
#     balance: {type: Number, default: 0},
#     currentCall: { 
#     callId: { type: mongoose.Schema.Types.ObjectId, ref: 'Call' },
#     startTime: Date,
#     endTime: Date,
#     receiver: { type: String}},
# }, {timestamps:true});

# const User = mongoose.model('User', userSchema);

# module.exports = { User };



from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(50), nullable=False)

    def __repr__(self):
        return f"<User {self.email}>"

