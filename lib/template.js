var db = require('./db');

exports.selectById = function(column,id){
    return new Promise(function(resolve, reject) {
        db.query("SELECT "+column+",DATE_FORMAT(play_dt,'%Y%m%d') AS 'formated_date' FROM Users WHERE user_id ='"+ id+"'", function(err, rows, fields) {
        if (!err){
            console.log('select complete: ', rows);
            resolve(rows[0])
        }
        else
            console.log('Error while performing Query.', err);
        })
    })
}
exports.select = function(column,value){
    return new Promise(async function(resolve, reject) {
        db.query("SELECT "+column+",play_dt FROM Users WHERE DATE(play_dt)='"+ value+"'", function(err, rows, fields) {
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
    db.query("SELECT * FROM Users", function(err, rows, fields) {
    if (!err){
        console.log('select complete: ', rows);
    }
    else
        console.log('Error while performing Query.', err);
    });
}
exports.insertById = function(id){
    return new Promise(function(resolve, reject) {
        db.query("INSERT INTO Users (user_id) VALUES ('"+id+"')", function(err, rows, fields) {
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
        db.query("UPDATE Users SET "+ value +" WHERE user_id ='"+ id+"'", function(err, rows, fields) {
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
    db.query("DELETE FROM Users WHERE user_id='"+id+"'", function(err, rows, fields) {
    if (!err){
        console.log('delete complete: ', rows);
    }
    else
        console.log('Error while performing Query.', err);
    });
}
exports.deleteAll = function(id){
    db.query("DELETE FROM Users", function(err, rows, fields) {
    if (!err){
        console.log('delete complete: ', rows);
    }
    else
        console.log('Error while performing Query.', err);
    });
}