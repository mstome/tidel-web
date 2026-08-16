/* ═══════════════════════════════════════════════════════════════════════════════════
   TIDEL — grafikken paa forsiden.

   ALLE TALL HER ER EKTE. De kommer fra Magnus' egne oekter paa Froland MX og er
   verifisert mot appens egne trofeer. GPS-linja er medianen av de ni rundene 22. juli,
   lagt paa appens eget satellittbilde med en maalt transform:
       sat_x = x * 1.80 - 427.44
       sat_y = y * 1.80 + 116
   Endres bildet, maa transformen maales paa nytt.
   ═══════════════════════════════════════════════════════════════════════════════════ */
'use strict';

var POLY=[[619.6,157.0],[623.9,159.6],[634.3,170.3],[637.2,174.5],[639.8,178.6],[646.4,192.0],[651.6,206.2],[654.2,221.1],[653.8,231.1],[653.0,236.1],[651.6,240.9],[647.2,250.3],[642.4,259.3],[633.4,271.3],[607.2,301.7],[566.2,344.5],[553.4,352.4],[514.3,372.8],[485.7,391.5],[473.6,402.5],[461.9,412.2],[447.4,425.7],[443.7,433.9],[443.6,438.9],[447.0,446.0],[451.8,447.1],[456.0,447.0],[459.9,445.9],[464.2,443.6],[481.8,431.0],[486.2,428.6],[490.6,427.5],[495.2,425.2],[499.9,424.9],[504.6,425.6],[508.8,428.2],[511.5,427.8],[511.9,432.3],[509.4,437.1],[509.6,440.9],[505.9,443.1],[487.3,450.2],[478.6,455.6],[470.7,461.6],[460.5,472.4],[454.5,480.5],[418.7,535.2],[408.4,552.7],[402.3,561.2],[392.7,573.0],[389.3,575.8],[385.2,578.3],[380.5,580.0],[375.5,578.8],[370.8,579.0],[368.5,575.5],[369.7,570.8],[369.9,565.9],[370.9,561.6],[382.0,544.7],[404.4,505.4],[412.5,492.5],[417.2,483.9],[421.4,475.0],[421.7,470.3],[422.7,465.3],[422.5,460.7],[418.1,455.7],[414.0,455.4],[411.5,458.2],[388.9,502.9],[378.1,525.5],[376.2,530.1],[373.4,539.7],[370.0,549.2],[364.3,557.7],[361.1,560.9],[356.9,556.5],[347.7,558.7],[346.9,556.0],[347.3,551.2],[345.8,541.1],[347.6,531.1],[351.6,516.4],[353.3,511.7],[357.1,502.3],[365.1,489.4],[374.6,477.5],[384.9,466.4],[420.7,424.2],[472.0,367.0],[478.8,359.9],[502.0,340.4],[508.6,335.8],[516.7,333.3],[526.5,331.8],[536.0,331.0],[545.6,330.9],[550.5,328.8],[555.5,325.4],[565.2,320.2],[569.2,318.7],[572.4,318.2],[574.6,315.9],[583.1,302.8],[603.6,273.9],[609.5,266.1],[622.2,250.7],[631.1,238.3],[632.1,229.2],[634.4,219.6],[633.2,214.6],[633.2,204.4],[631.3,199.4],[628.5,194.9],[625.6,190.4],[619.6,183.2],[616.2,180.0],[612.0,177.4],[603.4,171.1],[598.8,171.1],[589.2,169.6],[579.3,171.0],[574.5,172.3],[569.7,174.8],[564.7,176.5],[550.1,175.9],[545.5,174.3],[541.2,171.8],[537.0,168.4],[530.0,160.6],[525.2,151.5],[522.4,141.7],[522.1,131.9],[523.7,127.4],[526.7,123.4],[537.9,112.9],[544.6,106.0],[547.5,101.9],[558.3,85.1],[580.4,46.1],[582.8,42.2],[586.3,38.2],[593.5,30.7],[604.3,20.7],[613.1,20.0],[617.9,21.2],[625.0,20.1],[623.9,23.0],[627.0,27.8],[626.7,32.3],[623.5,36.0],[615.8,42.5],[608.5,49.7],[585.3,77.1],[579.8,85.8],[576.0,94.7],[570.5,113.6],[563.1,126.7],[561.3,131.4],[560.5,136.4],[561.5,138.6],[567.3,147.7],[571.6,149.8],[576.5,150.5],[581.3,150.1],[601.3,150.0],[616.2,152.6],[620.7,154.8]];
var SEKT_IDX=[48,102];
/* Fart i km/t, 120 verdier jevnt langs rundelengden. R6 = beste runde 22. juli. */
var SPD_R6=[31.5,29.2,26.8,24.3,24.5,26.5,38.2,45.9,44.7,43.5,40.2,38.9,28.3,28.2,26.4,21.3,34.3,40.8,37.8,32.3,33.2,16.2,14.9,16.3,14.4,17.7,29.8,28.3,25.4,21.6,31.0,34.7,34.5,33.8,29.6,31.5,33.3,34.9,28.7,24.4,22.5,17.3,23.2,30.2,30.8,32.6,32.4,31.9,31.2,21.7,15.2,33.1,32.5,29.2,25.7,24.1,27.5,23.8,18.3,27.6,50.5,45.8,45.6,45.4,39.7,38.0,36.1,44.3,60.6,64.1,60.8,54.5,53.5,51.9,26.1,25.5,25.4,24.9,25.2,17.9,11.0,12.0,28.1,30.0,30.7,27.2,24.9,25.0,29.8,29.7,20.5,18.8,22.4,22.4,29.4,30.0,25.6,22.7,25.0,24.5,27.2,30.3,29.1,24.7,23.0,20.4,13.2,46.0,50.6,51.9,52.5,51.0,47.4,38.6,33.2,30.5,48.7,33.6,32.3,24.9];
/* PB-runden 8. august, 2:14.71 — samme bane. */
var SPD_PB=[38.9,39.7,43.3,52.2,56.9,54.7,48.0,45.4,47.5,49.6,48.0,44.2,46.9,51.3,55.4,54.5,56.4,56.2,50.0,43.6,42.0,37.7,29.4,17.4,40.4,50.0,41.2,28.6,34.5,42.0,61.4,55.1,51.1,49.3,42.4,38.1,38.2,44.0,43.4,31.1,27.7,35.4,56.0,57.6,59.6,56.6,50.2,40.3,20.4,22.4,47.5,54.6,61.4,58.8,54.4,43.6,26.9,21.3,49.6,75.5,75.8,73.3,69.3,65.1,58.1,52.5,55.2,63.2,64.3,63.1,59.4,56.7,55.2,49.0,47.1,46.7,37.2,32.4,43.9,50.7,56.6,60.5,53.3,42.3,34.7,36.8,41.9,42.4,33.9,30.3,39.1,28.9,36.2,41.8,45.8,46.2,42.9,49.1,51.7,53.1,58.5,62.2,55.7,48.8,32.1,44.2,48.2,49.8,61.1,67.8,71.3,66.5,57.8,46.5,34.2,37.8,37.1,43.8,46.5,39.1];
/* Beste runde per oekt paa Froland MX 2026. Kun oekter som er verifisert. */
var SESONG=[['2 May',157.65],['23 May',137.84],['22 Jul',212.04],['8 Aug',134.71]];

