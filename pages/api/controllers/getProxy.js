
async function getProxyList(){
    try{
    const res = await fetch('https://tq.lunaproxy.com/getflowip?neek=1045070&num=50&type=2&sep=1&regions=br&ip_si=2&level=1&sb=')
    const json = await res.json();
    return json
    }catch{
        return {data:[]}
    }
}

export default getProxyList;