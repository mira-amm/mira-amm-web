import { CollectionSlug, GlobalSlug } from 'payload'
import {
  Image,
  LucideProps,
  Star,
  Library,
  Figma,
Database,
  TableColumnsSplit,
  SearchCheck,
  User,
  Coins,
MousePointer2,
  Inbox,
  MapPin
} from 'lucide-react'
import { ExoticComponent } from 'react'

export const navIconMap: Partial<
  Record<CollectionSlug | GlobalSlug, ExoticComponent<LucideProps>>
> = {
  app: Coins,
  docs: Library,
  "drizzle-studio": Database,
  "database-schema": TableColumnsSplit,
  graph: MapPin,
  figma: Figma,
  storybook: SearchCheck,
  users: User,
  brands: Star,
  media: Image,
  forms: MousePointer2,
  "form-submissions": Inbox,
}

export const getNavIcon = (slug: string) =>
  Object.hasOwn(navIconMap, slug) ? navIconMap[slug as CollectionSlug | GlobalSlug] : undefined
