import CloseIcon from '@mui/icons-material/Close'
import useWindowDimensions from 'components/functions/useWindowDimensions'
import { links } from 'data.js'
import Link from 'next/link'
import { Dispatch, RefObject, SetStateAction, useEffect, useState } from 'react'

interface Props {
  navBool: Boolean
  setNavBool: Dispatch<SetStateAction<boolean>>
  contentRef: RefObject<HTMLDivElement>
}

export const Sidebar = ({ navBool, setNavBool, contentRef }: Props) => {
  let windowDimesions = useWindowDimensions()
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (contentRef.current?.clientHeight != null) {
      setHeight(contentRef.current?.clientHeight)
    }
  }, [contentRef])

  function handleClick() {
    setNavBool(!navBool)
  }

  return (
    <aside
      className={`relative z-1000 w-[20vw] h-[${height > windowDimesions.height! ? height + 'px' : '100%'}] bg-gray-50 justify-start flex ease-in-out duration-[500ms] border-r shadow-md`}
    >
      <nav className='flex flex-col mt-5 gap-7 list-none text-black'>
        {links.map((link) => (
          <li key={link.index}>
            <Link
              className={'text-5xl m-7 hover:underline cursor-pointer'}
              href={link.link}
              onClick={handleClick}
              prefetch={false}
            >
              {link.text}
            </Link>
          </li>
        ))}
      </nav>

      <CloseIcon
        className='m-2 ml-auto cursor-pointer'
        fontSize='large'
        color='disabled'
        onClick={handleClick}
      ></CloseIcon>
    </aside>
  )
}
