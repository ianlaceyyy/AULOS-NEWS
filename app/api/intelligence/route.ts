export const dynamic = "force-dynamic";

type FeedDefinition={slug:string;name:string;url:string;tier:number;domain:string;sourceClass:"official"|"primary-research"};
type Stance="upward"|"downward"|"restrictive"|"supportive"|"finding"|"neutral";
type WireItem={id:string;sourceSlug:string;sourceName:string;sourceClass:FeedDefinition["sourceClass"];title:string;url:string;publishedAt:string;summary:string;topic:string;tier:number;entities:string[];stance:Stance};

const feeds:FeedDefinition[]=[
  {slug:"fed-all",name:"Federal Reserve Board",url:"https://www.federalreserve.gov/feeds/press_all.xml",tier:1,domain:"Policy & Banking",sourceClass:"official"},
  {slug:"fed-monetary",name:"Federal Reserve Monetary Policy",url:"https://www.federalreserve.gov/feeds/press_monetary.xml",tier:1,domain:"Monetary Policy",sourceClass:"official"},
  {slug:"bls-jobs",name:"BLS Employment Situation",url:"https://www.bls.gov/feed/empsit.rss",tier:1,domain:"Labor",sourceClass:"official"},
  {slug:"bls-cpi",name:"BLS Consumer Price Index",url:"https://www.bls.gov/feed/cpi.rss",tier:1,domain:"Inflation",sourceClass:"official"},
  {slug:"eia-today",name:"EIA Today in Energy",url:"https://www.eia.gov/rss/todayinenergy.xml",tier:1,domain:"Energy",sourceClass:"official"},
  {slug:"eia-press",name:"EIA Press Releases",url:"https://www.eia.gov/rss/press_rss.xml",tier:1,domain:"Energy",sourceClass:"official"},
  {slug:"sec-press",name:"SEC Press Releases",url:"https://www.sec.gov/news/pressreleases.rss",tier:1,domain:"Capital Markets",sourceClass:"official"},
  {slug:"nasa-releases",name:"NASA News Releases",url:"https://www.nasa.gov/news-release/feed/",tier:1,domain:"Science & Space",sourceClass:"official"},
  {slug:"arxiv-ai",name:"arXiv Artificial Intelligence",url:"https://export.arxiv.org/api/query?search_query=cat%3Acs.AI&sortBy=submittedDate&sortOrder=descending&max_results=12",tier:2,domain:"AI Research",sourceClass:"primary-research"},
];

const topicRules:[string,RegExp][]=[
  ["Monetary policy",/federal reserve|fomc|monetary|interest rate|policy rate|discount rate/i],
  ["Inflation & prices",/inflation|consumer price|producer price|prices|cpi|pce/i],
  ["Labor market",/employment|unemployment|payroll|jobs|labor|wage/i],
  ["Oil & gas",/oil|crude|petroleum|gasoline|natural gas|lng|opec|refin/i],
  ["Power & renewables",/electric|power|grid|solar|wind|nuclear|renewable|battery/i],
  ["Banking & credit",/bank|credit|capital|liquidity|lending|financial stability/i],
  ["AI & robotics",/artificial intelligence|machine learning|neural|language model|robot|autonomous|computer vision/i],
  ["Biology & medicine",/biology|biomedical|clinical|cancer|brain|genom|protein|disease|therapy|patient/i],
  ["Space & planetary science",/nasa|space|lunar|moon|mars|planet|asteroid|telescope|galaxy|orbit/i],
  ["Capital-markets regulation",/sec|securities|exchange-traded|investor|fraud|offering|broker|market structure/i],
];

const entityRules:[string,RegExp][]=[
  ["Federal Reserve",/federal reserve|\bfomc\b/i],["SEC",/securities and exchange commission|\bsec\b/i],["EIA",/energy information administration|\beia\b/i],
  ["NASA",/\bnasa\b/i],["U.S. labor market",/employment|unemployment|payroll|labor market/i],["U.S. inflation",/consumer price|producer price|inflation|\bcpi\b/i],
  ["Treasuries",/treasury|yield curve|interest rate/i],["Oil",/oil|crude|petroleum|gasoline/i],["Natural gas",/natural gas|\blng\b/i],
  ["Electricity grid",/electricity|power grid|electric grid/i],["Artificial intelligence",/artificial intelligence|machine learning|language model|neural/i],
  ["Robotics",/robot|robotics|autonomous system/i],["Biotechnology",/biotech|genom|protein|cell therapy|clinical trial/i],["Space",/space|lunar|moon|mars|orbit/i],
];

