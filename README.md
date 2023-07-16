# 1uprouter

A nextjs router for the react server components era

## Getting started

```shell
npm install @1upsaas/1uprouter
```
`lib/router.tsx`
```ts
import Router from "@1upsaas/1uprouter";
const router = new Router();
export default router
```

`app/[[...1up]]/layout.tsx`
```tsx
import router from '../../lib/router'

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return await router.initLayout({children})
}
```

`app/[[...1up]]/page.tsx`

```tsx
import router from "../../lib/router";

export default async function Page({params}: {params: {"1up": string[]} }) {
  const getParams = params["1up"];

  router.addRoute("/", async() => {
    return <div>This is a test without a layout</div>
  })
  
  return router.init(getParams);
}
```