console.log("Sw; limpio");
let ubicacion = self.location.href
let URL = '/20213-PWA-U2-P5/sw.js'

const CACHE_NAME = 'cache-v1'
const CACHE_DYNAMIC_NAME = 'dynamic-v1'
const CACHE_STATIC_NAME = 'static-v3'
const CACHE_INMUTABLE_NAME = 'inmutable_v1'

const cleanCache = (name, sizeItems) => {
    caches.open(name).then(cache => {
        cache.keys().then(keys => {
            console.log(keys)
            if(keys.length > sizeItems) {
                cache.delete(keys[0]).then(() => {
                    cleanCache(name, sizeItems)
                })
            }
        })
    })
}

self.addEventListener('install', event => {

    if(ubicacion.includes('localhost')){
        URL = '/'
    }
    navigator.serviceWorker.register(swDirect);

    const promesa = caches.open(CACHE_STATIC_NAME)
        .then(cache => {
            return cache.addAll([
                URL,
                URL + 'index.html', 
                URL + 'css/page.css',
                URL + 'img/1.png',
                URL + 'js/app.js',
                URL + 'views/offline.html',
                URL + 'img/noFound.jpg'
            ])
        });

    const promesaInmu = caches.open(CACHE_INMUTABLE_NAME)
    .then(cache => {
        return cache.addAll([
            'https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css'
        ])
    });

    event.waitUntil(Promise.all([promesa, promesaInmu]));
})

self.addEventListener('activate', event => {
    const response = caches.keys().then(keys => {
        keys.forEach(key => {
            if(key !== CACHE_STATIC_NAME && key.includes('static')){
                return caches.delete(key);
            }
        })
    })

    event.waitUntil(response)
})

self.addEventListener('fetch', event => {
    //1. Only chaché
    // event.respondWith(caches.match(event.request))

    //2. Caché with network fallback
    // Primero va a buscar en caché y sino lo encuentra va a la red

    const respuesta = caches.match(event.request)
        .then(response => {
            if(response) return response

            console.log("No está en chaché")
            return fetch(event.request)
                .then(res => {
                    caches.open(CACHE_DYNAMIC_NAME).then(cache => cache.put(event.request, res).then(() => {
                        cleanCache(CACHE_DYNAMIC_NAME, 5)
                    }))
                    
                    return res.clone()
                })
        }).catch(error => {
            console.log("Error al solicitar recurso");
            if(event.request.headers.get('accept').includes('text/html')){
                return caches.match('/views/offline.html')
            }
            
            if(event.request.headers.get('accept').includes('image/')){
                return caches.match('/img/noFound.jpg')
            }
        })

        event.respondWith(respuesta)

    //3. Network with caché fallback

    // const respuesta = fetch(event.request).then(response => {

    //     if(!response){
    //         return caches.match(event.request);
    //     }

    //     caches.open(CACHE_DYNAMIC_NAME).then(cache => {
    //         cache.put(event.request, response);
    //         cleanCache(CACHE_DYNAMIC_NAME, 5)
    //     })
    //     return response.clone()
    // }).catch(error => {
    //     return caches.match(event.request);
    // });

    // event.respondWith(respuesta)
})