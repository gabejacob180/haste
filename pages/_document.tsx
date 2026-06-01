import { Head, Html, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang='en'>
      <Head>
        <link rel='icon' href='./favicon.ico' type='image/ico' sizes='48x48' />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
