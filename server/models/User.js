const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10
const jwt = require('jsonwebtoken');


const userSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 50
    },
    email: {
        type: String,
        trim: true,
        unique: 1
    },
    password: {
        type: String,
        minlength: 5
    },
    lastname: {
        type: String,
        maxlength: 50
    },
    role: {
        type: Number,
        default: 0
    },
    image: String,
    token: {
        type: String
    },
    tokenExp: {
        type: Number
    }
})

userSchema.pre('save', function (next) {

    const user = this;

    if (user.isModified('password')) {
        //비밀번호를 암호화 시킨다.
        bcrypt.genSalt(saltRounds, function (err, salt) {
            if (err) return next(err)

            bcrypt.hash(user.password, salt, function (err, hash) {
                if (err) return next(err)
                user.password = hash
                next();
            })
        })
    } else {
        next()
    }
});

userSchema.methods.comparePassword = function (plainPassword, cb) {

    console.log(plainPassword);
    //plainPassword 1234567    암호회된 비밀번호 $2b$10$l492vQ0M4s9YUBfwYkkaZOgWHExahjWC
    bcrypt.compare(plainPassword, this.password, function (err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    })
}

userSchema.methods.generateToken = function (cb) {

    var user = this;
    console.log('user._id', user._id)
    //jsonwebtoken을 이용해 token 생성
    var token = jwt.sign(user._id.toHexString(), 'secretToken')
    //user._id + 'secretToken' = token
    // -> 'secretToken' -> user._id
    user.token = token
    user.save(function (err, user) {
        if (err) return cb(err)
        cb(null, user)
    })

}

userSchema.statics.findByToken = function (token, cb) {
    var user = this;

    //token을 decode
    //decode 방법은 jsonwebtoken 에 나와있음
    //token 생성시 user._id + '' = token
    //
    jwt.verify(token, 'secretToken', function (err, decoded) {
        //유저 아이디를 이용해 유저를 찾은 다음
        // 클라이언트에서 가져온 token과 DB에 보관된 토큰이 일치하는지 확인
        user.findOne({ "_id": decoded, "token": token }, function (err, user) {
            if (err) return cb(err);
            cb(null, user)
        })
    })
}



const User = mongoose.model('User', userSchema)

module.exports = { User }