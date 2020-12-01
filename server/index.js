const express = require('express')
// npm install express 
// express 모듈을 가지고 온다
const app = express()
const port = 5000
const bodyParser = require('body-parser');
const config = require('./config/key');
const { auth } = require('./middlware/auth');
const { User } = require("./models/User");
const cookieParser = require('cookie-parser')


// bodyparser 가 client 에서 오는 정보를 서버에서 분석해서 가지고 올수 있게 해주는 건데
//application/x-www-form-urlencoded 이렇게 된 데이터를 분석해서 가지고 온다 
app.use(bodyParser.urlencoded({ extended: true }));

//application/json 이렇게 된 데이터를 분석해서 가지고 온다 
app.use(bodyParser.json());
app.use(cookieParser());

//mongoDB 연결 
const mongoose = require('mongoose')
mongoose.connect(config.mongoURI, {
    useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false
}).then(() => console.log('MongoDB Connected..')).catch(err => console.log(err));

app.get('/', (req, res) => { res.send('Reack!') })

//회원 가입 할떄 필요한 정보들을  client에서 가져오면 
//그것들을  데이터 베이스에 넣어준다. 
app.post('/api/users/register', (req, res) => {

    //req.body 안에는 json 형식으로 회원가입 정보가 담긴다 
    //bodyparser가 있어서 client 정보를 받아줄수 있다
    //user.js 에 인스턴스
    // req.body 안에는 json 형식으로 클라이언트가 보내는 정보를 받는다 
    const user = new User(req.body)
    //user.save mongodb 메서드
    user.save((err, userInfo) => {
        if (err) return res.json({ success: false, err })
        return res.status(200).json({
            success: true
        })
    })
});

app.post('/api/users/login', (req, res) => {

    //요청된 이메일을 데이터베이스에서 있는지 찾는다.
    User.findOne({ email: req.body.email }, (err, user) => {
        if (!user) {
            return res.json({
                loginSuccess: false,
                message: "제공된 이메일에 해당하는 유저가 없습니다."
            })
        }
        //요청된 이메일이 DB에 있으면 비밀번호가 맞는 비밀번호이 인지 확인
        //req.body.password : 로그인시 입력한 패스워드
        user.comparePassword(req.body.password, (err, isMatch) => {
            if (!isMatch)
                return res.json({ loginSuccess: false, message: "비밀번호가 틀렸습니다." })
            //비밀번호 맞으면 토큰 생성     
            user.generateToken((err, user) => { //user 에는 token이 담긴다
                if (err) return res.status(400).send(err);
                // 토큰을 저장한다. 어디에? 쿠키, 로컬스토리지 등등에 가능 하지만 지금은 쿠키에
                res.cookie("x_auth", user.token).status(200).json({ loginSuccess: true, userId: user._id })
            })
        })
    })
})

app.get('/api/users/auth', auth, (req, res) => {

    // 여기까지 미들웨어를 통과해 왔다는 것은 Authentication이 true라는 의미
    req.status(200).json({
        //auth에서 req에 id를 담아뒀기 때문에 사용가능
        _id: req.user._id,
        isAdmin: req.user.role === 0 ? false : true,
        isAuth: true,
        email: req.user.name,
        lastName: req.user.lastName,
        role: req.user.role,
        image: req.user.image
    });
})

app.get('/api/users/logout', auth, (req, res) => {
    User.findOneAndUpdate({ _id: req.user._id },
        { token: "" }
        , (err, user) => {
            if (err) return res.json({ success: false, err });
            return res.status(200).send({
                success: true
            })
        })
})

app.listen(port, () => { console.log(`Example app listening at http://localhost:${port}`) })