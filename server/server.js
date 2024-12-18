const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());

require('dotenv').config();

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const jwt = require('jsonwebtoken');
const {expressjwt} = require('express-jwt')
const secretKey = process.env.SECRET_KEY;
const jwtMW = expressjwt({
    secret: secretKey,
    algorithms: ['HS256'],
});

const mysql = require('mysql');
let connection;
function handleDisconnect() {
    connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    connection.connect((err) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            setTimeout(handleDisconnect, 2000);
        } else {
            console.log('Successfully connected to the database.');
        }
    });

    connection.on('error', (err) => {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed. Reconnecting...');
            handleDisconnect();
        } else {
            console.error('Database error:', err);
            throw err;
        }
    });
}

handleDisconnect();

let users = [
    {
        id: 1,
        username: 'smit',
        password: 'smit'
    }
];

app.post('/api/login', (req, res) => {
    const {username, password} = req.body;

    let user = users.find((usr) => {
        return (usr.username == username
             && usr.password == password);
    });

    if (user) {
        res.json({
           token: jwt.sign({id: user.id, username: user.username},
            secretKey, {expiresIn: '1h'}),
           err: null
        });
        return;
    } else {
        res.status(401).json({
            token: null,
            err: 'Username or Password Incorrect'
        });
    }
});

app.get('/api/validate', jwtMW, (req, res) => {
    res.json({
        content: "Token valid"
    });
    return;
});

app.get('/api/energyUse', jwtMW, (req, res) => {
    connection.query('SELECT * FROM EnergyUse', function (error, results, fields) {
        if (error) throw error;
        res.json(results);
    });
});

app.get('/api/energySources', jwtMW, (req, res) => {
    connection.query('SELECT * FROM EnergySource23', function (error, results, fields) {
        if (error) throw error;
        res.json(results);
    });
});

app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        res.status(401).json({
            error: "Invalid token"
        });
    } else {
        res.status(401).json({
            error: err
        });
    };
});

app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
});