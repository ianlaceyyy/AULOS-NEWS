export const dynamic = "force-dynamic";

type Observation = { seriesId:string; label:string; date:string; value:number; display:string };

const fredSeries: Record<string, { label:string; unit:string; decimals:number }> = {
  DGS2:{label:"2-year Treasury yield",unit:"%",decimals:2},
  DGS10:{label:"10-year Treasury yield",unit:"%",decimals:2},
  T10Y2Y:{label:"10s–2s Treasury spread",unit:" bp",decimals:0},
  UNRATE:{label:"unemployment rate",unit:"%",decimals:1},
  CPIAUCSL:{label:"CPI index",unit:"",decimals:1},
  DCOILBRENTEU:{label:"Brent crude",unit:"$",decimals:2},
};

function parseLatest(csv:string): Observation[] {
  const rows=csv.trim().split(/\r?\n/).map((row)=>row.split(","));
  const headers=rows[0] ?? [];
  return headers.slice(1).flatMap((seriesId,colOffset)=>{
    const meta=fredSeries[seriesId]; if(!meta)return [];
    for(let row=rows.length-1;row>0;row-=1){
      const raw=rows[row][colOffset+1]; if(!raw||raw===".")continue;
      let value=Number(raw); if(!Number.isFinite(value))continue;
      if(seriesId==="T10Y2Y")value*=100;
      const number=value.toFixed(meta.decimals);
      return [{seriesId,label:meta.label,date:rows[row][0],value,display:meta.unit==="$"?`$${number}`:`${number}${meta.unit}`}];
    }
    return [];
  });
}

function citation(seriesId:string,label:string,date:string){
  return { source:"Federal Reserve Bank of St. Louis", sourceSlug:"fred", label:`${label}, observation ${date}`, url:`https://fred.stlouisfed.org/series/${seriesId}`, evidenceType:"primary-data" as const };
}

export async function GET(){
  const now=new Date();
  const start=new Date(Date.UTC(now.getUTCFullYear()-1,now.getUTCMonth(),now.getUTCDate())).toISOString().slice(0,10);
  const end=now.toISOString().slice(0,10);
  const ids=Object.keys(fredSeries);
  try{
    const response=await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${ids.join(",")}&cosd=${start}&coed=${end}`,{headers:{"User-Agent":"AULOS-NEWS/0.3 (public-source intelligence prototype)"}});
    if(!response.ok)throw new Error(`FRED returned ${response.status}`);
    const observations=parseLatest(await response.text());
    const byId=Object.fromEntries(observations.map((item)=>[item.seriesId,item]));
    const claims=[];
    if(byId.DGS2)claims.push({id:"policy-rate",status:"OBSERVED",classification:"fact",confidence:100,statement:`The 2-year Treasury yield is ${byId.DGS2.display}.`,qualification:"This is a market price, not a direct forecast of a specific FOMC decision.",citations:[citation("DGS2",byId.DGS2.label,byId.DGS2.date)]});
    if(byId.DGS10&&byId.T10Y2Y)claims.push({id:"curve",status:"OBSERVED",classification:"fact",confidence:100,statement:`The 10-year Treasury yield is ${byId.DGS10.display}, with the 10s–2s spread at ${byId.T10Y2Y.display}.`,qualification:"The curve describes current pricing; its causes require interpretation.",citations:[citation("DGS10",byId.DGS10.label,byId.DGS10.date),citation("T10Y2Y",byId.T10Y2Y.label,byId.T10Y2Y.date)]});
    if(byId.UNRATE&&byId.CPIAUCSL)claims.push({id:"dual-mandate",status:"CONTEXT",classification:"inference",confidence:82,statement:`Policy is balancing an unemployment rate of ${byId.UNRATE.display} against a CPI index reading of ${byId.CPIAUCSL.display}.`,qualification:"AULOS inference: these releases frame—but do not determine—the Federal Reserve’s policy decision.",citations:[citation("UNRATE",byId.UNRATE.label,byId.UNRATE.date),citation("CPIAUCSL",byId.CPIAUCSL.label,byId.CPIAUCSL.date)]});
    const event={id:"fed-live",category:"MACRO · MONETARY POLICY",kicker:"THE POLICY PATH",title:"Treasury pricing maps the live constraints around Federal Reserve policy",summary:"AULOS separates what markets and official releases currently show from what those signals may imply. The evidence below updates directly from public Federal Reserve data.",change:byId.T10Y2Y?`The latest recorded 10s–2s spread is ${byId.T10Y2Y.display}.`:"The primary-data feed is updating.",confidence:94,sources:1,updated:new Date().toISOString(),tone:"amber",tags:["Federal Reserve","Treasuries","Inflation"],methodology:"Claims marked OBSERVED reproduce primary data. Claims marked CONTEXT are AULOS interpretations and include an explicit qualification.",claims};
    return Response.json({status:"live",generatedAt:new Date().toISOString(),events:[event]});
  }catch(error){
    return Response.json({status:"degraded",generatedAt:new Date().toISOString(),events:[],error:error instanceof Error?error.message:"Event feed unavailable"},{status:503});
  }
}
