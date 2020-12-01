const { User } = require('../models/User');


let auth = (req, res, next) => {

    // 인증처리 하는곳

    // 클라이언트 쿠키에서 토큰을 가져온다 
    let token = req.cookies.x_auth;
    // 토큰을 복호화 한후 유저를 찾는다
    User.findByToken(token, (err, user) => {
        if (err) throw err;
        if (!user) return res.json({ isAuth: false, error: true })

        //index.js 에서
        // req를 받을때 rqe담아서 user와 token을 사용할수 있도록 
        req.token = token;
        req.user = user;
        // middleware 에서 다음으로 진행될수 있게 next()
        next();

    })
    // 유저가 있으면 인증 ok 

    // 유저가 없으면 인증 no
}

module.exports = { auth };