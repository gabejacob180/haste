import { useEffect, useState } from 'react'
import { Header } from './Header'

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [favicon, setFavicon] = useState<any | null>(null)

  useEffect(() => {
    setFavicon(
      <link
        rel='icon'
        href='/Assets/logo.png'
        type='image/png'
        sizes='1024x1024'
      />
    )
  }, [])

  return (
    <div className='max-w-screen flex min-h-screen w-full flex-col overflow-y-auto overflow-x-hidden'>
      {favicon}

      {/* Navbar component */}
      <Header
        sign_in_Bool={false}
        navBool={isNavOpen}
        setNavBool={setIsNavOpen}
      />
      {children}
    </div>
  )
}
