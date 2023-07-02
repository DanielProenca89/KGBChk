



export default function calculator(range){
    let array = []
    let ref = parseInt(range[1])
    for (var i = parseInt(range[0]) + 1; i < 100; i++) {
        
       

        if(i.toString().length == 2){
            if(i.toString()[1] == 0 ){
            ref = ref - 3
            if(ref < 0) ref = ref + 10;
            }else{
            ref --
            if(ref < 0) ref = 9;
            }
        }else{
            ref --
            if(ref < 0) ref = 9;
        }
    
    
    array.push([i, ref])

}

//console.log(calculator([18,9]))

    
return array


}