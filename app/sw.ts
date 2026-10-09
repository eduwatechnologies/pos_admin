import { Serwist } from 'serwist'

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  fallbackEntries: [
    {
      url: '/offline',
      matcher: ({ request }) => request.mode === 'navigate',
    },
  ],
  navigationPreload: true,
  skipWaiting: true,
  clientsClaim: true,
})

serwist.addEventListeners()