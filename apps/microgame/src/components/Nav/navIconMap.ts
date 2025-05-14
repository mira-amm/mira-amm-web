import { CollectionSlug, GlobalSlug } from 'payload'
import {
  Image,
  LucideProps,
  Star,
  User,
MousePointer2,
  Inbox,
  List
} from 'lucide-react'
import { ExoticComponent } from 'react'

export const navIconMap: Partial<
  Record<CollectionSlug | GlobalSlug, ExoticComponent<LucideProps>>
> = {
  media: Image,
  brands: Star,
  users: User,
  constants: List,
  forms: MousePointer2,
  "form-submissions": Inbox,
}

export const getNavIcon = (slug: string) =>
  Object.hasOwn(navIconMap, slug) ? navIconMap[slug as CollectionSlug | GlobalSlug] : undefined
