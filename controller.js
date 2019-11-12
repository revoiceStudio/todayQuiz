const db = require('./lib/template');
const moment = require('moment')
const XLSX = require('xlsx')
const logger = require('./log')

exports.openQuiz = async function (req,res){
    const responseObj = JSON.parse(process.env.response)
    const directives = responseObj.directives[0]
    const today = Number(moment().format('YYYYMMDD'))
    let QUIZ = {}
    let open_ment = {}
    // Oauth is linked
    if(res["accessToken"] != 'undefined'){        
        let play_dt = today
        let T = 0
        let B = 0
        let A = 0

        const user = await db.selectById("user_id,today_state,bonus_state,ad_state,bonus_no",res["Oauth"].id)
        if(typeof user==='undefined'){ await db.insertById(res["Oauth"]) }
        else{            
            play_dt = Number(user["formated_date"])
            T = user["today_state"]
            B = user["bonus_state"]
            A = user["ad_state"]
        }       
        // first entry
        if(today > play_dt){
            // all state initialize
            await db.update('today_state=0,bonus_state=0,ad_state=0,today_answer=0,bonus_answer=0,ad_answer=0', res["Oauth"].id)
            play_dt = today
            T = 0
            B = 0
            A = 0       
            logger.log("first entry : T,B,A ="+T+B+A)     
        }
        // state :today
        if(T==0 && B==0 && A==0){
            QUIZ = global.todayQuiz            
            directives.audioItem.stream["url"] = process.env.todaySound + today.toString().substring(0,6)+'_todaySound/'+QUIZ["SOUND"]+'.mp3'
            db.update('today_state=1, answer_state=1', res["Oauth"].id)
        }
        // state :bonus //보너스사운드 날짜제거
        else if(T==2 && B==0 && A==0){            
            QUIZ = await getBonusQuiz(user["bonus_no"])
            logger.log(QUIZ)
            directives.audioItem.stream["url"] = process.env.bonusSound +'bonusSound/'+QUIZ["SOUND"]+'.mp3'
            db.update('bonus_state=1, answer_state=1, bonus_no='+(user["bonus_no"]+1), res["Oauth"].id)
        }
        else if( (T==1 && B==0 && A==0)||(T==2 && B==1 && A==0)||(T==2 && B==2 && A==0) ){
            // state : ad
            if(global.adQuiz){
                if(global.adQuiz["DATE"]==moment().format('YYYY-MM-DD')){
                    QUIZ = global.adQuiz            
                    directives.audioItem.stream["url"] = process.env.adSound + today.toString().substring(0,6)+'_adSound/'+QUIZ["SOUND"]+'.mp3'
                    logger.log("ad 시작")
                    db.update('ad_state=1,answer_state=1', res["Oauth"].id)
                }
            }
            // state : end
            else{
                QUIZ = global.todayQuiz                
                open_ment = { "nugu_openment": "오늘의 퀴즈를 이미 완료하셨어요! 오늘의 퀴즈는" +QUIZ["QUESTION"] + "였고,"+
                                "정답은 "+ QUIZ["CHOICE"+QUIZ['CORRECT']] +" 이였어요!"+ QUIZ["COMMENTARY"]+". 내일까지 퀴즈를 다시 준비해 놓을게요! 오늘의 퀴즈를 종료합니다." }
                responseObj["output"] = open_ment
                logger.log("response-openQuiz"+responseObj["output"])
                return res.json(responseObj)
            }
        }
        // state :end 
        else{          
            QUIZ = global.todayQuiz                
            open_ment = { "nugu_openment": "오늘의 퀴즈를 이미 완료하셨어요! 오늘의 퀴즈는" +QUIZ["QUESTION"] + "였고,"+
                            "정답은 "+ QUIZ["CHOICE"+QUIZ['CORRECT']] +" 이였어요!"+ QUIZ["COMMENTARY"]+". 내일까지 퀴즈를 다시 준비해 놓을게요! 오늘의 퀴즈를 종료합니다." }
            responseObj["output"] = open_ment
            logger.log("response-openQuiz"+responseObj["output"])
            return res.json(responseObj)
        }
    }else{
        QUIZ = global.todayQuiz
        directives.audioItem.stream["url"] = process.env.todaySound + today.toString().substring(0,6)+'_todaySound/'+QUIZ["SOUND"]+'.mp3'
    }
    if(typeof QUIZ["SOUND_COMMENT"]==="undefined"){ QUIZ["SOUND_COMMENT"]="" }
    open_ment = { "nugu_openment": QUIZ["OPENMENT"] +", "+QUIZ["POINT"]+"포인트의 퀴즈에요. "+QUIZ["SOUND_COMMENT"]}
    directives.audioItem.stream["token"] = "quiz_sound"
    responseObj.directives[0] = directives
    responseObj["output"] = open_ment
    logger.log("response-openQuiz"+responseObj["output"])
    return res.json(responseObj)
}
exports.answerQuiz = async function(req,res){
    let QUIZ = {}
    const param = req.body.action.parameters["userAnswer"]
    const responseObj = JSON.parse(process.env.response)
    const directives = responseObj.directives[0]
    let percentage = ""
    const answer_ment = {}
    //계정 연동이 안된 경우
    if(res["accessToken"] == 'undefined'){
        responseObj["directives"] = []
        responseObj["resultCode"] = process.env.OAuth
        return res.json(responseObj)
    }
    else{
        let correct;
        const user = await db.selectById("today_state, bonus_state, ad_state, user_point, bonus_no, answer_state",res["Oauth"].id)
        if(user["answer_state"]==0){
            answer_ment["nugu_answerment"] = "문제를 듣고 정답을 말해주세요~"
        }else{
            if(user["bonus_state"]==1 && user["ad_state"]==0){
                QUIZ = await getBonusQuiz(user["bonus_no"]-1)
            }
            else if(user["ad_state"]==1){
                QUIZ = global.adQuiz 
            }
            else{ 
                QUIZ = global.todayQuiz 
            }
                
            if(typeof param!=='undefined'){
                logger.log('user answer is '+ param.value)
                if(param.value == QUIZ['CORRECT']){
                    correct = "정답입니다." 
                    if(user["today_state"]==1 && user["ad_state"]==0){
                        let answerPercentage = await getCorrectAnswerPercentage('today_answer')
                        percentage = answerPercentage +"퍼센트의 사람들이 정답을 맞췄습니다."
                        console.log("퍼센트지 이따구로 옴 !!!!!!!!!!!!!!! ")
                        console.log(percentage)
                        directives.audioItem.stream["token"] = "bonusevent_sound"
                        directives.audioItem.stream["url"] = process.env.bonusEventSound
                        db.update('today_answer='+ param.value +',answer_state=0,today_state=2,user_point='+( user["user_point"] + Number(QUIZ["POINT"]) ),res["Oauth"].id)
                    }
                    else if(user["bonus_state"]==1 && user["ad_state"]==0){

                        directives.audioItem.stream["token"] = "finish_sound"
                        directives.audioItem.stream["url"] = process.env.finishEventSound

                        // ad quiz is exist
                        if(global.adQuiz){
                            if(global.adQuiz["DATE"]==moment().format('YYYY-MM-DD') && user["ad_state"]==0 ){
                                directives.audioItem.stream["token"] = "adevent_sound"
                                directives.audioItem.stream["url"] = process.env.adEventSound
                            }
                        }
                        db.update('bonus_answer='+ param.value +',answer_state=0,bonus_state=2,user_point='+( user["user_point"] + Number(QUIZ["POINT"]) ),res["Oauth"].id)
                    }
                    else if(user["ad_state"]==1){
                        directives.audioItem.stream["token"] = "finish_sound"
                        directives.audioItem.stream["url"] = process.env.finishEventSound
                        db.update('ad_answer='+ param.value +',answer_state=0,ad_state=2,user_point='+( user["user_point"] + Number(QUIZ["POINT"]) ),res["Oauth"].id)
                    }
                }else{
                   
                    directives.audioItem.stream["token"] = "finish_sound"
                    directives.audioItem.stream["url"] = process.env.finishEventSound

                    // ad quiz is exist
                    if(global.adQuiz){
                        if(global.adQuiz["DATE"]==moment().format('YYYY-MM-DD') && user["ad_state"]==0 ){
                            directives.audioItem.stream["token"] = "adevent_sound"
                            directives.audioItem.stream["url"] = process.env.adEventSound
                        }
                    }

                    if(user["today_state"]==1 && user["ad_state"]==0){
                        let answerPercentage = await getCorrectAnswerPercentage('today_answer')
                        percentage = answerPercentage +"퍼센트의 사람들이 정답을 맞췄습니다."
                        db.update('today_answer='+ param.value +',answer_state=0',res["Oauth"].id)
                    }
                    else if(user["bonus_state"]==1 && user["ad_state"]==0){
                        db.update('bonus_answer='+ param.value +',answer_state=0',res["Oauth"].id)
                    }
                    else if(user["ad_state"]==1){
                        db.update('ad_answer='+ param.value +',answer_state=0',res["Oauth"].id)
                    }
                    correct = "이런 틀렸어요. 정답은 " + QUIZ['CORRECT'] + "번, " + QUIZ["CHOICE"+QUIZ['CORRECT']] + " 입니다."
                    
                }                
                
            }else{
                logger.log('answerQuiz parameters are undefined')
            }
            
            answer_ment["nugu_answerment"] = correct + QUIZ["COMMENTARY"] + " " + percentage
        }
    }
    responseObj.directives[0] = directives
    responseObj["output"] = answer_ment
    console.log(responseObj['output'])
    logger.log("response-answerQuiz"+responseObj["output"])
    return res.json(responseObj)
}
exports.quizSound = async function(req,res){
    let QUIZ = {}
    const responseObj = JSON.parse(process.env.response)
    const select_ment = {}
    // 계정 연동 되어 있는 경우
    if(res["accessToken"] != 'undefined'){
        const user = await db.selectById("bonus_state, bonus_no, ad_state",res["Oauth"].id)
        if(user["bonus_state"]==1 && user["ad_state"]==0){
            QUIZ = await getBonusQuiz(user["bonus_no"]-1)
        }
        else if(user["ad_state"]==1){
            QUIZ = global.adQuiz
        }
        else{ QUIZ = global.todayQuiz }
    }else{
        QUIZ = global.todayQuiz
    }
    responseObj["directives"] = []
    select_ment["nugu_todayquiz"] = QUIZ["QUESTION"] + " 1번, " + QUIZ["CHOICE1"] +  ". 2번, " + QUIZ["CHOICE2"] +  ". 3번, " + QUIZ["CHOICE3"] +  ". 4번, " +QUIZ["CHOICE4"] + "."  
    responseObj["output"] = select_ment
    logger.log("response-quizSound"+responseObj["output"])
    return res.json(responseObj)
}

