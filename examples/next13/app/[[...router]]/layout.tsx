import router from '../../lib/router'

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return await router.initLayout({children})
}