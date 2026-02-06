export const getErrorText = (err) => {
  if (!err) return 'Unknown error'
  if (typeof err === 'string') return err

  if (err.response?.data) {
    const data = err.response.data
    if (typeof data === 'string') return data
    if (data.error) return data.error
    if (data.message) return data.message
    if (data.detail) return data.detail
    if (Array.isArray(data.errors)) return data.errors.join(', ')
    try {
      return JSON.stringify(data)
    } catch (e) {
      return 'Unknown error'
    }
  }

  if (err.error && typeof err.error === 'string') return err.error
  if (err.message && typeof err.message === 'string') return err.message

  try {
    return JSON.stringify(err)
  } catch (e) {
    return String(err)
  }
}