exports.bonuseventSound = function(req,res){
    const responseObj = JSON.parse(process.env.response)
    const bonusevent_ment = {}
    
    responseObj["directives"] = []
    bonusevent_ment["bonusevent_ment"] =  "축하드려요. 보너스 퀴즈를 푸실 수 있어요. 퀴즈를 들으시려면 퀴즈시작이라고 말씀해주세요" 
    responseObj["output"] = bonusevent_ment
    logger.log("response-bonuseventSound"+responseObj["output"])
    return res.json(responseObj)
}

exports.adeventSound = function(req,res){
    const responseObj = JSON.parse(process.env.response)
    const adevent_ment = {}
    
    responseObj["directives"] = []
    adevent_ment["adevent_ment"] =  "오늘은 특별한 퀴즈가 하나 더 준비되어있어요. 퀴즈를 들으시려면 퀴즈시작이라고 말씀해주세요!" 
    responseObj["output"] = adevent_ment
    logger.log("response-adeventSound"+responseObj["output"])
    return res.json(responseObj)
}

exports.finishSound = function(req,res){
    const responseObj = JSON.parse(process.env.response)
    const finished_ment = {}
    
    //responseObj["directives"] = []
    finished_ment["finished_ment"] =  "오늘 푸실수 있는 모든 퀴즈를 푸셨어요! 내일까지 다시 퀴즈를 준비해놓을게요. 오늘의 퀴즈를 종료할게요." 
    responseObj["output"] = finished_ment
    logger.log("response-finishSound"+responseObj["output"])
    return res.json(responseObj)
}
exports.default_finished  = function(req, res){
    logger.log("request default_finished")
    return res.json({"status":"OK"})
}
exports.health = function(req, res){
    logger.log("request health")
    return res.json({"status":"OK"})
}
exports.askPoint = async function(req, res){
    const responseObj = JSON.parse(process.env.response)
    const result = await db.selectById("user_point",res["Oauth"].id)
    responseObj['output'] = {"point": "당신의 포인트는 "+result.user_point + "점 입니다."}
    return res.json(responseObj)
}

