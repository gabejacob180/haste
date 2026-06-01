import { Dispatch, SetStateAction } from 'react'

interface Props {
  navBool: Boolean
  setNavBool: Dispatch<SetStateAction<boolean>>
  visibility: Boolean
}
export const Button = ({ navBool, setNavBool, visibility }: Props) => {
  function handleClick() {
    setNavBool(!navBool)
  }

  return (
    <button
      className={`${visibility ? '' : 'hidden'} relative top-0 ml-auto mt-2 mr-2 p-3 self-start z-1000`}
      key={'button'}
      onClick={handleClick}
    >
      <div className='fill-white w-[65px] h-[6px] shadow-[0_0_3px_#b9b9b9]'></div>
      <div className='fill-white w-[65px] h-[6px] mt-[12px] shadow-[0_0_3px_#b9b9b9]'></div>
      <div className='fill-white w-[65px] h-[6px] mt-[12px] shadow-[0_0_3px_#b9b9b9]'></div>
    </button>
  )
}
