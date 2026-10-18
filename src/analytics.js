// Public GA4 measurement IDs only. Both destinations share one Google tag loader.
(()=>{
 const ids=['G-DC7N6KQBG0','G-5YW0T2C109'];
 if(['localhost','127.0.0.1','::1'].includes(location.hostname)||location.protocol==='file:')return;
 window.dataLayer=window.dataLayer||[];
 window.gtag=function(){window.dataLayer.push(arguments);};
 window.gtag('js',new Date());
 for(const id of ids)window.gtag('config',id);
 const script=document.createElement('script');script.async=true;
 script.src='https://www.googletagmanager.com/gtag/js?id='+ids[0];
 document.head.append(script);
})();
