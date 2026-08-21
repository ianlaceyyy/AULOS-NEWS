export const dynamic = "force-dynamic";

type SourceClass="official"|"primary-research"|"independent-reporting";
type FeedDefinition={slug:string;name:string;url:string;tier:number;domain:string;sourceClass:SourceClass};
type Stance="upward"|"downward"|"restrictive"|"supportive"|"finding"|"neutral";
type WireItem={id:string;sourceSlug:string;publisherId:string;sourceName:string;sourceClass:FeedDefinition["sourceClass"];title:string;url:string;publishedAt:string;summary:string;topic:string;tier:number;entities:string[];stance:Stance};

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
  {slug:"treasury-press",name:"U.S. Treasury Press Releases",url:"https://home.treasury.gov/news/press-releases/feed",tier:1,domain:"Fiscal, Markets & Sanctions",sourceClass:"official"},
  {slug:"bea-releases",name:"Bureau of Economic Analysis",url:"https://apps.bea.gov/rss/rss.xml",tier:1,domain:"National Accounts",sourceClass:"official"},
  {slug:"ecb-press",name:"European Central Bank News",url:"https://www.ecb.europa.eu/rss/press.html",tier:1,domain:"Monetary Policy",sourceClass:"official"},
  {slug:"ecb-statistics",name:"European Central Bank Statistics",url:"https://www.ecb.europa.eu/rss/statpress.html",tier:1,domain:"Macro & Markets",sourceClass:"official"},
  {slug:"ecb-operations",name:"ECB Market Operations",url:"https://www.ecb.europa.eu/rss/operations.html",tier:1,domain:"Markets & Liquidity",sourceClass:"official"},
  {slug:"boe-news",name:"Bank of England",url:"https://www.bankofengland.co.uk/rss/news",tier:1,domain:"Monetary Policy & Stability",sourceClass:"official"},
  {slug:"bis-press",name:"Bank for International Settlements",url:"https://www.bis.org/doclist/all_pressrels.rss",tier:1,domain:"Global Banking",sourceClass:"official"},
  {slug:"bis-statistics",name:"BIS Statistical Releases",url:"https://www.bis.org/doclist/all_statistics.rss",tier:1,domain:"Global Markets Data",sourceClass:"official"},
  {slug:"bis-research",name:"BIS Research Hub",url:"https://www.bis.org/doclist/reshub_papers.rss",tier:2,domain:"Economics Research",sourceClass:"primary-research"},
  {slug:"bis-speeches",name:"Central Bankers' Speeches",url:"https://www.bis.org/doclist/cbspeeches.rss",tier:1,domain:"Monetary Policy",sourceClass:"official"},
  {slug:"cftc-general",name:"CFTC Press Releases",url:"https://www.cftc.gov/RSS/RSSGP/rssgp.xml",tier:1,domain:"Commodities & Derivatives",sourceClass:"official"},
  {slug:"cftc-enforcement",name:"CFTC Enforcement Releases",url:"https://www.cftc.gov/RSS/RSSENF/rssenf.xml",tier:1,domain:"Commodities Enforcement",sourceClass:"official"},
  {slug:"cftc-statements",name:"CFTC Speeches & Testimony",url:"https://www.cftc.gov/RSS/RSSST/rssst.xml",tier:1,domain:"Commodities Policy",sourceClass:"official"},
  {slug:"arxiv-qbio",name:"arXiv Quantitative Biology",url:"https://export.arxiv.org/api/query?search_query=cat%3Aq-bio&sortBy=submittedDate&sortOrder=descending&max_results=30",tier:2,domain:"Biology Research",sourceClass:"primary-research"},
  {slug:"arxiv-econ",name:"arXiv Economics",url:"https://export.arxiv.org/api/query?search_query=cat%3Aecon&sortBy=submittedDate&sortOrder=descending&max_results=30",tier:2,domain:"Economics Research",sourceClass:"primary-research"},
  {slug:"arxiv-robotics",name:"arXiv Robotics",url:"https://export.arxiv.org/api/query?search_query=cat%3Acs.RO&sortBy=submittedDate&sortOrder=descending&max_results=30",tier:2,domain:"Robotics Research",sourceClass:"primary-research"},
  {slug:"arxiv-astrophysics",name:"arXiv Astrophysics",url:"https://export.arxiv.org/api/query?search_query=cat%3Aastro-ph&sortBy=submittedDate&sortOrder=descending&max_results=30",tier:2,domain:"Space Research",sourceClass:"primary-research"},
  {slug:"nhc-atlantic",name:"National Hurricane Center Atlantic",url:"https://www.nhc.noaa.gov/index-at.xml",tier:1,domain:"Climate & Disaster Risk",sourceClass:"official"},
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
  ["Fiscal policy & sovereign debt",/treasury|fiscal|government debt|budget|deficit|tax credit|refunding|auction/i],
  ["Sanctions & illicit finance",/sanction|ofac|money laundering|terrorist financ|illicit financ|cartel|smuggl/i],
  ["Global trade & growth",/gross domestic product|\bgdp\b|international trade|imports|exports|current account|economic growth/i],
  ["Commodities & derivatives",/commodity|commodities|derivative|futures|swap|cftc|gold|silver|copper/i],
  ["Climate & disaster risk",/hurricane|tropical storm|climate|flood|drought|wildfire|extreme weather/i],
  ["Geopolitics & security",/war|conflict|military|security|geopolit|ukraine|russia|china|taiwan|iran|israel|gaza/i],
  ["Religion & society",/religion|religious|theolog|buddhis|christian|islam|hindu|ritual|sacred|secular/i],
  ["UAP disclosure & evidence",/unidentified anomalous|\buap\b|\bufo\b|technosignature|astrobiology|extraterrestrial/i],
];

