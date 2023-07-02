import calculator from './controllers/calculadora'


export default function handler(req, res){

    const {numbers} = JSON.parse(req.body)
    const nums = calculator(numbers)
    res.send(nums)

}