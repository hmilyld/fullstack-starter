import { RouterProvider } from "react-router"
import { router } from "@/router"
import { UnsupportedViewport } from "@/components/unsupported-viewport"

export function App() {
  return (
    <>
      <UnsupportedViewport />
      <div className="hidden md:block">
        <RouterProvider router={router} />
      </div>
    </>
  )
}

export default App
