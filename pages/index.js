import { useEffect, useState } from "react";
import { TextInput, NumberInput, MultiSelect, Button, Textarea } from "@mantine/core";
import { io } from "socket.io-client";
export default function Home() {
  
  const [loading, setLoading]=useState(false)
  const [deletingMatrix, setDeletingMatrix] = useState(false)
  const [deletingResults, setDeletingResults] = useState(false)
  const [progress, setProgress] = useState('')
  const [results, setResults] = useState([])
  const [instances, setInstances] = useState([])
  const [instanceName, setInstaceName] = useState("")
  const [cpf, setCpf] = useState("")
  const [matrix, setMatrix] = useState("")
  const [loaded, setLoaded] = useState({})
  const [group, setGroup] = useState("")
  const [isList, setIsList] = useState(false)
  const [matrixList, setList] = useState('')

  const load= async ()=>{
  if(!isList){
  const socket = io('http://149.56.91.175:3001')
  let mt = matrix.replaceAll(' ', '')
  console.log(mt.length)
  console.log(mt)
  const cpfD = cpf.toString()
  if(mt.length == 30 && cpfD.length > 0){
  setLoading(true)
  socket.on('loading', msg => setProgress(msg+'%'))
  await fetch(`api/load?matrix=${mt}&cpf=${cpfD}`)
  setLoading(false)
  setProgress('')
  }else{
    
    window.alert('Confira sua matriz ' + cpfD.length)
  }
  socket.close()
}else{
  console.log(matrixList)
  setLoading(true)
  await fetch('api/uploadlist', {method:"POST", body:JSON.stringify({list:matrixList})})
  setLoading(false)
}



  }

  const work= async ()=>{
    if(instanceName.length > 1){
    await fetch(`api/worker` , {method:"POST", body:JSON.stringify({name:instanceName,groupid:group})})
    await getInstances()
    }else{
      window.alert('Confira os dados e tente novamente')
    }
  }


  async function getResults(){
    const res = await fetch('api/results')
    const json = await res.json()
    setResults(json)
  }

  async function getInstances(){
    const res = await fetch('api/instances')
    const json = await res.json()
    setInstances(json)

  }

  async function deleteInstances(id){
    const res = await fetch(`api/instances?id=${id}`, {method:"DELETE"})
    const json = await res.json()
    setInstances(json)

  }

  async function deleteMatrix(groupid=undefined){
    if(groupid){
      await fetch('api/deleteMatrix?groupid='+groupid)
    }else{
    if(window.confirm("Isso apagará todas as matrizes geradas. Deseja prosseguir?")){
      setDeletingMatrix(true)
      await fetch('api/deleteMatrix')
      setDeletingMatrix(false)
    }

    }
  }

  async function insertList(value){
    setIsList(true)
    setList(value)
  }

  async function formatNumber(val){
    setIsList(false)
    
    if(val.replaceAll(' ','') != ''){
    
    let [a,b,c] = [val.replace(' ','').slice(0, 8), val.replace(' ','').slice(8, 18), val.replace(' ','').slice(18)];
    if(a.length == 8){
      
      a = a + ' '

    }
    if(b.length == 10 && val.replace(' ', '').length){

      b = b + ' '

    }
    if(c.length > 0){
      c = c.replace(' ', '')

    }

    setMatrix(a+b+c)
    }else{
      setMatrix('')
    }
  }

  async function deleteResults(){
    if(window.confirm("Isso apagará todas os resultados. Deseja prosseguir?")){
      setDeletingResults(true)
      await fetch('api/deleteResults')
      setDeletingResults(false)


    }
  }


  async function getLoaded(){
    const res = await fetch('api/loaded')
    const json = await res.json()
    setLoaded(json)
  }

  async function reloadMatrix(groupid){
    await fetch('api/reload?groupid='+groupid)
  }

  useEffect(()=>{

    setInterval(()=>{
      getResults()
      getInstances()
      getLoaded()
    },3000)
    

  },[])


return(
  <>

  
  
<div style={{display:'grid',  gridTemplateColumns:"50% 50%" , gap:"1em"}}>

<div  style={{marginTop:"1em", display:'grid', width:"70%", marginLeft:"20%"}}>


  <TextInput label='Insira a matriz' style={{display:"block"}} value={matrix} onChange={(e)=>formatNumber(e.target.value)} />
  <br/>

  <NumberInput label="Insira o CPF do dono" style={{display:"block",  marginBottom:"5px"}} onChange={(e)=>setCpf(e)}/>

  <br/>


  <Textarea autosize minRows={5} onChange={(e)=>insertList(e.target.value)} label="Insira sua lista"  placeholder="Ex: 033427890180000345999019453523|35281301802"/>

  

  <Button onClick={()=>load()} loading={loading}>Gerar números</Button>
  <br/>
  <Button onClick={()=>deleteMatrix()} loading={deletingMatrix} color='red'>Limpar matrizes</Button>
  <br/>




  <TextInput onChange={(e)=>setInstaceName(e.target.value)} label='Insira o nome da instancia'/>
<MultiSelect  onChange={(e)=>setGroup(e)} label="Selecione as matrizes" data={loaded.length > 0?loaded.map(e=>{return {value:e.groupid, label:e.id}}):[]} />
 
  <Button onClick={()=>work()}>Nova Instancia</Button>
</div>

<div>
  <h4>Matrizes</h4>
  {loaded.length>0?loaded.map((e,i)=> 
  <div key={i} style={{marginTop:"10px"}}><strong>{e.id}</strong> - <strong>{e.groupid}</strong>  ---  <strong style={{color:e.paused == 0?'green':'red'}}>{e.paused == 0?'Ativa':'Pausada'}
  </strong> --- <strong>
    {e.numbers}
    </strong> / <strong>{e.numbers - e.free}
    </strong> 
    <button onClick={()=>deleteMatrix(e.groupid)} style={{marginRight:"5px", marginLeft:"10px"}}>Apagar</button> 
    {e.paused == 0?"":<button onClick={()=>reloadMatrix(e.groupid)}>Reativar</button>} </div>):""}
</div>


</div>





<div style={{width:"90%", marginLeft:"5%", marginTop:"20px"}}>
<span style={{margin:"1em"}}>Resultados: <strong>{results.length}</strong></span>
<Textarea minRows={5} value={results?.map(e=> [e.number.slice(0,8), e.number.slice(8,18), e.number.slice(18)].join(' ') +"  "+ e.status).join('\n')}/>
<Button color={'red'} onClick={()=>deleteResults()} loading={deletingResults}>Limpar resultados</Button>
</div>

<div style={{display:"grid", gridTemplateColumns:"25% 25% 25% 25%", columnGap:"1em" ,margin:"1em"}}>
  {instances?.map((e,i)=> <div key={i} style={{width:"100%", padding:"2em", textAlign:"center", border:"1px solid #000"}}><div><span><strong>{e.name}</strong></span></div><Button onClick={()=>deleteInstances(e.id)}>Deletar</Button></div>)}
</div>


</>
)

}
