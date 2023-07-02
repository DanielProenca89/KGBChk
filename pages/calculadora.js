import { useState } from "react";
import { TextInput, NumberInput,Button, Textarea} from "@mantine/core";


export default function CalculatorFront(){

    const [numbers, setNumbers] = useState([]) 
    const [unidade, setUnidade] = useState(0)
    const [dezena, setDezena] = useState(0)
    const [loading, setLoading] = useState(false)

    async function getCalculator(){
        setLoading(true)
        const res = await fetch('api/calc', {method:'POST', body:JSON.stringify({numbers:[dezena,unidade]})})
        const json = await res.json()
        setNumbers(json)
        setLoading(false)
    }



    return (
        <div style={{display:'flex', flexDirection:'column', justifyContent:"center", padding:"5em"}}>
            <NumberInput mb={"sm"} onChange={setDezena} label="Insira sua dezena inicial"/>
            <NumberInput mb={"sm"} onChange={setUnidade} label="Insira sua unidade inicial"/>
            <Button mb={"lg"} loading={loading} onClick={()=>getCalculator()}>Gerar</Button>
       
            <Textarea minRows={10} value={numbers?.map(e=>`${e[0]} -- ${e[1]}`).join('\n')}></Textarea>
        </div>



    )

}