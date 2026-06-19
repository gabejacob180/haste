import useWindowDimensions from '@/components/functions/useWindowDimensions'
import { links } from '@/data.js'
import CloseIcon from '@mui/icons-material/Close'
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
            className={`z-1000 relative w-[20vw] h-[${height > windowDimesions.height! ? height + 'px' : '100%'}] flex justify-start border-r bg-gray-50 shadow-md duration-[500ms] ease-in-out`}
        >
            <nav className='mt-5 flex list-none flex-col gap-7 text-black'>
                {links.map((link) => (
                    <li key={link.index}>
                        <Link
                            className={
                                'm-7 cursor-pointer text-5xl hover:underline'
                            }
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
