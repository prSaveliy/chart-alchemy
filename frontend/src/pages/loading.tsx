import { ScaleLoader } from 'react-spinners';

export const Loading = (props: { message: string }) => {
  return (
    <div>
      <div className='flex min-h-screen items-center justify-center'>
        <ScaleLoader height={20} width={4} margin={1} />
        <span className="text-xl ml-2 font-semibold">
          {props.message}
        </span>
      </div>
    </div>
  )
}
