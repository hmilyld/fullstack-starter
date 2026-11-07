import { RouterProvider } from "react-router"

import { UnsupportedViewport } from "@/components/unsupported-viewport"
import { useMediaQuery } from "@/hooks/use-media-query"
import { router } from "@/router"

export function App() {
  const isSupported = useMediaQuery("(min-width: 768px)")

  if (!isSupported) {
    return <UnsupportedViewport />
  }

  return <RouterProvider router={router} />
}

export default App