function fmtT(s){var m=Math.floor(s/60),r=s-m*60;return m+':'+(r<10?'0':'')+r.toFixed(2);}
function spdCol(f){f=Math.max(0,Math.min(1,f));
  var st=[[232,76,61],[245,194,66],[69,208,108]];
  var t=f<0.5?f*2:(f-0.5)*2,a=f<0.5?st[0]:st[1],b=f<0.5?st[1]:st[2];
  return 'rgb('+Math.round(a[0]+(b[0]-a[0])*t)+','+Math.round(a[1]+(b[1]-a[1])*t)+','+
         Math.round(a[2]+(b[2]-a[2])*t)+')';}
function sett(id,html){var e=document.getElementById(id);if(e)e.innerHTML=html;}

var SS=1.80,SOX=-427.44,SOY=116;
function sx(p){return p[0]*SS+SOX;} function sy(p){return p[1]*SS+SOY;}
var tregI=0; for(var q=1;q<SPD_R6.length;q++) if(SPD_R6[q]<SPD_R6[tregI]) tregI=q;
var tregP=POLY[Math.round(tregI/(SPD_R6.length-1)*(POLY.length-1))];

function satSVG(){
  var i,s='<svg viewBox="0 0 1000 1444" preserveAspectRatio="xMidYMid slice" ' +
          'role="img" aria-label="Froland MX sett ovenfra, med GPS-linja fargelagt etter fart" ' +
          'style="width:100%;height:100%;display:block">';
  s+='<defs><filter id="dk"><feColorMatrix type="saturate" values="0.55"/>'+
     '<feComponentTransfer><feFuncR type="linear" slope="0.72"/><feFuncG type="linear" slope="0.72"/>'+
     '<feFuncB type="linear" slope="0.74"/></feComponentTransfer></filter></defs>';
  s+='<image href="/assets/photo/froland-satellitt.jpg" x="0" y="0" width="1000" height="1444" filter="url(#dk)"/>';
  s+='<rect width="1000" height="1444" fill="rgba(8,8,10,.30)"/>';
  var d='M'+sx(POLY[0]).toFixed(1)+','+sy(POLY[0]).toFixed(1);
  for(i=1;i<POLY.length;i++) d+='L'+sx(POLY[i]).toFixed(1)+','+sy(POLY[i]).toFixed(1);
  d+='Z';
  s+='<path d="'+d+'" fill="none" stroke="rgba(0,0,0,.72)" stroke-width="15" stroke-linejoin="round" stroke-linecap="round"/>';
  var mn=1e9,mx=-1e9;
  for(i=0;i<SPD_R6.length;i++){mn=Math.min(mn,SPD_R6[i]);mx=Math.max(mx,SPD_R6[i]);}
  for(i=0;i<POLY.length;i++){
    var j=(i+1)%POLY.length;
    var f=(SPD_R6[Math.round(i/(POLY.length-1)*(SPD_R6.length-1))]-mn)/(mx-mn);
    s+='<line x1="'+sx(POLY[i]).toFixed(1)+'" y1="'+sy(POLY[i]).toFixed(1)+
       '" x2="'+sx(POLY[j]).toFixed(1)+'" y2="'+sy(POLY[j]).toFixed(1)+
       '" stroke="'+spdCol(f)+'" stroke-width="8.5" stroke-linecap="round"/>';
  }
  for(var k=0;k<SEKT_IDX.length;k++){
    var a=POLY[SEKT_IDX[k]],b=POLY[SEKT_IDX[k]+1];
    var ax=sx(a),ay=sy(a),vx=sx(b)-ax,vy=sy(b)-ay,L=Math.hypot(vx,vy)||1,nx=-vy/L,ny=vx/L,r=26;
    s+='<line x1="'+(ax-nx*r).toFixed(1)+'" y1="'+(ay-ny*r).toFixed(1)+'" x2="'+(ax+nx*r).toFixed(1)+
       '" y2="'+(ay+ny*r).toFixed(1)+'" stroke="rgba(0,0,0,.8)" stroke-width="12" stroke-linecap="round"/>';
    s+='<line x1="'+(ax-nx*r).toFixed(1)+'" y1="'+(ay-ny*r).toFixed(1)+'" x2="'+(ax+nx*r).toFixed(1)+
       '" y2="'+(ay+ny*r).toFixed(1)+'" stroke="#F5F5F7" stroke-width="4.5" stroke-linecap="round"/>';
    s+='<text x="'+(ax+nx*(r+30)).toFixed(1)+'" y="'+(ay+ny*(r+30)+10).toFixed(1)+
       '" fill="#F5F5F7" font-family="Barlow Condensed,sans-serif" font-weight="700" font-size="30" '+
       'text-anchor="middle" letter-spacing="2" style="paint-order:stroke" stroke="rgba(0,0,0,.75)" stroke-width="5">S'+(k+2)+'</text>';
  }
  var a0=POLY[0],b0=POLY[1],ax0=sx(a0),ay0=sy(a0);
  var vx0=sx(b0)-ax0,vy0=sy(b0)-ay0,L0=Math.hypot(vx0,vy0)||1,nx0=-vy0/L0,ny0=vx0/L0,sq=9;
  var ang=Math.atan2(vy0,vx0)*180/Math.PI;
  for(var row=0;row<2;row++) for(var col=0;col<6;col++){
    var cx=ax0+nx0*((col-2.5)*sq)+(vx0/L0)*((row-.5)*sq);
    var cy=ay0+ny0*((col-2.5)*sq)+(vy0/L0)*((row-.5)*sq);
    s+='<rect x="'+(cx-sq/2).toFixed(1)+'" y="'+(cy-sq/2).toFixed(1)+'" width="'+sq+'" height="'+sq+
       '" fill="'+(((row+col)%2)?'#F5F5F7':'#0B0B0C')+'" transform="rotate('+ang.toFixed(1)+' '+
       cx.toFixed(1)+' '+cy.toFixed(1)+')"/>';
  }
  /* FINISH legges paa motsatt side av streken enn det tregeste punktet — maalt til
     bare 85 px mellom dem paa denne banen, og da kolliderer utropene. */
  s+='<text x="'+(ax0-nx0*66).toFixed(1)+'" y="'+(ay0-ny0*66+10).toFixed(1)+
     '" fill="#F5F5F7" font-family="Barlow Condensed,sans-serif" font-weight="700" font-size="29" '+
     'text-anchor="middle" letter-spacing="3.4" style="paint-order:stroke" stroke="rgba(0,0,0,.75)" stroke-width="5">FINISH</text>';
  var spx=sx(tregP),spy=sy(tregP);
  s+='<circle cx="'+spx.toFixed(1)+'" cy="'+spy.toFixed(1)+'" r="15" fill="none" stroke="#FF2438" stroke-width="4"/>';
  s+='<circle cx="'+spx.toFixed(1)+'" cy="'+spy.toFixed(1)+'" r="4.5" fill="#FF2438"/>';
  s+='<line x1="'+(spx+14).toFixed(1)+'" y1="'+(spy+7).toFixed(1)+'" x2="'+(spx+62).toFixed(1)+
     '" y2="'+(spy+50).toFixed(1)+'" stroke="#FF2438" stroke-width="3"/>';
  s+='<text x="'+(spx+70).toFixed(1)+'" y="'+(spy+62).toFixed(1)+
     '" fill="#F5F5F7" font-family="Barlow Condensed,sans-serif" font-weight="700" font-size="34" '+
     'letter-spacing="1" style="paint-order:stroke" stroke="rgba(0,0,0,.8)" stroke-width="5">'+
     SPD_R6[tregI].toFixed(0)+' KM/H</text>';
  s+='<text x="'+(spx+70).toFixed(1)+'" y="'+(spy+88).toFixed(1)+
     '" fill="#FF2438" font-family="Barlow Condensed,sans-serif" font-weight="700" font-size="21" '+
     'letter-spacing="2.6" style="paint-order:stroke" stroke="rgba(0,0,0,.8)" stroke-width="4">SLOWEST POINT</text>';
  s+='</svg>';
  return s;
}

