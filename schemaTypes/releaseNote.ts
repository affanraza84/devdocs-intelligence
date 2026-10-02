import {defineField, defineType} from 'sanity'

export const releaseNote = defineType({
  name: 'releaseNote',
  title: 'Release Note',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'version',
      title: 'Version',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'product',
      title: 'Product',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'releaseDate',
      title: 'Release Date',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 4,
    }),

    defineField({
      name: 'changes',
      title: 'Changes',
      type: 'array',
      of: [{type: 'block'}],
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'breakingChanges',
      title: 'Breaking Changes',
      type: 'array',
      of: [{type: 'string'}],
    }),

    defineField({
      name: 'deprecatedFeatures',
      title: 'Deprecated Features',
      type: 'array',
      of: [{type: 'string'}],
    }),

    defineField({
      name: 'affectedFeatures',
      title: 'Affected Features',
      type: 'array',
      of: [{type: 'string'}],
    }),

    defineField({
      name: 'affectedApis',
      title: 'Affected APIs',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'apiReference'}],
        },
      ],
    }),

    defineField({
      name: 'relatedDocumentation',
      title: 'Related Documentation',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'documentation'}],
        },
      ],
    }),

    defineField({
      name: 'migrationGuides',
      title: 'Migration Guides',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'migrationGuide'}],
        },
      ],
    }),

    defineField({
      name: 'sourceTitle',
      title: 'Source Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'sourceUrl',
      title: 'Source URL',
      type: 'url',
      validation: (Rule) => Rule.required(),
    }),
  ],

  preview: {
    select: {
      title: 'title',
      subtitle: 'version',
    },
  },
})
