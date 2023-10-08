const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    first_name: {type: String, required: true},
    last_name: {type: String, required: true},
    phone: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    role:{type:String, required: true},
    status:{type:String, required: true },
    balance: {type: Number, default: 0},
    currentCall: { 
    callId: { type: mongoose.Schema.Types.ObjectId, ref: 'Call' },
    startTime: Date,
    endTime: Date,
    receiver: { type: String}},
}, {timestamps:true});


const callSchema = new Schema({
  caller: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  callDuration: {type: Number, required: true},
  callCost: {type: Number, required: true},
  status: { type: String, enum: ['connected', 'disconnected'], default: 'connected',
  },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Call = mongoose.model('Call', callSchema);

module.exports = { User, Call };