function linjeSVG(w,h,serier,opt){
  opt=opt||{};var i,k;
  var mn=opt.min,mx=opt.max;
  if(mn===undefined||mx===undefined){
    var lo=1e18,hi=-1e18;
    for(k=0;k<serier.length;k++) for(i=0;i<serier[k].v.length;i++){
      var v=serier[k].v[i]; if(v==null||isNaN(v)) continue;
      lo=Math.min(lo,v); hi=Math.max(hi,v);}
    if(!isFinite(lo)){lo=0;hi=1;}
    if(mn===undefined)mn=lo; if(mx===undefined)mx=hi;
  }
  if(mx<=mn)mx=mn+1;
  var pad=opt.pad||{l:44,r:14,t:16,b:32}, iw=w-pad.l-pad.r, ih=h-pad.t-pad.b;
  var X=function(f){return pad.l+f*iw;}, Y=function(v){return pad.t+ih-(v-mn)/(mx-mn)*ih;};
  var s='<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Fartskurve langs runden" style="width:100%;height:auto;display:block">';
  for(i=0;i<=3;i++){
    var yv=mn+(mx-mn)*i/3,y=Y(yv);
    s+='<line x1="'+pad.l+'" y1="'+y.toFixed(1)+'" x2="'+(w-pad.r)+'" y2="'+y.toFixed(1)+'" stroke="#1C1C22"/>';
    s+='<text x="'+(pad.l-9)+'" y="'+(y+4).toFixed(1)+'" fill="#5A5A63" font-size="11" text-anchor="end" font-family="-apple-system,sans-serif">'+Math.round(yv)+'</text>';
  }
  if(opt.sekt){
    var fr=[0.3278,0.6667],nm=['S1','S2','S3'];
    for(i=0;i<fr.length;i++)
      s+='<line x1="'+X(fr[i]).toFixed(1)+'" y1="'+pad.t+'" x2="'+X(fr[i]).toFixed(1)+'" y2="'+(pad.t+ih)+
         '" stroke="#33333B" stroke-dasharray="4 4"/>';
    var mids=[fr[0]/2,(fr[0]+fr[1])/2,(fr[1]+1)/2];
    for(i=0;i<3;i++)
      s+='<text x="'+X(mids[i]).toFixed(1)+'" y="'+(h-8)+'" fill="#6C6C74" font-size="12" text-anchor="middle" '+
         'font-family="Barlow Condensed,sans-serif" font-weight="700" letter-spacing="2.4">'+nm[i]+'</text>';
  }
  for(k=0;k<serier.length;k++){
    var vv=serier[k].v,d='';
    for(i=0;i<vv.length;i++) d+=(i?'L':'M')+X(i/(vv.length-1)).toFixed(1)+','+Y(vv[i]).toFixed(1);
    s+='<path d="'+d+'" fill="none" stroke="'+serier[k].c+'" stroke-width="'+(serier[k].w||2.2)+
       '" stroke-linejoin="round" stroke-linecap="round"'+
       (serier[k].dash?' stroke-dasharray="'+serier[k].dash+'"':'')+'/>';
  }
  if(opt.tegnforklaring){
    var lx=pad.l+6,ly=pad.t+4;
    for(k=0;k<serier.length;k++){
      s+='<line x1="'+lx+'" y1="'+ly+'" x2="'+(lx+22)+'" y2="'+ly+'" stroke="'+serier[k].c+
         '" stroke-width="2.6"'+(serier[k].dash?' stroke-dasharray="'+serier[k].dash+'"':'')+'/>';
      s+='<text x="'+(lx+30)+'" y="'+(ly+4)+'" fill="#9B9BA3" font-size="12" '+
         'font-family="Barlow Condensed,sans-serif" font-weight="700" letter-spacing="1.6">'+serier[k].n+'</text>';
      lx+=30+String(serier[k].n).length*6.4+26;
    }
  }
  s+='</svg>'; return s;
}