const entityRules:[string,RegExp][]=[
  ["Federal Reserve",/federal reserve|\bfomc\b/i],["SEC",/securities and exchange commission|\bsec\b/i],["EIA",/energy information administration|\beia\b/i],
  ["NASA",/\bnasa\b/i],["U.S. labor market",/employment|unemployment|payroll|labor market/i],["U.S. inflation",/consumer price|producer price|inflation|\bcpi\b/i],
  ["Treasuries",/treasury|yield curve|interest rate/i],["Oil",/oil|crude|petroleum|gasoline/i],["Natural gas",/natural gas|\blng\b/i],
  ["Electricity grid",/electricity|power grid|electric grid/i],["Artificial intelligence",/artificial intelligence|machine learning|language model|neural/i],
  ["Robotics",/robot|robotics|autonomous system/i],["Biotechnology",/biotech|genom|protein|cell therapy|clinical trial/i],["Space",/space|lunar|moon|mars|orbit/i],
  ["U.S. Treasury",/u\.s\. treasury|department of the treasury|treasury secretary/i],["European Central Bank",/european central bank|\becb\b/i],["Bank of England",/bank of england|\bmpc\b/i],
  ["BIS",/bank for international settlements|\bbis\b/i],["CFTC",/commodity futures trading commission|\bcftc\b/i],["China",/china|chinese|beijing/i],["Russia",/russia|russian|moscow/i],["Ukraine",/ukraine|ukrainian|kyiv/i],
  ["UAP",/unidentified anomalous|\buap\b|\bufo\b/i],["Religion",/religion|religious|theolog|buddhis|christian|islam|hindu/i],
];

