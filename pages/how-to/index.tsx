'use client'
import { Layout } from '../components/Layout'

export default function How_to() {
    return (
        <Layout>
            <div className='flex-col gap-y-2 text-center'>
                <div className='mb-[40px] text-[48px] text-[#303030] underline'>
                    How-to
                </div>
                <h1 className='m-auto w-[95%] text-[40px] leading-[72px] text-[#303030]'>
                    Everyone is a creature of habit. This site is made to give
                    you the perspective of your routines and your goals to bring
                    them into alignment.
                </h1>

                <ol
                    className='ml-[110px] mt-[40px] w-[95%] whitespace-normal pb-[30px] text-left text-[36px] leading-[90px] text-[#303030]'
                    type='1'
                >
                    <li>
                        1. Start by listing your daily tasks along with their
                        time frames in planning view
                    </li>
                    <li>
                        2. During, or by the end of the day, copy schedule to
                        the daily review and record how your time was spent
                    </li>
                    <li>
                        3. Click review to calculate the divergence between your
                        plan and review
                    </li>
                    <li className='ml-[50px]'>
                        * If divergence is too great, plan more reasonably
                        according to your capabilities
                    </li>
                    <li className='ml-[50px]'>
                        * If divergence is minimal, consider implementing more
                        routines and tasks to fill your time
                    </li>
                    <li>
                        4. Set your daily routines as recurring tasks with
                        recursion type, start times and durations
                    </li>
                    <li>
                        5. List your other activities and goals on lists page
                    </li>
                </ol>
            </div>
        </Layout>
    )
}
