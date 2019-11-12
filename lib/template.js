var db = require('./db');

exports.selectById = function(column,id){
    return new Promise(function(resolve, reject) {
        db.query("SELECT "+column+",DATE_FORMAT(play_dt,'%Y%m%d') AS 'formated_date' FROM users WHERE user_id ='"+ id+"' for update; update users SET count=count+1 where user_id='"+ id+"'", function(err, rows, fields) {
        if (!err){
            console.log('select complete: ', rows);
            resolve(rows[0][0])
        }
        else
            console.log('Error while performing Query.', err);
        })
    })
}
exports.select = function(column,value){
    return new Promise(async function(resolve, reject) {
        db.query("SELECT "+column+",play_dt FROM users WHERE DATE(play_dt)='"+ value+"'", function(err, rows, fields) {
        if (!err){
            console.log('select complete: ', rows);
            resolve(rows)
        }
        else
            console.log('Error while performing Query.', err);
        })
    })
}
exports.selectAll = function(){
    db.query("SELECT * FROM users", function(err, rows, fields) {
    if (!err){
        console.log('select complete: ', rows);
    }
    else
        console.log('Error while performing Query.', err);
    });
}
exports.insertById = function(user){
    return new Promise(function(resolve, reject) {
        const data = [user.id, user.name,user.email,user.locale]
        const sql = 'insert into users (user_id,name,email,locale) values (?,?,?,?)'
        db.query(sql,data, function(err, rows, fields) {
        if (!err){
            console.log('insert complete: ', rows);
            resolve(rows[0])
        }
        else
            console.log('Error while performing Query.', err);
        });
    })
}
exports.update = function(value, id){
    return new Promise(function(resolve, reject) {
        db.query("UPDATE users SET "+ value +" WHERE user_id ='"+ id+"'", function(err, rows, fields) {
        if (!err){
            console.log('update complete: ', rows);
            resolve(rows[0])
        }
        else
            console.log('Error while performing Query.', err);
        });
    })
}
exports.delete = function(id){
    db.query("DELETE FROM users WHERE user_id='"+id+"'", function(err, rows, fields) {
    if (!err){
        console.log('delete complete: ', rows);
    }
    else
        console.log('Error while performing Query.', err);
    });
}
exports.deleteAll = function(id){
    db.query("DELETE FROM users", function(err, rows, fields) {
    if (!err){
        console.log('delete complete: ', rows);
    }
    else
        console.log('Error while performing Query.', err);
    });
}