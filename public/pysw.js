addEventListener('install', () => {
  self.skipWaiting();
});
addEventListener('activate', () => {
  self.clients.claim();
});

var inputPromiseResolve = null;
var debugPromiseResolve = null;

addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (u.pathname === '/@input@/req.js') {
		e.respondWith(new Promise(function(resolve) {
			if (inputPromiseResolve != null) {
				inputPromiseResolve()
			}
			inputPromiseResolve = resolve;
		}));
  }
  else if (u.pathname === '/@input@/resp.js') {
	e.respondWith(new Promise(r => 
		e.request.clone().json().then(data => {
			let local = inputPromiseResolve;
			inputPromiseResolve = null;
			if (local) {
				local(new Response(JSON.stringify(data), {status:200}));
			}
			r(new Response(null,{status:200}));
		})
	));
  }
  else if (u.pathname === '/@debug@/break.js') {
	e.respondWith(new Promise(function(resolve) {
		if (debugPromiseResolve != null) {
			debugPromiseResolve()
		}
		debugPromiseResolve = resolve;
	}));
	}
  else if (u.pathname === '/@debug@/continue.js') {
	e.respondWith(new Promise(r => 
		e.request.clone().json().then(data => {
			let local = debugPromiseResolve;
			debugPromiseResolve = null;
			if (local) {
				local(new Response(JSON.stringify(data), {status:200}));
			}
			r(new Response(null,{status:200}));
		})
	));
  }
  else if (u.pathname === '/@sleep@/sleep.js') {
	  e.respondWith(new Promise(r => {
		  const t = new URLSearchParams(u.search).get('time');
		  const response = new Response(null, {status: 304});
		  setTimeout(r, t*1000, response);
	  }))
  }
});