function getBonusQuiz(bonus_no){
    return new Promise(function(resolve, reject) {
        // bonus quiz   
        const bonus_sheets = XLSX.readFile('./rsc/bonus/bonus_revoicequizlist.xlsx',{cellDates:true,encoding:'utf8'})
        const bonus_sheet1 = XLSX.utils.sheet_to_row_object_array(bonus_sheets.Sheets['Sheet1'],{raw: false})
        let bonusQuiz = {}
        //QUIZ = XLSX.utils.sheet_to_json(sheets.Sheets['Sheet1'])[user["bonus_no"]]
        /* Find desired cell */
        for(var i=0; i<bonus_sheet1.length; i++){
            if(bonus_sheet1[i].NUMBER == bonus_no){            
                bonusQuiz = bonus_sheet1[i]
                break
            }
        }
       resolve(bonusQuiz)
    })
}

function getCorrectAnswerPercentage(column){
    return new Promise(async function(resolve, reject) {
        const today = moment().format('YYYY-MM-DD')
        const todayAnswer = await db.select(column,today)
        let T_correct = 0
        let percentage = 0
        for(var i=0; i<todayAnswer.length; i++){
            if(todayQuiz["CORRECT"]==todayAnswer[i]["today_answer"]){
                T_correct++
            }
        }       
        if(todayAnswer.length>0){
            console.log("오늘 플레이 수 : "+todayAnswer.length)
            console.log("정답 수 " + T_correct)
            percentage = Math.round((T_correct / todayAnswer.length) * 100)
        }
        logger.log("todayAnswer percentage : "+ percentage + "%")
        resolve(percentage)
    })
}