import Link from "next/link";
import router from "../../lib/router";


export async function generateMetadata({ params }: { params: { router: string[] } }) {
  const getParams = params["router"];

  const meta = router.generateMetadata(getParams);
  return meta;
}


export default async function Page({ params }: { params: { "router": string[] } }) {
  const getParams = params["router"];



  await router.createLayout("/*", async ({ children }) => {
    return (
      <div>
        <h1>Wildcard Layout</h1>
        {children}

      </div>
    )
  })

  await router.createLayout("/admin/*", async ({ children }) => {
    return (
      <div>
        <h1>Admin Layout</h1>
        {children}
      </div>
    )
  })

  await router.createLayout("/special", async ({ children }) => {
    return (
      <div>
        <h1>Special Layout</h1>
        {children}
      </div>
    )
  })

  router.addRoute("/", async () => {
    return <div>This is a test without a layout<Link href="/admin">Admin</Link>        <Link href="/special">Special Page</Link></div>
  }, "page", async () => {
    return {
      title: "Test"
    }
  })

  router.addRoute("/special", async () => {
    return <div>This is a special page<Link href="/admin">Admin</Link></div>
  }, "page", async () => {
    return {
      title: "Special Page"
    }
  })

  await router.createLayout('/:slug/*', async ({ children }) => {
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

  router.addRoute('/admin', async () => {
    return <div>Admin page<Link href="/">Home</Link></div>
  })

  router.addRoute("/billing/webhook", async (_, request) => {
    console.log(request?.nextUrl)
    return new Response("hello", { status: 200 })
  }, "api:GET")






  return router.init(getParams);

}
