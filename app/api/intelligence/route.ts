export const dynamic = "force-dynamic";

type FeedDefinition={slug:string;name:string;url:string;tier:number;domain:string};
type WireItem={id:string;sourceSlug:string;sourceName:string;title:string;url:string;publishedAt:string;summary:string;topic:string;tier:number};

const feeds:FeedDefinition[]=[
  {slug:"fed-all",name:"Federal Reserve Board",url:"https://www.federalreserve.gov/feeds/press_all.xml",tier:1,domain:"Policy & Banking"},
  {slug:"fed-monetary",name:"Federal Reserve Monetary Policy",url:"https://www.federalreserve.gov/feeds/press_monetary.xml",tier:1,domain:"Monetary Policy"},
  {slug:"bls-jobs",name:"BLS Employment Situation",url:"https://www.bls.gov/feed/empsit.rss",tier:1,domain:"Labor"},
  {slug:"bls-cpi",name:"BLS Consumer Price Index",url:"https://www.bls.gov/feed/cpi.rss",tier:1,domain:"Inflation"},
  {slug:"eia-today",name:"EIA Today in Energy",url:"https://www.eia.gov/rss/todayinenergy.xml",tier:1,domain:"Energy"},
  {slug:"eia-press",name:"EIA Press Releases",url:"https://www.eia.gov/rss/press_rss.xml",tier:1,domain:"Energy"},
];

const topicRules:[string,RegExp][]=[
  ["Monetary policy",/federal reserve|fomc|monetary|interest rate|policy rate|discount rate/i],
  ["Inflation & prices",/inflation|consumer price|producer price|prices|cpi|pce/i],
  ["Labor market",/employment|unemployment|payroll|jobs|labor|wage/i],
  ["Oil & gas",/oil|crude|petroleum|gasoline|natural gas|lng|opec|refin/i],
  ["Power & renewables",/electric|power|grid|solar|wind|nuclear|renewable|battery/i],
  ["Banking & credit",/bank|credit|capital|liquidity|lending|financial stability/i],
];

function decode(value:string){return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/\s+/g," ").trim()}
function field(block:string,name:string){const match=block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`,"i"));return match?decode(match[1]):""}
function atomLink(block:string){const match=block.match(/<link[^>]+href=["']([^"']+)["']/i);return match?.[1]??""}
function topicFor(text:string){return topicRules.find(([,rule])=>rule.test(text))?.[0]??"Institutions & economy"}
function cleanUrl(url:string){try{const parsed=new URL(url);parsed.hash="";return parsed.toString()}catch{return url}}
function hash(value:string){let result=2166136261;for(let i=0;i<value.length;i+=1){result^=value.charCodeAt(i);result=Math.imul(result,16777619)}return (result>>>0).toString(36)}

function parseFeed(xml:string,feed:FeedDefinition):WireItem[]{
  const blocks=[...(xml.match(/<item\b[\s\S]*?<\/item>/gi)??[]),...(xml.match(/<entry\b[\s\S]*?<\/entry>/gi)??[])];
  return blocks.slice(0,12).flatMap((block)=>{
    const title=field(block,"title");
    const url=cleanUrl(field(block,"link")||atomLink(block));
    const rawDate=field(block,"pubDate")||field(block,"updated")||field(block,"published")||field(block,"dc:date");
    const date=new Date(rawDate);
    if(!title||!url)return [];
    const summary=(field(block,"description")||field(block,"summary")||field(block,"content")).slice(0,420);
    return [{id:`${feed.slug}-${hash(url)}`,sourceSlug:feed.slug,sourceName:feed.name,title,url,publishedAt:Number.isNaN(date.valueOf())?"":date.toISOString(),summary,topic:topicFor(`${title} ${summary}`),tier:feed.tier}];
  });
}

function words(value:string){return new Set(value.toLowerCase().replace(/[^a-z0-9\s-]/g," ").split(/\s+/).filter((word)=>word.length>3&&!new Set(["with","from","that","this","will","have","into","their","about","release","announces","federal","united","states"]).has(word)))}
function similarity(a:string,b:string){const left=words(a),right=words(b);const overlap=[...left].filter((word)=>right.has(word)).length;return overlap/Math.max(1,new Set([...left,...right]).size)}

function cluster(items:WireItem[]){
  const groups:Array<{topic:string;items:WireItem[]}>=[];
  for(const item of items.sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt))){
    const match=groups.find((group)=>group.topic===item.topic&&group.items.some((candidate)=>similarity(candidate.title,item.title)>=.12));
    if(match)match.items.push(item);else groups.push({topic:item.topic,items:[item]});
  }
  return groups.map((group,index)=>{
    const uniqueSources=new Set(group.items.map((item)=>item.sourceSlug));
    const crossSource=uniqueSources.size>1;
    const newest=group.items[0];
    const evidence=group.items.slice(0,6);
    return {id:`cluster-${index}-${hash(newest.title)}`,topic:group.topic,title:newest.title,updatedAt:newest.publishedAt,sourceCount:uniqueSources.size,itemCount:group.items.length,confidence:crossSource?Math.min(95,68+uniqueSources.size*8+Math.min(10,group.items.length*2)):55,corroboration:crossSource?"cross-source":"single-source",summary:crossSource?`${uniqueSources.size} official source streams independently surface related evidence. AULOS groups them by topic and title overlap; the underlying releases remain the authority.`:"This is a developing single-source signal. AULOS is withholding cross-source confirmation until a separate publisher contributes related evidence.",perspectives:evidence.map((item)=>({source:item.sourceName,title:item.title,summary:item.summary,url:item.url,publishedAt:item.publishedAt,tier:item.tier}))};
  }).sort((a,b)=>(b.sourceCount-a.sourceCount)||(b.updatedAt.localeCompare(a.updatedAt))).slice(0,8);
}

async function readFeed(feed:FeedDefinition){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),7000);const started=Date.now();
  try{const response=await fetch(feed.url,{signal:controller.signal,headers:{"User-Agent":"AULOS-NEWS/0.4 (+https://aulos-news.ian-g-lacey2.chatgpt.site)"}});if(!response.ok)throw new Error(`HTTP ${response.status}`);const items=parseFeed(await response.text(),feed);return {feed,status:"live" as const,latencyMs:Date.now()-started,items}}
  catch(error){return {feed,status:"degraded" as const,latencyMs:Date.now()-started,error:error instanceof Error?error.message:"Unavailable",items:[] as WireItem[]}}
  finally{clearTimeout(timer)}
}

export async function GET(){
  const results=await Promise.all(feeds.map(readFeed));
  const deduped=[...new Map(results.flatMap((result)=>result.items).map((item)=>[item.url,item])).values()];
  const clusters=cluster(deduped);
  return Response.json({status:results.some((result)=>result.status==="live")?"live":"degraded",generatedAt:new Date().toISOString(),methodology:{clustering:"Topic classification plus title-token Jaccard similarity",corroboration:"Requires at least two distinct official source streams",guardrail:"Single-source signals are explicitly labeled and never presented as confirmed"},feedHealth:results.map((result)=>({slug:result.feed.slug,name:result.feed.name,domain:result.feed.domain,url:result.feed.url,status:result.status,latencyMs:result.latencyMs,itemCount:result.items.length,error:"error" in result?result.error:undefined})),itemCount:deduped.length,clusters});
}
