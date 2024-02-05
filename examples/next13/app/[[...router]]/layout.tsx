import router from '../../lib/router'

export default async function Layout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { "router": string[] }
}) {
  return await router.initLayout({children, pathArray: params.router})
}