function decode(value:string){return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/\s+/g," ").trim()}
function field(block:string,name:string){const match=block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`,"i"));return match?decode(match[1]):""}
function atomLink(block:string){const match=block.match(/<link[^>]+href=["']([^"']+)["']/i);return match?.[1]??""}
function topicFor(text:string){return topicRules.find(([,rule])=>rule.test(text))?.[0]??"Institutions & economy"}
function entitiesFor(text:string){return entityRules.filter(([,rule])=>rule.test(text)).map(([name])=>name).slice(0,5)}
function stanceFor(text:string):Stance{if(/fell|falling|declin|decreas|lower|cool|contract|drop|slower|weaken/i.test(text))return "downward";if(/rose|rising|increas|higher|accelerat|expand|growth|record/i.test(text))return "upward";if(/tighten|restrict|ban|charge|enforcement|penalt|fraud/i.test(text))return "restrictive";if(/support|fund|approve|ease|relief|launch|open access/i.test(text))return "supportive";if(/finds|finding|discover|study|research|evidence|trial/i.test(text))return "finding";return "neutral"}
function cleanUrl(url:string){try{const parsed=new URL(url);parsed.hash="";return parsed.toString()}catch{return url}}
function hash(value:string){let result=2166136261;for(let i=0;i<value.length;i+=1){result^=value.charCodeAt(i);result=Math.imul(result,16777619)}return (result>>>0).toString(36)}
function publisherFor(slug:string){if(slug.startsWith("fed-"))return "federal-reserve";if(slug.startsWith("bls-"))return "bls";if(slug.startsWith("eia-"))return "eia";if(slug.startsWith("ecb-"))return "ecb";if(slug.startsWith("bis-"))return "bis";if(slug.startsWith("cftc-"))return "cftc";if(slug.startsWith("arxiv-"))return "arxiv";return slug}

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
    return [{id:`${feed.slug}-${hash(url)}`,sourceSlug:feed.slug,publisherId:publisherFor(feed.slug),sourceName:feed.name,sourceClass:feed.sourceClass,title,url,publishedAt:Number.isNaN(date.valueOf())?"":date.toISOString(),summary,topic:topicFor(text),tier:feed.tier,entities:entitiesFor(text),stance:stanceFor(text)}];
  });
}

function words(value:string){return new Set(value.toLowerCase().replace(/[^a-z0-9\s-]/g," ").split(/\s+/).filter((word)=>word.length>3&&!new Set(["with","from","that","this","will","have","into","their","about","release","announces","federal","united","states"]).has(word)))}
function similarity(a:string,b:string){const left=words(a),right=words(b);const overlap=[...left].filter((word)=>right.has(word)).length;return overlap/Math.max(1,new Set([...left,...right]).size)}

function buildNarrative(topic:string,entities:string[],evidence:WireItem[],sourceCount:number,agreement:string,corroboration:string){
  const newest=evidence[0];
  const evidenceIndexes=evidence.map((_,index)=>index);
  const upward=evidence.findIndex((item)=>item.stance==="upward");
  const downward=evidence.findIndex((item)=>item.stance==="downward");
  const subject=entities.slice(0,2).join(" and ")||topic.toLowerCase();
  const sentences=[
    {id:"latest",label:"Observed",classification:"fact",text:`The latest retrieved item in this cluster was published by ${newest.sourceName}${newest.publishedAt?` on ${new Date(newest.publishedAt).toISOString().slice(0,10)}`:""} and concerns ${subject}.`,citationIndexes:[0]},
    {id:"breadth",label:"Evidence base",classification:"fact",text:`AULOS currently groups ${evidence.length} retrieved items from ${sourceCount} distinct source ${sourceCount===1?"stream":"streams"} under ${topic.toLowerCase()}.`,citationIndexes:evidenceIndexes},
  ];
  if(agreement==="mixed"&&upward>=0&&downward>=0)sentences.push({id:"dissent",label:"Disagreement",classification:"fact",text:"The retrieved language contains both upward and downward directional signals; the evidence does not support a single directional conclusion.",citationIndexes:[upward,downward]});
  else if(agreement==="aligned")sentences.push({id:"alignment",label:"Agreement",classification:"fact",text:`The directional items in this cluster are aligned as ${evidence.find((item)=>!["neutral","finding"].includes(item.stance))?.stance??"consistent"}.`,citationIndexes:evidenceIndexes.filter((index)=>evidence[index].stance!=="neutral")});
  else sentences.push({id:"limits",label:"Evidence limit",classification:"analysis",text:"There is not enough directional evidence to characterize agreement or disagreement responsibly.",citationIndexes:evidenceIndexes});
  sentences.push({id:"judgment",label:"AULOS judgment",classification:"analysis",text:corroboration==="cross-source"?"The cluster is suitable for cross-source monitoring, but the retrieved releases do not by themselves establish causation.":"This remains a single-source signal and should not be treated as independently confirmed.",citationIndexes:evidenceIndexes});
  return {headline:`${topic}: ${subject}`,dek:`An evidence-constrained brief assembled from ${evidence.length} directly linked items.`,mode:"deterministic-extractive",sentences,whatChanged:evidence.slice(0,3).map((item,index)=>({id:item.id,sequence:index===0?"Latest":"Earlier",publishedAt:item.publishedAt,source:item.sourceName,title:item.title,url:item.url,stance:item.stance}))};
}

function cluster(items:WireItem[]){
  const groups:Array<{topic:string;items:WireItem[]}>=[];
  for(const item of items.sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt))){
    const match=groups.find((group)=>group.topic===item.topic&&group.items.some((candidate)=>similarity(candidate.title,item.title)>=.12||candidate.entities.some((entity)=>item.entities.includes(entity))));
    if(match)match.items.push(item);else groups.push({topic:item.topic,items:[item]});
  }
  return groups.map((group,index)=>{
    const uniquePublishers=new Set(group.items.map((item)=>item.publisherId));
    const crossSource=uniquePublishers.size>1;
    const newest=group.items[0];
    const evidence=group.items.slice(0,6);
    const entityCounts=new Map<string,number>();group.items.flatMap((item)=>item.entities).forEach((entity)=>entityCounts.set(entity,(entityCounts.get(entity)??0)+1));
    const entities=[...entityCounts].sort((a,b)=>b[1]-a[1]).map(([entity])=>entity).slice(0,5);
    const directional=new Set(group.items.map((item)=>item.stance).filter((stance)=>stance!=="neutral"&&stance!=="finding"));
    const agreement=directional.has("upward")&&directional.has("downward")?"mixed":directional.size===1&&group.items.length>1?"aligned":"insufficient";
    const label=entities[0]?`${group.topic}: ${entities[0]}`:newest.title;
    const corroboration=crossSource?"cross-source":"single-source";
    return {id:`cluster-${index}-${hash(newest.title)}`,topic:group.topic,title:label,updatedAt:newest.publishedAt,sourceCount:uniquePublishers.size,itemCount:group.items.length,confidence:crossSource?Math.min(95,68+uniquePublishers.size*8+Math.min(10,group.items.length*2)):55,corroboration,agreement,entities,summary:agreement==="mixed"?"The retrieved evidence contains opposing directional signals. AULOS preserves the disagreement rather than collapsing it into a single conclusion.":crossSource?`${uniquePublishers.size} independently governed publishers surface related evidence around ${entities.slice(0,2).join(" and ")||group.topic}. The underlying releases remain authoritative.`:"This is a developing single-publisher signal. AULOS is withholding cross-source confirmation until an independently governed publisher contributes related evidence.",narrative:buildNarrative(group.topic,entities,evidence,uniquePublishers.size,agreement,corroboration),perspectives:evidence.map((item)=>({source:item.sourceName,sourceClass:item.sourceClass,title:item.title,summary:item.summary,url:item.url,publishedAt:item.publishedAt,tier:item.tier,stance:item.stance,entities:item.entities})),timeline:evidence.map((item)=>({publishedAt:item.publishedAt,source:item.sourceName,title:item.title,url:item.url,stance:item.stance})).sort((a,b)=>a.publishedAt.localeCompare(b.publishedAt))};
  }).sort((a,b)=>(b.sourceCount-a.sourceCount)||(b.updatedAt.localeCompare(a.updatedAt))).slice(0,8);
}

async function readFeed(feed:FeedDefinition){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),7000);const started=Date.now();
  try{const response=await fetch(feed.url,{signal:controller.signal,headers:{"User-Agent":"AULOS-NEWS/0.5 (+https://aulos-news.ian-g-lacey2.chatgpt.site; public research aggregator)"}});if(!response.ok)throw new Error(`HTTP ${response.status}`);const items=parseFeed(await response.text(),feed);return {feed,status:"live" as const,latencyMs:Date.now()-started,items}}
  catch(error){return {feed,status:"degraded" as const,latencyMs:Date.now()-started,error:error instanceof Error?error.message:"Unavailable",items:[] as WireItem[]}}
  finally{clearTimeout(timer)}
}

async function readPersistentBackend(){
  const baseUrl=process.env.AULOS_BACKEND_URL?.replace(/\/$/,"");
  if(!baseUrl)return null;
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);
  try{
    const [articlesResponse,healthResponse,newsResponse]=await Promise.all([
      fetch(`${baseUrl}/v1/articles?limit=250`,{signal:controller.signal,headers:{"User-Agent":"AULOS-NEWS-Frontend/1.0"}}),
      fetch(`${baseUrl}/health`,{signal:controller.signal,headers:{"User-Agent":"AULOS-NEWS-Frontend/1.0"}}),
      fetch(`${baseUrl}/v1/news?limit=50`,{signal:controller.signal,headers:{"User-Agent":"AULOS-NEWS-Frontend/1.1"}}).catch(()=>null),
    ]);
    if(!articlesResponse.ok)throw new Error(`Backend returned ${articlesResponse.status}`);
    const payload=await articlesResponse.json() as {articles?:Array<{id:number;sourceSlug:string;sourceName:string;title:string;summary:string;url:string;publishedAt:string|null;retrievedAt:string}>};
    const health=healthResponse.ok?await healthResponse.json() as {lastCycle?:{feeds?:Array<{slug:string;status:string;received:number;latencyMs:number;error?:string|null}>}}:null;
    const feedMap=new Map(feeds.map((feed)=>[feed.slug,feed]));
    const items:WireItem[]=(payload.articles??[]).flatMap((article)=>{
      const feed=feedMap.get(article.sourceSlug);if(!feed)return [];
      const text=`${article.title} ${article.summary}`;
      return [{id:`stored-${article.id}`,sourceSlug:article.sourceSlug,publisherId:publisherFor(article.sourceSlug),sourceName:article.sourceName,sourceClass:feed.sourceClass,title:article.title,url:article.url,publishedAt:article.publishedAt??article.retrievedAt,summary:article.summary.slice(0,420),topic:topicFor(text),tier:feed.tier,entities:entitiesFor(text),stance:stanceFor(text)}];
    });
    if(newsResponse?.ok){
      const newsPayload=await newsResponse.json() as {news?:Array<{id:number;headline:string;summary?:string;url:string;created_at:string;source?:string;symbols?:string[]}>};
      for(const story of newsPayload.news??[]){
        const text=`${story.headline} ${story.summary??""}`;const publisher=story.source??"Alpaca News";
        items.push({id:`alpaca-news-${story.id}`,sourceSlug:"alpaca-news",publisherId:publisher,sourceName:`${publisher.replace(/^./,(letter)=>letter.toUpperCase())} via Alpaca`,sourceClass:"independent-reporting",title:story.headline,url:story.url,publishedAt:story.created_at,summary:(story.summary??"").slice(0,420),topic:topicFor(text),tier:2,entities:[...new Set([...entitiesFor(text),...(story.symbols??[])])].slice(0,5),stance:stanceFor(text)});
      }
    }
    return {items,health:health?.lastCycle?.feeds??[]};
  }catch{return null}finally{clearTimeout(timer)}
}

function gdeltDate(value:string){const match=value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);return match?`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z`:value}
function openAlexAbstract(index?:Record<string,number[]>){if(!index)return "";return Object.entries(index).flatMap(([word,positions])=>positions.map((position)=>[position,word] as const)).sort((a,b)=>a[0]-b[0]).map(([,word])=>word).join(" ").slice(0,420)}

async function readFreeApis():Promise<WireItem[]>{
  const gdeltQueries=["(energy OR oil OR gas OR gold OR silver OR commodities)","(geopolitics OR conflict OR sanctions OR election OR central bank OR artificial intelligence OR robotics)"];
  const openAlexQueries=["religion theology religious studies",'"unidentified anomalous phenomena" OR astrobiology OR technosignatures'];
  const openAlexKey=process.env.OPENALEX_API_KEY;
  const requests=[
    ...gdeltQueries.map((query)=>fetch(`https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=25&format=json&sort=datedesc`,{headers:{"User-Agent":"AULOS-NEWS/1.2"}}).then((response)=>response.ok?response.json():null).catch(()=>null)),
    ...openAlexQueries.map((search)=>{const url=new URL("https://api.openalex.org/works");url.searchParams.set("search",search);url.searchParams.set("sort","publication_date:desc");url.searchParams.set("per-page","20");url.searchParams.set("select","id,doi,display_name,publication_date,primary_location,abstract_inverted_index,topics");if(openAlexKey)url.searchParams.set("api_key",openAlexKey);return fetch(url,{headers:{"User-Agent":"AULOS-NEWS/1.2 (mailto:research@aulos.news)"}}).then((response)=>response.ok?response.json():null).catch(()=>null)}),
  ];
  const payloads=await Promise.all(requests);const items:WireItem[]=[];
  for(const payload of payloads.slice(0,gdeltQueries.length) as Array<{articles?:Array<{url:string;title:string;seendate:string;domain:string;language?:string}>}|null>){
    for(const article of payload?.articles??[]){if(!article.url||!article.title)continue;const text=article.title;items.push({id:`gdelt-${hash(article.url)}`,sourceSlug:"gdelt-doc",publisherId:article.domain,sourceName:`${article.domain} via GDELT`,sourceClass:"independent-reporting",title:article.title,url:article.url,publishedAt:gdeltDate(article.seendate),summary:"Global reporting indexed by the GDELT Project. Open the source for the publisher's full report.",topic:topicFor(text),tier:3,entities:entitiesFor(text),stance:stanceFor(text)})}
  }
  for(const payload of payloads.slice(gdeltQueries.length) as Array<{results?:Array<{id:string;doi?:string;display_name:string;publication_date:string;primary_location?:{landing_page_url?:string;source?:{display_name?:string}};abstract_inverted_index?:Record<string,number[]>;topics?:Array<{display_name:string}>}>}|null>){
    for(const work of payload?.results??[]){const url=work.doi??work.primary_location?.landing_page_url??work.id;if(!work.display_name||!url)continue;const abstract=openAlexAbstract(work.abstract_inverted_index);const text=`${work.display_name} ${abstract} ${(work.topics??[]).map((topic)=>topic.display_name).join(" ")}`;items.push({id:`openalex-${hash(work.id)}`,sourceSlug:"openalex",publisherId:work.primary_location?.source?.display_name??"openalex",sourceName:`${work.primary_location?.source?.display_name??"Scholarly work"} via OpenAlex`,sourceClass:"primary-research",title:work.display_name,url,publishedAt:`${work.publication_date}T00:00:00Z`,summary:abstract,topic:/religio|theolog/i.test(text)?"Religion & society":topicFor(text),tier:2,entities:entitiesFor(text),stance:"finding"})}
  }
  items.push({id:"nara-uap-rg615",sourceSlug:"nara-uap",publisherId:"national-archives",sourceName:"U.S. National Archives",sourceClass:"official",title:"Record Group 615: Unidentified Anomalous Phenomena Records Collection",url:"https://www.archives.gov/research/topics/uaps/rg-615",publishedAt:"2026-05-01T00:00:00Z",summary:"The official rolling collection of publicly released UAP records transferred by federal agencies under the 2024 NDAA.",topic:"UAP disclosure & evidence",tier:1,entities:["National Archives","UAP"],stance:"neutral"});
  items.push({id:"aaro-official",sourceSlug:"aaro",publisherId:"department-of-defense",sourceName:"All-domain Anomaly Resolution Office",sourceClass:"official",title:"Official UAP records, reports and case-resolution material",url:"https://www.aaro.mil/",publishedAt:"2026-08-01T00:00:00Z",summary:"Department of Defense material is treated as an official documentary source, not proof of extraordinary origin.",topic:"UAP disclosure & evidence",tier:1,entities:["AARO","UAP"],stance:"neutral"});
  return items;
}

export async function GET(){
  const persistent=await readPersistentBackend();
  if(persistent&&persistent.items.length){
    const freeApiItems=await readFreeApis();const combined=[...new Map([...persistent.items,...freeApiItems].map((item)=>[item.url,item])).values()];
    const clusters=cluster(combined);
    const healthMap=new Map(persistent.health.map((item)=>[item.slug,item]));
    return Response.json({status:"live",generatedAt:new Date().toISOString(),persistence:"hetzner-postgresql + free public APIs",latestItems:[...combined].sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)).slice(0,40),methodology:{clustering:"Topic, entity overlap, and title-token similarity",corroboration:"Requires at least two independently governed publishers",stance:"Directional language is classified deterministically; mixed upward/downward evidence is preserved as disagreement",guardrail:"UAP documents, reporting and scientific research remain separate evidence classes; no extraordinary claim is inferred from government disclosure alone."},feedHealth:feeds.map((feed)=>{const health=healthMap.get(feed.slug);return {slug:feed.slug,name:feed.name,domain:feed.domain,sourceClass:feed.sourceClass,url:feed.url,status:health?.status??"stored",latencyMs:health?.latencyMs??0,itemCount:health?.received??persistent.items.filter((item)=>item.sourceSlug===feed.slug).length,error:health?.error??undefined}}),itemCount:combined.length,entityCount:new Set(combined.flatMap((item)=>item.entities)).size,clusters});
  }
  const [results,freeApiItems]=await Promise.all([Promise.all(feeds.map(readFeed)),readFreeApis()]);
  const deduped=[...new Map([...results.flatMap((result)=>result.items),...freeApiItems].map((item)=>[item.url,item])).values()];
  const clusters=cluster(deduped);
  return Response.json({status:results.some((result)=>result.status==="live")?"live":"degraded",generatedAt:new Date().toISOString(),latestItems:deduped.sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)).slice(0,40),methodology:{clustering:"Topic, entity overlap, and title-token similarity",corroboration:"Requires at least two independently governed publishers",stance:"Directional language is classified deterministically; mixed upward/downward evidence is preserved as disagreement",guardrail:"Single-publisher signals are explicitly labeled and never presented as confirmed"},feedHealth:results.map((result)=>({slug:result.feed.slug,name:result.feed.name,domain:result.feed.domain,sourceClass:result.feed.sourceClass,url:result.feed.url,status:result.status,latencyMs:result.latencyMs,itemCount:result.items.length,error:"error" in result?result.error:undefined})),itemCount:deduped.length,entityCount:new Set(deduped.flatMap((item)=>item.entities)).size,clusters});
}
