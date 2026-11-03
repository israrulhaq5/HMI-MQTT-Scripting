/*
 AUTOMATRIX MQTT MONITOR V4 — WEINTEK cMT2078X
 100ms target HTTP polling, fourteen electrical readings, timings.
 Import official Weintek JS resource in EasyBuilder Pro first:
 tutorial-webrequest_request-0.0.4.js
 Local PC simulation only: HTTP bridge must be on same host.
*/
var request = require('./tutorial-webrequest_request-0.0.4.js');
var API_URL = "http://127.0.0.1:8765/api/simgrid1";
var REFRESH_MS = 100;
var STALE_MS = 1000;
var REQUEST_TIMEOUT_MS = 3000;

var canvas = new Canvas();
this.widget.add(canvas);
var WIDTH = 780, HEIGHT = 430;
var readings = {}, status = "CONNECTING", errorText = "";
var messageCount = 0, lastDataAge = null, lastGoodTime = 0;
var busy = false, requestStartMs = 0;
var httpResponseMs = null, displayUpdateMs = null, previousUpdateMs = 0;
var previousMessageCount = -1, newDataIntervalMs = null, previousNewDataTime = 0;

var parameters = [
 ["SIM_V1","VOLTAGE L1","V"], ["SIM_V2","VOLTAGE L2","V"],
 ["SIM_V3","VOLTAGE L3","V"], ["SIM_A1","CURRENT L1","A"],
 ["SIM_A2","CURRENT L2","A"], ["SIM_A3","CURRENT L3","A"],
 ["SIM_KW1","POWER L1","kW"], ["SIM_KW2","POWER L2","kW"],
 ["SIM_KW3","POWER L3","kW"], ["SIM_KW_TOTAL","TOTAL POWER","kW"],
 ["SIM_HZ","FREQUENCY","Hz"], ["SIM_PF","POWER FACTOR",""],
 ["SIM_IMPORT_KWH","IMPORT ENERGY","kWh"],
 ["SIM_EXPORT_KWH","EXPORT ENERGY","kWh"]
];

function drawText(value,x,y,size,color) {
 canvas.fillStyle=color;
 canvas.font=size+"px Arial";
 canvas.fillText(String(value),x,y);
}
function formatMs(value) {
 return value===null?"--":Math.round(value)+"ms";
}
function formatValue(key) {
 if(status!=="LIVE")return "--";
 var raw=readings[key];
 if(raw===undefined||raw===null||raw==="")return "--";
 var n=Number(raw);
 return isFinite(n)?n.toFixed(2):"--";
}
function drawCard(index) {
 var item=parameters[index],col=index%4,row=Math.floor(index/4);
 var x=10+col*193,y=58+row*89,w=183,h=79;
 canvas.fillStyle="#21354c";canvas.fillRect(x,y,w,h);
 var color="#38bdf8";
 if(index>=3&&index<=5)color="#fbbf24";
 if(index>=6&&index<=9)color="#4ade80";
 if(index>=10&&index<=11)color="#c084fc";
 if(index>=12)color="#fb923c";
 canvas.fillStyle=color;canvas.fillRect(x,y,4,h);
 drawText(item[1],x+12,y+22,12,"#b0c7db");
 var value=formatValue(item[0]);
 drawText(value,x+12,y+55,value.length>8?18:23,"#ffffff");
 drawText(item[2],x+131,y+70,11,"#7dd3fc");
}
function drawDashboard() {
 canvas.clearRect(0,0,WIDTH,HEIGHT);
 canvas.fillStyle="#101d2e";canvas.fillRect(0,0,WIDTH,HEIGHT);
 drawText("AUTOMATRIX MQTT MONITOR",15,28,20,"#ffffff");
 var statusColor=status==="LIVE"?"#4ade80":"#f87171";
 drawText(status,465,28,14,statusColor);
 drawText("HTTP "+formatMs(httpResponseMs),545,28,12,"#7dd3fc");
 drawText("UPD "+formatMs(displayUpdateMs),655,28,12,"#fbbf24");
 canvas.fillStyle="#34465a";canvas.fillRect(10,43,760,1);
 for(var i=0;i<parameters.length;i++)drawCard(i);
 drawText("MQTT Msg: "+messageCount,12,422,12,"#94a3b8");
 drawText("Poll: "+REFRESH_MS+"ms",225,422,12,"#94a3b8");
 drawText("New data: "+formatMs(newDataIntervalMs),360,422,12,"#7dd3fc");
 if(lastDataAge!==null)drawText("Age: "+lastDataAge+"s",595,422,12,"#4ade80");
 else if(errorText)drawText(errorText.substring(0,35),550,422,10,"#ff9999");
}
function resetSamples() {
 readings={};lastDataAge=null;
 displayUpdateMs=null;previousUpdateMs=0;
 previousMessageCount=-1;previousNewDataTime=0;newDataIntervalMs=null;
}
function readHttp() {
 if(busy)return;
 busy=true;requestStartMs=Date.now();
 request.get({url:API_URL},function(error,response,body){
  var now=Date.now();
  httpResponseMs=now-requestStartMs;
  busy=false;
  try {
   // Weintek official request helper can report "No error" on success.
   var err=String(error||"").trim();
   if(err!==""&&err.toLowerCase()!=="no error")throw new Error(err);
   if(!response||Number(response.statusCode)!==200)
    throw new Error("HTTP "+(response?response.statusCode:"unknown"));
   if(typeof body!=="string"||body.length===0)throw new Error("Empty HTTP body");
   var result=JSON.parse(body);
   if(result.live===true&&result.values&&typeof result.values==="object") {
    if(previousUpdateMs>0)displayUpdateMs=now-previousUpdateMs;
    previousUpdateMs=now;
    var newCount=Number(result.message_count||0);
    if(newCount!==previousMessageCount){
     if(previousNewDataTime>0&&previousMessageCount>=0)
      newDataIntervalMs=now-previousNewDataTime;
     previousNewDataTime=now;previousMessageCount=newCount;
    }
    readings=result.values;messageCount=newCount;
    lastDataAge=result.age_seconds;lastGoodTime=now;
    status="LIVE";errorText="";
   } else {
    status="MQTT OFFLINE";errorText="";resetSamples();
   }
  }catch(e){
   status="HTTP ERROR";errorText=String(e);resetSamples();
   console.log("AUTOMATRIX HTTP ERROR:",errorText);
  }
  drawDashboard();
 });
}
drawDashboard();
readHttp();
setInterval(function(){
 var now=Date.now();
 if(lastGoodTime>0&&now-lastGoodTime>STALE_MS&&status==="LIVE"){
  status="STALE";readings={};drawDashboard();
 }
 if(busy){
  if(now-requestStartMs>REQUEST_TIMEOUT_MS){
   status="HTTP TIMEOUT";readings={};drawDashboard();
  }
  return;
 }
 readHttp();
},REFRESH_MS);