function decode(value:string){return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/\s+/g," ").trim()}
function field(block:string,name:string){const match=block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`,"i"));return match?decode(match[1]):""}
function atomLink(block:string){const match=block.match(/<link[^>]+href=["']([^"']+)["']/i);return match?.[1]??""}
function topicFor(text:string){return topicRules.find(([,rule])=>rule.test(text))?.[0]??"Institutions & economy"}
function entitiesFor(text:string){return entityRules.filter(([,rule])=>rule.test(text)).map(([name])=>name).slice(0,5)}
function stanceFor(text:string):Stance{if(/fell|falling|declin|decreas|lower|cool|contract|drop|slower|weaken/i.test(text))return "downward";if(/rose|rising|increas|higher|accelerat|expand|growth|record/i.test(text))return "upward";if(/tighten|restrict|ban|charge|enforcement|penalt|fraud/i.test(text))return "restrictive";if(/support|fund|approve|ease|relief|launch|open access/i.test(text))return "supportive";if(/finds|finding|discover|study|research|evidence|trial/i.test(text))return "finding";return "neutral"}
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
    const text=`${title} ${summary}`;
    return [{id:`${feed.slug}-${hash(url)}`,sourceSlug:feed.slug,sourceName:feed.name,sourceClass:feed.sourceClass,title,url,publishedAt:Number.isNaN(date.valueOf())?"":date.toISOString(),summary,topic:topicFor(text),tier:feed.tier,entities:entitiesFor(text),stance:stanceFor(text)}];
  });
}

function words(value:string){return new Set(value.toLowerCase().replace(/[^a-z0-9\s-]/g," ").split(/\s+/).filter((word)=>word.length>3&&!new Set(["with","from","that","this","will","have","into","their","about","release","announces","federal","united","states"]).has(word)))}
function similarity(a:string,b:string){const left=words(a),right=words(b);const overlap=[...left].filter((word)=>right.has(word)).length;return overlap/Math.max(1,new Set([...left,...right]).size)}

function cluster(items:WireItem[]){
  const groups:Array<{topic:string;items:WireItem[]}>=[];
  for(const item of items.sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt))){
    const match=groups.find((group)=>group.topic===item.topic&&group.items.some((candidate)=>similarity(candidate.title,item.title)>=.12||candidate.entities.some((entity)=>item.entities.includes(entity))));
    if(match)match.items.push(item);else groups.push({topic:item.topic,items:[item]});
  }
  return groups.map((group,index)=>{
    const uniqueSources=new Set(group.items.map((item)=>item.sourceSlug));
    const crossSource=uniqueSources.size>1;
    const newest=group.items[0];
    const evidence=group.items.slice(0,6);
    const entityCounts=new Map<string,number>();group.items.flatMap((item)=>item.entities).forEach((entity)=>entityCounts.set(entity,(entityCounts.get(entity)??0)+1));
    const entities=[...entityCounts].sort((a,b)=>b[1]-a[1]).map(([entity])=>entity).slice(0,5);
    const directional=new Set(group.items.map((item)=>item.stance).filter((stance)=>stance!=="neutral"&&stance!=="finding"));
    const agreement=directional.has("upward")&&directional.has("downward")?"mixed":directional.size===1&&group.items.length>1?"aligned":"insufficient";
    const label=entities[0]?`${group.topic}: ${entities[0]}`:newest.title;
    return {id:`cluster-${index}-${hash(newest.title)}`,topic:group.topic,title:label,updatedAt:newest.publishedAt,sourceCount:uniqueSources.size,itemCount:group.items.length,confidence:crossSource?Math.min(95,68+uniqueSources.size*8+Math.min(10,group.items.length*2)):55,corroboration:crossSource?"cross-source":"single-source",agreement,entities,summary:agreement==="mixed"?"The retrieved evidence contains opposing directional signals. AULOS preserves the disagreement rather than collapsing it into a single conclusion.":crossSource?`${uniqueSources.size} distinct source streams surface related evidence around ${entities.slice(0,2).join(" and ")||group.topic}. The underlying releases remain authoritative.`:"This is a developing single-source signal. AULOS is withholding cross-source confirmation until a separate publisher contributes related evidence.",perspectives:evidence.map((item)=>({source:item.sourceName,sourceClass:item.sourceClass,title:item.title,summary:item.summary,url:item.url,publishedAt:item.publishedAt,tier:item.tier,stance:item.stance,entities:item.entities})),timeline:evidence.map((item)=>({publishedAt:item.publishedAt,source:item.sourceName,title:item.title,url:item.url,stance:item.stance})).sort((a,b)=>a.publishedAt.localeCompare(b.publishedAt))};
  }).sort((a,b)=>(b.sourceCount-a.sourceCount)||(b.updatedAt.localeCompare(a.updatedAt))).slice(0,8);
}

async function readFeed(feed:FeedDefinition){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),7000);const started=Date.now();
  try{const response=await fetch(feed.url,{signal:controller.signal,headers:{"User-Agent":"AULOS-NEWS/0.5 (+https://aulos-news.ian-g-lacey2.chatgpt.site; public research aggregator)"}});if(!response.ok)throw new Error(`HTTP ${response.status}`);const items=parseFeed(await response.text(),feed);return {feed,status:"live" as const,latencyMs:Date.now()-started,items}}
  catch(error){return {feed,status:"degraded" as const,latencyMs:Date.now()-started,error:error instanceof Error?error.message:"Unavailable",items:[] as WireItem[]}}
  finally{clearTimeout(timer)}
}

export async function GET(){
  const results=await Promise.all(feeds.map(readFeed));
  const deduped=[...new Map(results.flatMap((result)=>result.items).map((item)=>[item.url,item])).values()];
  const clusters=cluster(deduped);
  return Response.json({status:results.some((result)=>result.status==="live")?"live":"degraded",generatedAt:new Date().toISOString(),methodology:{clustering:"Topic, entity overlap, and title-token similarity",corroboration:"Requires at least two distinct source streams",stance:"Directional language is classified deterministically; mixed upward/downward evidence is preserved as disagreement",guardrail:"Single-source signals are explicitly labeled and never presented as confirmed"},feedHealth:results.map((result)=>({slug:result.feed.slug,name:result.feed.name,domain:result.feed.domain,sourceClass:result.feed.sourceClass,url:result.feed.url,status:result.status,latencyMs:result.latencyMs,itemCount:result.items.length,error:"error" in result?result.error:undefined})),itemCount:deduped.length,entityCount:new Set(deduped.flatMap((item)=>item.entities)).size,clusters});
}
