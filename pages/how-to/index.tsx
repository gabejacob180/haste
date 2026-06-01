import { Layout } from '../components/Layout'

export default function How_to() {
  return (
    <Layout>
      <div className="flex-col gap-y-2 text-center">
        <div className="text-[48px] underline mb-[40px] text-[#303030]">
          How-to
        </div>
        <h1 className="text-[40px] text-[#303030] leading-[72px] w-[95%] m-auto">
          Everyone is a creature of habit. This site is made to give you the
          perspective of your routines and your goals to bring them into
          alignment.
        </h1>

        <ol
          className="text-left whitespace-normal text-[36px] text-[#303030] leading-[90px] w-[95%] ml-[110px] mt-[40px] pb-[30px]"
          type="1"
        >
          <li>
            1. Start by listing your daily tasks along with their time frames in
            planning view
          </li>
          <li>
            2. During, or by the end of the day, copy schedule to the daily
            review and record how your time was spent
          </li>
          <li>
            3. Click review to calculate the divergence between your plan and
            review
          </li>
          <li className="ml-[50px]">
            * If divergence is too great, plan more reasonably according to your
            capabilities
          </li>
          <li className="ml-[50px]">
            * If divergence is minimal, consider implementing more routines and
            tasks to fill your time
          </li>
          <li>
            4. Set your daily routines as recurring tasks with recursion type,
            start times and durations
          </li>
          <li>5. List your other activities and goals on lists page</li>
        </ol>
      </div>
    </Layout>
  )
}
