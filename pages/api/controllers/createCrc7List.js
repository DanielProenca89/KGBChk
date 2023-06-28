import {connection} from '../models/connection'
import preload from '../models/preload'
import {QueryTypes, where} from 'sequelize'
//import { Server } from "socket.io";



function _getRandom(){
var array = [];

for (var i = 0; i < 10; i++) {
  for (var j = 0; j < 100; j++) {
      array.push([i, j]);
  }
}
return array;

}

const createNumberFromList = async (matrix=[], cpf)=>{
  await connection.sync() 
  // const io = new Server();
   /* io.emit('loading', false)
    io.listen(3001, {cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }})*/
      let listId;
    try{
    const lastId = await connection.query('SELECT distinct(listId) as listId from Preloads  ORDER BY createdAt desc limit 1', {type:QueryTypes.SELECT})

    if(lastId.length == 0){ 
      listId = 1

    }else{
      listId =  parseInt(lastId[0].listId) > 0?lastId[0].listId + 1:1
    }
  }catch{
      return
  }
    let [cm1, cm2, cm3] = matrix

    cm1 = cm1.split('')
    cm2 = cm2.split('') 
    cm3 = cm3.split('')
    
    const numbers = _getRandom()

    await connection.sync()
    const payload = numbers.map(element => {
        
        let [b,c] = element
        
        cm3[1] = c.toString()[1]?c.toString()[0]:'0'
        cm3[2] = c.toString()[1]?c.toString()[1]:c.toString()[0]
        cm3[11] = b.toString()
        const cmc7 =  [cm1.join(''),cm2.join(''),cm3.join('')].join('')

         return   {
            number:cmc7,
            free:true,
            cpf:cpf,
            groupid:matrix.join(''),
            listId:listId
            }

    })

        console.log(payload)
        await preload.bulkCreate(payload)
        
        await connection.sync()
        const result = await preload.findAll()
        //io.close()
        return result.map(e=>e.dataValues)
        

}

export default createNumberFromList;