import router from "../../lib/router";

export default async function Page({params}: {params: {"1up": string[]} }) {
  const getParams = params["1up"];

  await router.createLayout("/admin/*", async({children}) => {
    return (
      <div>
        <h1>Admin Layout</h1>
        {children}
      </div>
    )
  })

  await router.createLayout('/:slug/*', async({children}) => {
    return (
      <div>
        <h1>Slug parameter layout</h1>
        {children}
      </div>
    );
  })

  router.addRoute("/:slug", async (params) => {
    return <div>{params.slug}</div>
  })

  router.addRoute("/:slug/nested", async (params) => {
    return <div>{params.slug} Nested</div>;
  });

  router.addRoute('/admin', async() => {
    return <div>Admin page</div>
  })
  
  router.addRoute("/billing/webhook", async (_, request) => {
    console.log(request.nextUrl)
    return new Response("hello", { status: 200 })
  }, "api:GET")

  router.addRoute("/", async() => {
    return <div>This is a test without a layout</div>
  })




  return router.init(getParams);

}
