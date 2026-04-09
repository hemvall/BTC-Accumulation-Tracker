import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useBitcoinPrice() {
  const { data, error, isLoading, mutate } = useSWR<{ price: number }>(
    '/api/bitcoin-price',
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
    }
  )

  return {
    price: data?.price ?? null,
    isLoading,
    isError: error,
    refresh: mutate,
  }
}
