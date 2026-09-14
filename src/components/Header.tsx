interface HeaderProps {
  title: string
  back?: boolean
  right?: React.ReactNode
  bottom?: React.ReactNode
}

export function Header({ title, back, right, bottom }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/60 bg-stone-50/90 backdrop-blur">
      <div className="mx-auto flex h-13 max-w-lg items-center gap-1 px-3">
        {back ? <BackButton /> : null}
        <h1 className="min-w-0 flex-1 truncate text-[17px] font-semibold text-stone-800">
          {title}
        </h1>
        {right}
      </div>
      {bottom}
    </header>
  )
}

function BackButton() {
  return (
    <button
      type="button"
      onClick={() => history.back()}
      aria-label="返回"
      className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-stone-500 active:bg-stone-200"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5.5 w-5.5"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
    </button>
  )
}
