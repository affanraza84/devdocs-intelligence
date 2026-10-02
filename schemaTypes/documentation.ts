import {defineField, defineType} from 'sanity'

export const documentation = defineType({
  name: 'documentation',
  title: 'Documentation',
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
      name: 'version',
      title: 'Version',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          'Getting Started',
          'Routing',
          'Data Fetching',
          'Caching',
          'Authentication',
          'Performance',
          'Deployment',
          'Configuration',
          'Other',
        ],
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 3,
    }),

    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [{type: 'block'}],
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'string'}],
    }),

    defineField({
      name: 'relatedApis',
      title: 'Related APIs',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'apiReference'}],
        },
      ],
    }),

    defineField({
      name: 'relatedMigrations',
      title: 'Related Migration Guides',
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

    defineField({
      name: 'lastUpdated',
      title: 'Last Updated',
      type: 'datetime',
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
