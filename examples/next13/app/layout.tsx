
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
      <meta name="viewport" 
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
      </head>
      <body>
        <>
          {children}
        </>
      </body>
    </html>
  );
}
