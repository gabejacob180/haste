import Link from 'next/link'
import { Dispatch, SetStateAction } from 'react'
import { Button } from './Button'

interface Props {
  navBool: Boolean
  setNavBool: Dispatch<SetStateAction<boolean>>
  sign_in_Bool: Boolean
}

export const Header = ({ navBool, setNavBool, sign_in_Bool }: Props) => {
  return (
    <nav className='flex w-full'>
      <Link
        className='z-1000 relative mr-auto flex'
        href='/'
        onClick={() => setNavBool(false)}
        prefetch={false}
      >
        {/* Logo div */}
        <img
          src='/Assets/Group_8.png'
          className='top-0 ml-3 h-auto w-[65px]'
          alt='img'
        />

        {/* Site name header */}
        <h2 className='ml-[6px] mt-[22px] font-DM_Serif_Text text-5xl text-green-600'>
          haste
        </h2>
      </Link>
      <Button
        visibility={sign_in_Bool}
        navBool={navBool}
        setNavBool={setNavBool}
      />
    </nav>
  )
}
