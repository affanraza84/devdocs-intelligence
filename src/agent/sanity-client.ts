import { createClient } from '@sanity/client'
import { config, getSanityReadToken } from './config'

export function getSanityDirectClient() {
  const token = getSanityReadToken()
  return createClient({
    projectId: config.sanity.projectId,
    dataset: config.sanity.dataset,
    apiVersion: config.sanity.apiVersion,
    useCdn: false,
    token,
  })
}
