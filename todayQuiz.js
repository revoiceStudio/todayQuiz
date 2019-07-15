require('dotenv').config({path:'credentials.env'})
require('json-dotenv')('.config.json')
require('./lib/db');
const logger = require('./log')
const db = require('./lib/template');
const express = require('express')
const router = require('./router')
const request = require('request')
const XLSX = require('xlsx')
const moment = require('moment')
const schedule = require('node-schedule')
require('moment-timezone')
moment.tz.setDefault("Asia/Seoul");
const app = express()
app.use(express.json())


// # 메인 파일
// * 퀴즈를 가져온다.
function getQuiz(){
    const moment_today = moment().format('YYYY-MM-DD')
    const today = moment_today.split('-')
    
    logger.log("스케줄러 실행:"+ moment().format('YYYY-MM-DD HH:mm:ss'))
    
    const year = today[0]
    const month = today[1]
    // today quiz
    const today_sheets = XLSX.readFile('./rsc/today/'+year+month+'_revoicequizlist.xlsx',{dateNF:'yyyy-mm-dd',cellDates:true,encoding:'utf8'})
    const today_sheet1 = XLSX.utils.sheet_to_row_object_array(today_sheets.Sheets['Sheet1'],{raw: false})
   
    // ad quiz
    const ad_sheets = XLSX.readFile('./rsc/ad/'+year+month+'_ad_revoicequizlist.xlsx',{dateNF:'yyyy-mm-dd',cellDates:true,encoding:'utf8'})
    const ad_sheet1 = XLSX.utils.sheet_to_row_object_array(ad_sheets.Sheets['Sheet1'],{raw: false})
    
    global.todayQuiz = null
    global.adQuiz = null
    
    /* Find desired cell */
    for(var i=0; i<today_sheet1.length; i++){
        if(today_sheet1[i].DATE == moment_today){            
            todayQuiz = today_sheet1[i]
            break
        }
    }
    /* Find desired cell */
    for(var i=0; i<ad_sheet1.length; i++){
        if(ad_sheet1[i].DATE == moment_today){            
            adQuiz = ad_sheet1[i]
            break
        }
    }   
    logger.log(todayQuiz);
    logger.log(adQuiz); 
    
}
function getCorrectAnswerPercentage(column){
    return new Promise(async function(resolve, reject) {
        const today = moment().format('YYYY-MM-DD')
        const todayAnswer = await db.select(column,today)
        let T_correct = 0
        global.percentage = 0
        for(var i=0; i<todayAnswer.length; i++){
            if(todayQuiz["CORRECT"]==todayAnswer[i]["today_answer"]){
                T_correct++
            }
        }       
        if(todayAnswer.length>0){
            percentage = Math.round((T_correct / todayAnswer.length) * 100)
        }
        logger.log("todayAnswer percentage : "+ percentage + "%")
        resolve(percentage)
    })
}
const scheduler=schedule.scheduleJob('05 00 * * *', function(){
    getQuiz()
})
const scheduler2=schedule.scheduleJob('*/5 * * *', function(){
    getCorrectAnswerPercentage('today_answer')
})    

// test
getQuiz()
getCorrectAnswerPercentage('today_answer')

// * OAuth 요청을 보낸다.
function requestOAuth(res,options){
    return new Promise(function(resolve, reject) {
        request(options, (error, response, body) =>{
            if (error) throw error
            logger.log("OAuth 인증 완료.")
            res["Oauth"] = JSON.parse(body)
            logger.log(res["Oauth"].id)            
            resolve(res)
        })
    })
}

app.use('/revoice', async function(req, res, next){
    
    const jsonObj = req.body
    logger.log(jsonObj)
    logger.log('OAuth 토큰 확인...')
    if(typeof jsonObj.context !== "undefined" ){      
        if(typeof jsonObj.context.session["accessToken"] === 'undefined'){
            logger.log("OAuth 연동 안됨.")
            res["accessToken"] = 'undefined'
        }
        else{
            const accessToken = jsonObj.context.session["accessToken"]
            const options = {
                'url' : process.env.googleAPI + accessToken
            }
            res = await requestOAuth(res,options)
        }
    }
    next()
})

app.use('/revoice',router)

app.listen(process.env.port, () => {
    logger.log('todayQuiz app listening on port '+ process.env.port)
})
