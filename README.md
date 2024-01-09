# Central Router 

A server side router for the react server components era.

An experiment brought to you by dir.zip 

## Getting started
Install the package

```shell
npm install @dir.zip/central-router
```

Then create the following files:

`lib/router.tsx`
```ts
import Router from "@dir.zip/central-router";
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

`app/api/[[...1up]]/route.ts`

```ts
import router from '../../lib/router';

const routes = router.initApiRoute()
export const { GET, POST, PUT, DELETE, PATCH } = routes;
```

## Functions

### `addRoute(path, handler, type)`

You can add routes inside the catch all page that you initially created. You can either create a route that returns a JSX element or a Response for api routes.

### Params

| Name | Description |
| --- | --- |
| path | The path for a route. Can contain url parameters like `/:slug`. These are fully typed.|
| handler | An async function that either returns a JSX element or Response. |
| type | Can either be a page or api route. |

The type accepts a string of either `page` or (`api:GET` | `api:POST` | `api:PATCH` | `api:DELETE` | `api:PUT`)

If you use any of the api types, the path will automatically be prefixed with `/api/...`. By default, if you don't provide a type it will be considered a page and expect a JSX element.

### `createLayout(path, handler)`

Wrap routes with a layout. Set the path for which routes the layout should wrap. Accepts an async function that returns a JSX element. For example, you can use layouts to check auth status.

__🥸 Tip for you: You can wrap api routes by creating a layout with the path set to `/api/*`__

### Params
| Name | Description |
| --- | --- |
| path | The path for a route. Can contain url parameters like `/:slug`, and wildcards like `/:slug/*`|
| handler | An async function that either returns a JSX element |



## Notes

- Because of the nature of this library, it can only be used with a server. Since there is only 1 wildcard route, static exports will not work (for now). We can explore this with a generator that reads your routes.
- You must use the `[[..1up]]` folder names
