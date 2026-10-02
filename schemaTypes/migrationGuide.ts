import {defineField, defineType} from 'sanity'

export const migrationGuide = defineType({
  name: 'migrationGuide',
  title: 'Migration Guide',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'product',
      title: 'Product',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'fromVersion',
      title: 'From Version',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'toVersion',
      title: 'To Version',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 4,
    }),

    defineField({
      name: 'breakingChanges',
      title: 'Breaking Changes',
      type: 'array',
      of: [{type: 'string'}],
    }),

    defineField({
      name: 'migrationSteps',
      title: 'Migration Steps',
      type: 'array',
      of: [{type: 'block'}],
      validation: (Rule) => Rule.required(),
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
      name: 'relatedReleaseNotes',
      title: 'Related Release Notes',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'releaseNote'}],
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
      subtitle: 'product',
    },
  },
})
