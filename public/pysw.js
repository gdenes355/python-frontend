addEventListener('install', () => {
  self.skipWaiting()
})
addEventListener('activate', () => {
  self.clients.claim()
})

let inputPromiseResolve = null
let debugPromiseResolve = null
let sleepPromiseResolve = null
let sleepTimeout = null
let turtlePromiseResolve = null
let turtleResolveAheadCount = 0  // how many promises have been resolved that we haven't even seen

// handle messages from TS
addEventListener('message', (event) => {
  //turtleResolveAheadCount = 0;
  let data = event.data
  if (data.cmd === 'ps-reset' || data.cmd === 'ps-prerun') {
    turtleResolveAheadCount = 0
    if (debugPromiseResolve != null) {
      debugPromiseResolve(new Response('{}', { status: 200 }))
      debugPromiseResolve = null
    }
    if (inputPromiseResolve != null) {
      inputPromiseResolve(new Response('{}', { status: 200 }))
      inputPromiseResolve = null
    }
    clearTimeout(sleepTimeout)
    if (sleepPromiseResolve !== null) {
      sleepPromiseResolve(new Response(null, { status: 304 }))
      sleepPromiseResolve = null
    }
    if (turtlePromiseResolve !== null) {
      turtlePromiseResolve(new Response(null, { status: 304 }))
      turtlePromiseResolve = null
    }            
  } else if (data.cmd === 'ps-turtle-resp') {
    const local = turtlePromiseResolve
    turtlePromiseResolve = null
    if (local) {
      local(new Response(JSON.stringify(data), { status: 200 }))
    } else {
      //this seems very unlikely, but if the turtle command
      // was so easy to complete (e.g. state update), TS might have
      // issued a response before a request was received
      // if this happened, then 
      turtleResolveAheadCount += 1
    }
  } else if (data.cmd === 'ps-input-resp') {
    const local = inputPromiseResolve
    inputPromiseResolve = null
    if (local) {
      local(new Response(JSON.stringify(data), { status: 200 }))
    }
  } else if (data.cmd === 'ps-debug-continue') {
    
    const local = debugPromiseResolve
    debugPromiseResolve = null
    if (local) {
      local(new Response(JSON.stringify(data), { status: 200 }))
    }
  }
});

// proxy fetch requests, mostly to catch requests from Python
addEventListener('fetch', e => {
  const u = new URL(e.request.url)
  if (u.pathname === '/@input@/req.js') {
    e.respondWith(new Promise(function (resolve) {
      if (inputPromiseResolve != null) {
        inputPromiseResolve()
      }
      inputPromiseResolve = resolve
    }))
  } else if (u.pathname === '/@turtle@/req.js') {
    e.respondWith(new Promise(function (resolve) {
      if (turtleResolveAheadCount > 0) {
        turtleResolveAheadCount--;
        resolve(new Response(null, { status: 200 }))
        return
      }
      if (turtlePromiseResolve != null) {
        turtlePromiseResolve()
      }
      turtlePromiseResolve = resolve
    }))
  } else if (u.pathname === '/@debug@/break.js') {
    e.respondWith(new Promise(function (resolve) {
      if (debugPromiseResolve != null) {
        debugPromiseResolve()
      }
      debugPromiseResolve = resolve
    }))
  } else if (u.pathname === '/@sleep@/sleep.js') {
    const local = sleepPromiseResolve
    sleepPromiseResolve = null
    if (local !== null) {
      local()
    }
    if (sleepTimeout) {
      clearTimeout(sleepTimeout)
    }
    e.respondWith(new Promise(r => {
		  sleepPromiseResolve = r
    }))
    const t = new URLSearchParams(u.search).get('time')
    sleepTimeout = setTimeout(sleepPromiseResolve, t * 1000, new Response(null, { status: 304 }))
  } else if (e.request.cache === 'only-if-cached' && e.request.mode !== 'same-origin') {

  } else if (e.request.url.includes('bk=') || e.request.url.includes('book=') || (e.request.url.includes('coop=1')) || e.request.url.includes('pyworker_sw.js') || u.pathname?.startsWith("/static")) {
    e.respondWith(
      fetch(e.request)
		  .then(function (response) {
          // It seems like we only need to set the headers for index.html
          // If you want to be on the safe side, comment this out
          // if (!response.url.includes("index.html")) return response;

          const newHeaders = new Headers(response.headers)
          newHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp')
          newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin')

          const moddedResponse = new Response(response.body, {
			  status: response.status,
			  statusText: response.statusText,
			  headers: newHeaders
          })

          return moddedResponse
        })
        .catch(function (e) {
          console.error(e)
        })
	  )
  }
})
