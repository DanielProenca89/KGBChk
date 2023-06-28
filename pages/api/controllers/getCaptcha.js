import { ImageToTextTask } from "node-capmonster";
import path from 'path'
import fs from 'fs'
import {Solver} from '2captcha'

function base64_encode(file) {
    return fs.readFileSync(file, 'base64');
}

/*const getCaptcha= async (math=false)=>{
    
    const client  = new ImageToTextTask('02c518698cd43bdd2ed002a65ede0305')
    //const imagePath = path.resolve( "images", "captcha.png")
    const convertedImage = base64_encode('./public/captcha2.png')

    const task = client.task({
        body: convertedImage,
        recognizingThreshold: 80,
        math
    })

    const taskId = await client.createWithTask(task)
    const result = await client.getTaskResult(taskId)
    console.log(result)
    return result
}*/

const getCaptcha = async (math, img)=>{

const apiKey = '9357f496505f8587ff2183f4f96d1157';
try{
const filePath = './public/captcha/'+img;
const filePathAux = './public/captcha/'+img.replace('ok_','');
const solver = new Solver(apiKey)
const res = await solver.imageCaptcha(fs.readFileSync(filePathAux, "base64"))
fs.unlink(filePath,(err)=>{
    if(err) console.log(err);
})
fs.unlink(filePathAux, (err)=>{
    if(err) console.log(err);
})
return res


}catch(e){
    console.log(e)
    return {data:"erro"}
}
}
export default getCaptcha;