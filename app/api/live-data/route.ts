export const dynamic = "force-dynamic";

const registry = [
  { slug:"fred", name:"Federal Reserve Economic Data", category:"Macro & Markets", sourceType:"Primary data aggregator", accessMethod:"CSV / API", url:"https://fred.stlouisfed.org/", authorityTier:1 },
  { slug:"federal-reserve", name:"Federal Reserve Board", category:"Monetary Policy", sourceType:"Primary institution", accessMethod:"RSS / HTML", url:"https://www.federalreserve.gov/", authorityTier:1 },
  { slug:"ny-fed", name:"Federal Reserve Bank of New York", category:"Markets", sourceType:"Primary institution", accessMethod:"API / HTML", url:"https://www.newyorkfed.org/markets", authorityTier:1 },
  { slug:"bls", name:"Bureau of Labor Statistics", category:"Labor & Inflation", sourceType:"Primary statistics", accessMethod:"API", url:"https://www.bls.gov/", authorityTier:1 },
  { slug:"bea", name:"Bureau of Economic Analysis", category:"National Accounts", sourceType:"Primary statistics", accessMethod:"API", url:"https://www.bea.gov/", authorityTier:1 },
  { slug:"treasury", name:"U.S. Department of the Treasury", category:"Rates & Fiscal", sourceType:"Primary institution", accessMethod:"API / CSV", url:"https://home.treasury.gov/", authorityTier:1 },
  { slug:"sec", name:"SEC EDGAR", category:"Companies", sourceType:"Primary filings", accessMethod:"API", url:"https://www.sec.gov/edgar/search/", authorityTier:1 },
  { slug:"eia", name:"U.S. Energy Information Administration", category:"Energy", sourceType:"Primary statistics", accessMethod:"API", url:"https://www.eia.gov/", authorityTier:1 },
  { slug:"opec", name:"OPEC", category:"Energy", sourceType:"Participant institution", accessMethod:"Reports", url:"https://www.opec.org/", authorityTier:2 },
  { slug:"cftc", name:"Commodity Futures Trading Commission", category:"Positioning", sourceType:"Primary regulator", accessMethod:"CSV / Reports", url:"https://www.cftc.gov/", authorityTier:1 },
  { slug:"reuters", name:"Reuters", category:"Global Reporting", sourceType:"Independent reporting", accessMethod:"Web", url:"https://www.reuters.com/", authorityTier:2 },
  { slug:"ap", name:"Associated Press", category:"Global Reporting", sourceType:"Independent reporting", accessMethod:"Web", url:"https://apnews.com/", authorityTier:2 },
];

const seriesMeta: Record<string,{label:string;unit:string;decimals:number}> = {
  DGS2:{label:"UST 2Y",unit:"%",decimals:2}, DGS10:{label:"UST 10Y",unit:"%",decimals:2},
  DGS30:{label:"UST 30Y",unit:"%",decimals:2}, T10Y2Y:{label:"2s10s",unit:" bp",decimals:0},
  DCOILBRENTEU:{label:"Brent",unit:"$",decimals:2}, UNRATE:{label:"Unemployment",unit:"%",decimals:1},
  CPIAUCSL:{label:"CPI Index",unit:"",decimals:1}, PAYEMS:{label:"Payrolls",unit:"k",decimals:0},
};

function latestObservations(csv:string){
  const rows=csv.trim().split(/\r?\n/).map((row)=>row.split(",")); const headers=rows[0];
  const result:Array<{seriesId:string;label:string;date:string;value:number;display:string}>=[];
  for(let col=1;col<headers.length;col+=1){ const seriesId=headers[col]; const meta=seriesMeta[seriesId]; if(!meta)continue;
    for(let row=rows.length-1;row>0;row-=1){ const raw=rows[row][col]; if(!raw||raw===".")continue; let value=Number(raw); if(!Number.isFinite(value))continue;
      if(seriesId==="T10Y2Y")value*=100; const number=value.toFixed(meta.decimals); const display=meta.unit==="$"?`$${number}`:`${number}${meta.unit}`;
      result.push({seriesId,label:meta.label,date:rows[row][0],value,display}); break; }
  } return result;
}

export async function GET(){
  const started=Date.now(); const now=new Date(); const start=new Date(Date.UTC(now.getUTCFullYear()-1,now.getUTCMonth(),now.getUTCDate())).toISOString().slice(0,10); const end=now.toISOString().slice(0,10);
  const url=`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${Object.keys(seriesMeta).join(",")}&cosd=${start}&coed=${end}`;
  try{
    const baseUrl=process.env.AULOS_BACKEND_URL?.replace(/\/$/,"");
    const [response,marketResponse,energyResponse]=await Promise.all([
      fetch(url,{headers:{"User-Agent":"AULOS-NEWS/0.3 (research intelligence platform)"}}),
      baseUrl?fetch(`${baseUrl}/v1/markets/snapshots?symbols=SPY,QQQ,IWM,GLD,SLV,USO`,{headers:{"User-Agent":"AULOS-NEWS-Frontend/1.1"}}).catch(()=>null):Promise.resolve(null),
      baseUrl?fetch(`${baseUrl}/v1/data/energy`,{headers:{"User-Agent":"AULOS-NEWS-Frontend/1.2"}}).catch(()=>null):Promise.resolve(null),
    ]);
    if(!response.ok)throw new Error(`FRED returned ${response.status}`);
    const data=latestObservations(await response.text());
    if(marketResponse?.ok){
      const payload=await marketResponse.json() as {symbols?:Record<string,{latestTrade?:{p?:number;t?:string};dailyBar?:{c?:number;t?:string};prevDailyBar?:{c?:number}}>};
      const labels:Record<string,string>={SPY:"S&P 500 ETF",QQQ:"Nasdaq 100 ETF",IWM:"Russell 2000 ETF",GLD:"Gold ETF",SLV:"Silver ETF",USO:"Oil ETF"};
      for(const [symbol,snapshot] of Object.entries(payload.symbols??{})){
        const value=snapshot.latestTrade?.p??snapshot.dailyBar?.c;
        if(typeof value!=="number")continue;
        const prior=snapshot.prevDailyBar?.c;
        const move=typeof prior==="number"&&prior!==0?((value/prior)-1)*100:null;
        data.unshift({seriesId:`ALPACA:${symbol}`,label:labels[symbol]??symbol,date:snapshot.latestTrade?.t??snapshot.dailyBar?.t??new Date().toISOString(),value,display:`$${value.toFixed(2)}${move===null?"":` · ${move>=0?"+":""}${move.toFixed(2)}%`}`});
      }
    }
    if(energyResponse?.ok){
      const energy=await energyResponse.json() as {data?:Array<{seriesId:string;label:string;date:string;value:number;unit:string}>};
      for(const item of energy.data??[])data.push({seriesId:`EIA:${item.seriesId}`,label:item.label,date:item.date,value:item.value,display:`${item.value.toLocaleString()}${item.unit?` ${item.unit}`:""}`});
    }
    const providers=[marketResponse?.ok?"Alpaca":null,energyResponse?.ok?"EIA":null,"FRED"].filter(Boolean).join(" + ");
    return Response.json({status:"live",source:providers,retrievedAt:new Date().toISOString(),latencyMs:Date.now()-started,persistence:"hetzner-proxy",data,registry});
  }catch(error){
    return Response.json({status:"degraded",source:"FRED",retrievedAt:new Date().toISOString(),error:error instanceof Error?error.message:"Live source unavailable",data:[],registry}); }
}
