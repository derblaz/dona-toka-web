import { QueryClient, focusManager } from '@tanstack/react-query'

export const queryClient = new QueryClient()

/**
 * Re-evaluates focus on window focus as well as tab visibility, so public
 * catalog queries revalidate when the shopper returns to the storefront.
 * The no-argument call notifies listeners on every event.
 */
focusManager.setEventListener((handleFocus) => {
  const onFocusChange = () => handleFocus()

  window.addEventListener('focus', onFocusChange)
  document.addEventListener('visibilitychange', onFocusChange)
  return () => {
    window.removeEventListener('focus', onFocusChange)
    document.removeEventListener('visibilitychange', onFocusChange)
  }
})
