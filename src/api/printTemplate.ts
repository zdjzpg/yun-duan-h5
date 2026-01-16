import { post } from '@/services/request'

export interface PrintTemplateItem {
  Uid: number
  Name: string
}

const PRINT_TEMPLATE_LIST_URL = '/Ticketing/PrintTemplate/List'

export async function fetchPrintTemplates(): Promise<PrintTemplateItem[]> {
  return post<PrintTemplateItem[]>(PRINT_TEMPLATE_LIST_URL, {})
}
