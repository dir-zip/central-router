# 🍄 1uprouter

A server side router for the react server components era.

An experiment brought to you by [1upsaas](https://1upsaas.com), a nextjs saas boilerplate. Build your saas at the speed of thought.

## Getting started
Install the package

```shell
npm install @1upsaas/1uprouter
```

Then create the following files:

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

## Notes

Because of the nature of this library, it can only be used with a server. Since there is only 1 wildcard route, static exports will not work (for now). We can explore this with a generator that reads your routes.