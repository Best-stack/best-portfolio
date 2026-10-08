import { aboutPage } from './aboutPage'
import { homePage } from './homePage'
import { caseSection, project } from './project'
import { siteSettings } from './siteSettings'

export const schemaTypes = [siteSettings, homePage, aboutPage, project, caseSection]

/** Documents that exist exactly once, edited from fixed items in the Studio sidebar. */
export const singletonTypes = new Set(['siteSettings', 'homePage', 'aboutPage'])
