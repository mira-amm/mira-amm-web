import { CollectionSlug, GlobalSlug } from 'payload'
import {
  Image,
  LucideProps,
  Star,
  Library,
  Figma,
  User,
  Coins,
MousePointer2,
  Inbox,
} from 'lucide-react'
import { ExoticComponent } from 'react'

export const navIconMap: Partial<
  Record<CollectionSlug | GlobalSlug, ExoticComponent<LucideProps>>
> = {
  app: Coins,
  design: Figma,
  docs: Library,
  users: User,
  brands: Star,
  media: Image,
  forms: MousePointer2,
  "form-submissions": Inbox,
}

export const getNavIcon = (slug: string) =>
  Object.hasOwn(navIconMap, slug) ? navIconMap[slug as CollectionSlug | GlobalSlug] : undefined
