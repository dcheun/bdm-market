// The media files the user can upload.

import { Access, CollectionConfig } from 'payload/types';
import { User } from '../payload-types';

const isAdminOrHasAccessToImages =
  (): Access =>
  async ({ req }) => {
    const user = req.user as User | undefined;
    if (!user) return false;
    if (user.role === 'admin') return true;
    // Query constraint.
    return {
      user: {
        equals: req.user.id,
      },
    };
  };

export const Media: CollectionConfig = {
  slug: 'media',
  // Link the images directly with the user for security purposes.
  hooks: {
    beforeChange: [
      ({ req, data }) => {
        return { ...data, user: req.user.id };
      },
    ],
  },
  access: {
    read: async ({ req }) => {
      const referer = req.headers.referer;
      if (!req.user || !referer?.includes('sell')) {
        return true;
      }

      return await isAdminOrHasAccessToImages()({ req });
    },
    // Syntactic sugar. This is equivalent to doing:
    // delete: ({req}) => isAdminOrHasAccessToImages()({req})
    delete: isAdminOrHasAccessToImages(),
    update: isAdminOrHasAccessToImages(),
  },
  // It doesn't make sense for the media to be a separate category on the
  // dashboard. This removes it from view. However, it should still work
  // as expected when uploading via the Product creation page.
  admin: {
    hidden: ({ user }) => user.role !== 'admin',
  },
  upload: {
    staticURL: '/media',
    staticDir: 'media',
    // To generate different sizes during upload.
    // Optimize pages.
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 1024,
        position: 'centre',
      },
      {
        name: 'tablet',
        width: 1024,
        // Automatically calculates the height and retain aspect ratio.
        height: undefined,
        position: 'centre',
      },
    ],
    // Restrict file types to images.
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      // Don't show on dashboard.
      admin: {
        condition: () => false,
      },
    },
  ],
};