function sesongSVG(w,h,pts,opt){
  opt=opt||{};var i,mn=1e18,mx=-1e18;
  for(i=0;i<pts.length;i++){mn=Math.min(mn,pts[i][1]);mx=Math.max(mx,pts[i][1]);}
  var sp=mx-mn;mn-=sp*.30;mx+=sp*.18;
  var pad={l:opt.l||16,r:opt.r||16,t:36,b:34},iw=w-pad.l-pad.r,ih=h-pad.t-pad.b;
  var X=function(i){return pad.l+i/(pts.length-1)*iw;},Y=function(v){return pad.t+ih-(v-mn)/(mx-mn)*ih;};
  var best=1e18;for(i=0;i<pts.length;i++)best=Math.min(best,pts[i][1]);
  var s='<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Beste runde per oekt gjennom sesongen" style="width:100%;height:auto;display:block">';
  s+='<line x1="'+pad.l+'" y1="'+Y(best).toFixed(1)+'" x2="'+(w-pad.r)+'" y2="'+Y(best).toFixed(1)+
     '" stroke="#E30613" stroke-width="1.3" stroke-dasharray="5 4"/>';
  s+='<text x="'+(w-pad.r)+'" y="'+(Y(best)-10).toFixed(1)+'" fill="#E30613" text-anchor="end" '+
     'font-family="Barlow Condensed,sans-serif" font-weight="700" font-size="'+(opt.fs||14)+'" letter-spacing="2">PB '+fmtT(best)+'</text>';
  var d='';for(i=0;i<pts.length;i++) d+=(i?'L':'M')+X(i).toFixed(1)+','+Y(pts[i][1]).toFixed(1);
  s+='<path d="'+d+'" fill="none" stroke="#D8D8DC" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>';
  for(i=0;i<pts.length;i++){
    var b=pts[i][1]===best;
    s+='<circle cx="'+X(i).toFixed(1)+'" cy="'+Y(pts[i][1]).toFixed(1)+'" r="'+(b?7:4.6)+'" fill="'+
       (b?'#E30613':'#D8D8DC')+'" stroke="#08080A" stroke-width="2.6"/>';
    s+='<text x="'+X(i).toFixed(1)+'" y="'+(h-9)+'" fill="#6C6C74" font-size="'+(opt.fs2||13)+
       '" text-anchor="middle" font-family="-apple-system,sans-serif">'+pts[i][0]+'</text>';
    s+='<text x="'+X(i).toFixed(1)+'" y="'+(Y(pts[i][1])-15).toFixed(1)+'" fill="'+(b?'#E30613':'#9B9BA3')+
       '" font-size="'+(opt.fs||14)+'" text-anchor="middle" font-family="Barlow Condensed,sans-serif" '+
       'font-weight="700" letter-spacing=".6">'+fmtT(pts[i][1])+'</text>';
  }
  s+='</svg>'; return s;
}

function stolper(rows){
  var mx=0,i;for(i=0;i<rows.length;i++)mx=Math.max(mx,rows[i][1]);
  var s='';
  for(i=0;i<rows.length;i++){var r=rows[i];
    s+='<div class="bar"><span class="nm">'+r[0]+'</span>'+
       '<span class="tr"><i style="width:'+(r[1]/mx*100).toFixed(1)+'%"></i></span>'+
       '<span class="vl">'+r[1].toFixed(2)+'</span></div>';}
  return s;
}

/* ── tegn ── */
(function(){
  sett('satKart', satSVG());
  sett('sektStolper', stolper([['S1',42.82],['S2',42.68],['S3',44.36]]));
  sett('fartGraf', linjeSVG(1240,330,[
    {v:SPD_R6,c:'#F5F5F7',w:2.0,dash:'7 5',n:'LAP 6 — 3:32.04'},
    {v:SPD_PB,c:'#FF2438',w:2.8,n:'YOUR BEST — 2:14.71'}
  ],{sekt:true,min:0,tegnforklaring:true}));
  sett('sesongGraf', sesongSVG(1240,360,SESONG,{l:60,r:60,fs:17,fs2:14}));
})();
