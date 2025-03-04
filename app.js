const express = require('express');
const app = express();
const userModel = require('./models/user')
const taskModel = require('./models/task')
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());    

app.get('/', function(req, res) {
    res.render('home');
})

app.get('/signup', function(req, res) {
    res.render('signup');
})

app.get('/login', function(req, res) {
    res.render('signin');
})

app.get('/dashboard', isLoggedIn, async function(req, res) { 
    let user = await userModel.findOne({username: req.user.username});
    let tasks_ids = user.tasks;
    let tasks = [];
    for(i=0; i<tasks_ids.length; i++) {
        tasks.push(await taskModel.findOne({_id: tasks_ids[i]}));
    }
    res.render('dashboard', {tasks});
    
});

app.get('/create-task', isLoggedIn, async function(req, res) {
    res.render('create-task');
});

app.get('/update-task/:task_id', isLoggedIn, async function(req, res) {
    let task = await taskModel.findOne({_id: req.params.task_id});
    res.render('update-task', {task});
});

app.post('/register', async function(req, res) {
    let {name, username, password} = req.body;

    let prevuser = await userModel.findOne({username}); // checking for user with same username
    if(prevuser) {
        return res.redirect('/signup');
    }

    bcrypt.genSalt(10, function(err, salt) {
        if (err) {
            return res.status(500).send('Error generating salt');
        }
        bcrypt.hash(password, salt, async function(err, hash) {
            if (err) {
                return res.status(500).send('Error hashing password');
            }
            let user = await userModel.create({
                username,
                name,
                password: hash
            });
            let token = jwt.sign({username: username}, 'secretkey');
            res.cookie('token', token);
            res.redirect('/dashboard');
        });
    });
});

app.post('/login', async function(req, res) {

    let {username, password} = req.body;

    let user = await userModel.findOne({username}); // checking for user with same username
    if(!user) {
        return res.redirect('/login');
    }

    bcrypt.compare(password, user.password, function(err, result) {
        if(result) {
            let token = jwt.sign({username: username}, 'secretkey');
            res.cookie('token', token);
            res.redirect('/dashboard');
        }
        else {
            console.log('problem');
            res.redirect('/login');
        }
    }) 
});

app.post('/logout', function(req, res) {
    res.clearCookie('token');
    res.redirect('/');
});

app.post('/create-task', isLoggedIn, async function(req, res) {
    let {name, content, dueDate} = req.body;

    let user = await userModel.findOne({username: req.user.username});

    let task = await taskModel.create({
        user: user,
        taskname: name,
        content,
        madeon: new Date(),
        dueby: dueDate
    });

    var tasks = user.tasks; var b = true;
    for(i=0; i<tasks.length; i++) {
        let taski = await taskModel.findOne({_id: tasks[i]});
        if(taski.dueby> task.dueby) {
            tasks.splice(i, 0, task);
            b = false;
            break;
        }   
    }

    if(b) {
        tasks.push(task);
    }
    console.log(tasks);
        tasks = await userModel.findOneAndUpdate({username: req.user.username}, {tasks});

    res.redirect('/dashboard');

});

app.post('/update-task/:task_id', isLoggedIn, async function(req, res) {
    let {name, content, dueDate} = req.body;
    let task_id = req.params.task_id;

    let task = await taskModel.findOneAndUpdate({_id: task_id}, {taskname: name, content, dueby: dueDate});
    let user = await userModel.findOne({username: req.user.username});
    var tasks = user.tasks;

    for(i=0; i<tasks.length; i++) {
        if(tasks[i]==task_id) {
            tasks.splice(i, 1);
            break;
        }
    }

    var b = true;
    for(i=0; i<tasks.length; i++) {
        let taski = await taskModel.findOne({_id: tasks[i]});
        if(taski.dueby> task.dueby) {
            tasks.splice(i, 0, task);
            b = false;
            break;
        }   
    }

    if(b) {
        tasks.push(task);
    }


    tasks = await userModel.findOneAndUpdate({username: req.user.username}, {tasks});

    res.redirect('/dashboard');


});

app.post('/delete-task/:task_id', isLoggedIn, async function(req, res) {
    let task_id = req.params.task_id;

    await taskModel.findOneAndDelete({_id: task_id});

    let user = await userModel.findOne({username: req.user.username});
    tasks = user.tasks;

    for(i=0; i<tasks.length; i++) {
        if(tasks[i]==task_id) {
            tasks.splice(i, 1);
            break;
        }
    }

    tasks = await userModel.findOneAndUpdate({username: req.user.username}, {tasks});
    
    res.redirect('/dashboard');

    
});


function isLoggedIn(req, res, next) {
    let token = req.cookies.token;
    if(!token) {
        return res.redirect('/login');
    }
    jwt.verify(token, 'secretkey', function(err, decoded) {
        if(err) {
            res.cookies.token = '';
            return res.redirect('/login');
        }
        req.user = decoded;
        next();
    });
}

app.listen(3000);