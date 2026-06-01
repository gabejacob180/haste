import { Header } from 'components/Header'
import { Sidebar } from 'components/Sidebar'
import { useEffect, useRef, useState } from 'react'

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isNavOpen, setIsNavOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [favicon, setFavicon] = useState<any | null>(null)

  function handleClick() {
    setIsNavOpen(!isNavOpen)
  }

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
    <div className='max-w-screen flex min-h-screen w-full justify-start overflow-y-auto overflow-x-hidden'>
      {favicon}

      {/* Content component */}
      <div
        className={`content ${isNavOpen ? 'w-[85vw]' : 'w-full'} flex-start h-full shrink shrink-0 flex-col duration-[500ms] ease-in-out`}
        ref={contentRef}
      >
        {/* Overlay to click out of sidebar */}
        <div
          className={`overlay z-999 fixed left-0 top-0 h-full w-full opacity-0 ${isNavOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
          onClick={handleClick}
        />

        {/* Navbar component */}
        <Header
          sign_in_Bool={true}
          navBool={isNavOpen}
          setNavBool={setIsNavOpen}
        />
        {children}
      </div>

      {/* Sidebar component */}
      <Sidebar
        navBool={isNavOpen}
        setNavBool={setIsNavOpen}
        contentRef={contentRef}
      />
    </div>
  )
}
